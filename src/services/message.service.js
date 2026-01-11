const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * MessageService - Handles message and conversation operations
 */
class MessageService {
  /**
   * Get or create a conversation for an agent and customer
   * @param {string} agentId - Agent ID
   * @param {string} customerPhone - Customer phone number
   * @param {string} customerName - Customer name
   * @returns {Promise<Object>} Conversation object
   */
  async getOrCreateConversation(agentId, customerPhone, customerName) {
    try {
      // Try to find existing active conversation
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('customer_phone', customerPhone)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (existingConversation && !findError) {
        logger.info(`Found existing conversation: ${existingConversation.id}`);
        return existingConversation;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          customer_phone: customerPhone,
          customer_name: customerName || 'Unknown',
          status: 'active',
          message_count: 0,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        logger.error('Conversation creation error:', createError);
        throw new Error('Failed to create conversation: ' + createError.message);
      }

      logger.info(`Created new conversation: ${newConversation.id}`);
      return newConversation;
    } catch (error) {
      logger.error('getOrCreateConversation error:', error);
      throw error;
    }
  }

  /**
   * Save incoming message to database
   * @param {string} conversationId - Conversation ID
   * @param {string} agentId - Agent ID
   * @param {string} content - Message content
   * @param {string} whatsappMessageId - WhatsApp message ID
   * @returns {Promise<Object>} Saved message object
   */
  async saveIncomingMessage(conversationId, agentId, content, whatsappMessageId) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          agent_id: agentId,
          direction: 'incoming',
          content: content,
          whatsapp_message_id: whatsappMessageId,
          ai_processed: false,
          credits_used: 0
        })
        .select()
        .single();

      if (error) {
        logger.error('Save incoming message error:', error);
        throw new Error('Failed to save message: ' + error.message);
      }

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      logger.info(`Saved incoming message: ${message.id}`);
      return message;
    } catch (error) {
      logger.error('saveIncomingMessage error:', error);
      throw error;
    }
  }

  /**
   * Save outgoing message to database
   * @param {string} conversationId - Conversation ID
   * @param {string} agentId - Agent ID
   * @param {string} content - Message content
   * @param {number} creditsUsed - Credits used for this message
   * @param {string} whatsappMessageId - WhatsApp message ID (optional)
   * @returns {Promise<Object>} Saved message object
   */
  async saveOutgoingMessage(conversationId, agentId, content, creditsUsed, whatsappMessageId = null) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          agent_id: agentId,
          direction: 'outgoing',
          content: content,
          whatsapp_message_id: whatsappMessageId,
          ai_processed: true,
          credits_used: creditsUsed
        })
        .select()
        .single();

      if (error) {
        logger.error('Save outgoing message error:', error);
        throw new Error('Failed to save message: ' + error.message);
      }

      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      logger.info(`Saved outgoing message: ${message.id}`);
      return message;
    } catch (error) {
      logger.error('saveOutgoingMessage error:', error);
      throw error;
    }
  }

  /**
   * Update conversation statistics
   * @param {string} conversationId - Conversation ID
   * @param {number} messageCount - New message count
   * @returns {Promise<void>}
   */
  async updateConversationStats(conversationId, messageCount) {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          message_count: messageCount,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        logger.error('Update conversation stats error:', error);
        throw new Error('Failed to update stats: ' + error.message);
      }
    } catch (error) {
      logger.error('updateConversationStats error:', error);
      throw error;
    }
  }

  /**
   * Get message count for a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<number>} Message count
   */
  async getMessageCount(conversationId) {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (error) {
        logger.error('Get message count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.error('getMessageCount error:', error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new MessageService();
