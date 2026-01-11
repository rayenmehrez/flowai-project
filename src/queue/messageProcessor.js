const Queue = require('bull');
const { supabase } = require('../config/supabase');
const { isRedisAvailable, getRedisConfig } = require('../config/redis');
const aiService = require('../services/ai');
const logger = require('../utils/logger');

// Lazy load whatsappService to avoid circular dependency
// whatsappService imports addMessage from this file, so we load it only when needed
let whatsappService = null;
function getWhatsappService() {
  if (!whatsappService) {
    whatsappService = require('../services/whatsapp');
  }
  return whatsappService;
}

// Get Redis configuration
const redisConfig = getRedisConfig();

// Create Bull queue only if Redis config is available
// Note: We check config availability, not connection status, as connection is async
let messageQueue = null;

if (redisConfig) {
  try {
    messageQueue = new Queue('message-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      },
      // Suppress connection errors - we handle them gracefully
      settings: {
        lockDuration: 30000,
        lockRenewTime: 15000
      }
    });

    logger.info('✅ Message queue initialized (Redis connection will be established asynchronously)');
    
    // Handle queue errors gracefully
    messageQueue.on('error', (error) => {
      // Suppress ECONNREFUSED errors - they're expected if Redis is not available
      if (error.message && !error.message.includes('ECONNREFUSED')) {
        logger.error('❌ Queue error:', error.message);
      }
      if (error.message && (error.message.includes('ECONNREFUSED') || error.message.includes('Connection'))) {
        logger.warn('⚠️  Redis connection failed. Queue operations will fail until Redis is available.');
        logger.warn('⚠️  The app will continue to run, but WhatsApp message processing is disabled.');
      }
    });

    // Handle stalled jobs
    messageQueue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`);
    });
  } catch (error) {
    logger.error('❌ Failed to create message queue:', error.message);
    logger.warn('⚠️  Message queue will not be available');
    logger.warn('⚠️  The app will continue to run, but WhatsApp message processing is disabled.');
    messageQueue = null;
  }
} else {
  logger.warn('⚠️  REDIS_URL is not configured. Message queue will not be initialized.');
  logger.warn('⚠️  WhatsApp messages will not be processed until Redis is configured.');
  logger.warn('⚠️  Set REDIS_URL environment variable to enable message processing.');
  logger.warn('⚠️  The app will continue to run normally without message queue.');
}

/**
 * Process incoming WhatsApp message
 */
if (messageQueue) {
  messageQueue.process(5, async (job) => {
  const { agentId, from, body, timestamp, messageId, contactName } = job.data;
  
  logger.info(`Processing message for agent ${agentId}`, { from, messageId });

  try {
    // Get or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('contact_number', from.replace('@c.us', ''))
      .single();

    if (convError && convError.code === 'PGRST116') {
      // Conversation doesn't exist, create it
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          contact_number: from.replace('@c.us', ''),
          contact_name: contactName,
          is_active: true,
          last_message_at: timestamp
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create conversation: ${createError.message}`);
      }
      conversation = newConv;
    } else if (convError) {
      throw new Error(`Failed to get conversation: ${convError.message}`);
    } else {
      // Update conversation
      await supabase
        .from('conversations')
        .update({
          contact_name: contactName || conversation.contact_name,
          last_message_at: timestamp,
          is_active: true
        })
        .eq('id', conversation.id);
    }

    // Save incoming message
    const { data: savedMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        agent_id: agentId,
        direction: 'incoming',
        content: body,
        message_type: 'text',
        whatsapp_message_id: messageId,
        whatsapp_timestamp: timestamp,
        status: 'delivered'
      })
      .select()
      .single();

    if (msgError) {
      throw new Error(`Failed to save message: ${msgError.message}`);
    }

    // Get agent to check if active and get response delay
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('is_active, response_delay')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    if (!agent.is_active) {
      logger.info(`Agent ${agentId} is inactive, skipping AI response`);
      return { success: true, skipped: true };
    }

    // Apply response delay
    if (agent.response_delay > 0) {
      await new Promise(resolve => setTimeout(resolve, agent.response_delay * 1000));
    }

    // Generate AI response
    const aiResult = await aiService.generateResponse(
      agentId,
      conversation.id,
      body
    );

    // Send response via WhatsApp
    const chatId = `${conversation.contact_number}@c.us`;
    const sendResult = await getWhatsappService().sendMessage(
      agentId,
      chatId,
      aiResult.response
    );

    // Save outgoing message
    const { data: responseMessage, error: responseError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        agent_id: agentId,
        direction: 'outgoing',
        content: aiResult.response,
        message_type: 'text',
        whatsapp_message_id: sendResult.messageId,
        status: 'sent',
        is_ai_response: true,
        ai_model: 'anthropic/claude-3.5-sonnet',
        tokens_used: aiResult.tokensUsed,
        processing_time_ms: aiResult.processingTime
      })
      .select()
      .single();

    if (responseError) {
      logger.error('Failed to save response message:', responseError);
    }

    // Update analytics (increment counters)
    const today = new Date().toISOString().split('T')[0];
    
    // Get current analytics or create new
    const { data: currentAnalytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('agent_id', agentId)
      .eq('date', today)
      .single();

    const { count: activeConvs } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('is_active', true);

    if (currentAnalytics) {
      await supabase
        .from('analytics')
        .update({
          total_messages: (currentAnalytics.total_messages || 0) + 2,
          incoming_messages: (currentAnalytics.incoming_messages || 0) + 1,
          outgoing_messages: (currentAnalytics.outgoing_messages || 0) + 1,
          ai_responses: (currentAnalytics.ai_responses || 0) + 1,
          tokens_used: (currentAnalytics.tokens_used || 0) + aiResult.tokensUsed,
          active_conversations: activeConvs || 0
        })
        .eq('id', currentAnalytics.id);
    } else {
      await supabase
        .from('analytics')
        .insert({
          agent_id: agentId,
          date: today,
          total_messages: 2,
          incoming_messages: 1,
          outgoing_messages: 1,
          ai_responses: 1,
          tokens_used: aiResult.tokensUsed,
          active_conversations: activeConvs || 0
        });
    }

    logger.info(`Message processed successfully for agent ${agentId}`);
    return {
      success: true,
      messageId: savedMessage.id,
      responseId: responseMessage?.id,
      tokensUsed: aiResult.tokensUsed
    };
  } catch (error) {
    logger.error(`Message processing failed for agent ${agentId}:`, error);
    throw error; // Will trigger retry
  }
  });

  // Queue event handlers
  messageQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed`, result);
  });

  messageQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
  });

  messageQueue.on('error', (error) => {
    logger.error('Queue error:', error);
  });
}

/**
 * Add message to queue for processing
 * Returns false if queue is not available
 */
function addMessage(messageData) {
  if (!messageQueue) {
    logger.warn('⚠️  Cannot add message to queue: Redis is not available');
    return false;
  }
  
  try {
    return messageQueue.add(messageData);
  } catch (error) {
    logger.error('Failed to add message to queue:', error);
    return false;
  }
}

module.exports = {
  messageQueue,
  addMessage,
  isQueueAvailable: () => messageQueue !== null
};
