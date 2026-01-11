const axios = require('axios');
const logger = require('../utils/logger');
const { supabase } = require('../config/supabase');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Generate AI response using Claude via OpenRouter
 */
async function generateResponse(agentId, conversationId, messageContent) {
  const startTime = Date.now();
  
  try {
    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Get active knowledge base entries
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('title, content')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (knowledgeError) {
      logger.error('Knowledge fetch error:', knowledgeError);
    }

    // Build knowledge base context
    const knowledgeContext = knowledgeEntries
      .map(k => `## ${k.title}\n${k.content}`)
      .join('\n\n');

    // Get conversation history (last N messages)
    const { data: historyMessages, error: historyError } = await supabase
      .from('messages')
      .select('direction, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(agent.max_context_messages || 20);

    if (historyError) {
      logger.error('History fetch error:', historyError);
    }

    // Build conversation history
    const conversationHistory = historyMessages
      .reverse()
      .map(msg => {
        const role = msg.direction === 'incoming' ? 'Customer' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    // Construct system prompt
    const systemPrompt = `You are an AI assistant for ${agent.name}. ${agent.description || ''}

Your personality is: ${agent.personality || 'You are a helpful and friendly AI assistant.'}

Here is important information about the business:
${knowledgeContext || 'No specific business information provided.'}

Rules:
- Be helpful and concise
- Use the knowledge base to answer questions accurately
- If you don't know something, admit it politely
- Respond in ${agent.language || 'English'}
- Keep responses short and conversational for WhatsApp
- Do not make up information not in the knowledge base
- Be natural and friendly`;

    // Construct messages array for API
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationHistory) {
      messages.push({ role: 'user', content: conversationHistory });
    }

    // Add current message
    messages.push({ role: 'user', content: `Customer: ${messageContent}\nAssistant:` });

    // Call OpenRouter API
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'FlowAI WhatsApp Agent'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    const tokensUsed = response.data.usage.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    // Calculate estimated cost (Claude 3.5 Sonnet pricing)
    const estimatedCost = (tokensUsed / 1000000) * 3; // Approximate $3 per 1M tokens

    // Track API usage
    await supabase
      .from('api_usage')
      .insert({
        user_id: agent.user_id,
        agent_id: agentId,
        endpoint: 'chat/completions',
        model: MODEL,
        tokens_used: tokensUsed,
        estimated_cost_usd: estimatedCost,
        response_time_ms: processingTime
      });

    // Update user quota
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('api_quota_used')
      .eq('id', agent.user_id)
      .single();

    if (currentProfile) {
      await supabase
        .from('user_profiles')
        .update({ api_quota_used: (currentProfile.api_quota_used || 0) + tokensUsed })
        .eq('id', agent.user_id);
    }

    return {
      response: aiResponse,
      tokensUsed,
      processingTime,
      estimatedCost
    };
  } catch (error) {
    logger.error('AI generation error:', error);
    const processingTime = Date.now() - startTime;
    
    // Return fallback response
    return {
      response: "I'm having trouble right now. Please try again later.",
      tokensUsed: 0,
      processingTime,
      estimatedCost: 0,
      error: error.message
    };
  }
}

/**
 * Process WhatsApp message with AI (optimized for WhatsApp)
 * @param {string} agentId - Agent ID
 * @param {string} messageText - Incoming message text
 * @param {string} customerPhone - Customer phone number
 * @returns {Promise<Object>} AI response with message content
 */
async function processWhatsAppMessage(agentId, messageText, customerPhone) {
  const startTime = Date.now();
  
  try {
    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // Get active knowledge base entries
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('question, answer')
      .eq('agent_id', agentId)
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (knowledgeError) {
      logger.error('Knowledge fetch error:', knowledgeError);
    }

    // Build knowledge base context
    const knowledgeContext = knowledgeEntries && knowledgeEntries.length > 0
      ? knowledgeEntries.map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n')
      : 'No specific business information provided.';

    // Construct system prompt optimized for WhatsApp (short, friendly responses)
    const systemPrompt = `You are an AI assistant for ${agent.name || 'a business'}. ${agent.description || ''}

Your personality: ${agent.personality || 'You are helpful, friendly, and concise.'}

Business Information:
${knowledgeContext}

Rules for WhatsApp responses:
- Keep responses SHORT (2-3 sentences maximum)
- Be friendly and conversational
- Use emojis sparingly (1-2 per message)
- Answer questions based on the knowledge base
- If you don't know something, politely say so
- Respond in ${agent.language || 'English'}
- Be natural and helpful
- Never make up information not in the knowledge base`;

    // Call OpenRouter API
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messageText }
        ],
        max_tokens: 200, // Shorter for WhatsApp
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'FlowAI WhatsApp Agent'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    const tokensUsed = response.data.usage.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    logger.info(`AI processed WhatsApp message for agent ${agentId}. Tokens: ${tokensUsed}, Time: ${processingTime}ms`);

    return {
      response: aiResponse,
      tokensUsed,
      processingTime
    };
  } catch (error) {
    logger.error('AI WhatsApp processing error:', error);
    const processingTime = Date.now() - startTime;
    
    // Return fallback response
    return {
      response: "I'm having trouble right now. Please try again later. 😊",
      tokensUsed: 0,
      processingTime,
      error: error.message
    };
  }
}

module.exports = {
  generateResponse,
  processWhatsAppMessage
};
