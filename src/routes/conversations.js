const express = require('express');
const router = express.Router({ mergeParams: true });
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation schema
const messageCreateSchema = Joi.object({
  content: Joi.string().min(1).max(4000).required()
});

/**
 * GET /api/agents/:agentId/conversations
 * Get all conversations for agent
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isActive = req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', agentId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    if (search) {
      query = query.or(`contact_name.ilike.%${search}%,contact_number.ilike.%${search}%`);
    }

    const { data: conversations, error } = await query;

    if (error) {
      logger.error('Conversations fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Get last message for each conversation
    for (const conv of conversations) {
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content, created_at, direction')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      conv.last_message = lastMessage || null;
    }

    // Get total count
    let countQuery = supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    if (isActive !== undefined) {
      countQuery = countQuery.eq('is_active', isActive);
    }

    const { count } = await countQuery;

    res.json({
      conversations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/conversations/:conversationId
 * Get conversation details
 */
router.get('/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/conversations/:conversationId/messages
 * Get messages for conversation
 */
router.get('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // cursor for pagination
    const offset = (page - 1) * limit;

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Get total count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/:agentId/conversations/:conversationId/messages
 * Manually send message (admin override)
 */
router.post('/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { agentId, conversationId } = req.params;
    const { error, value } = messageCreateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('contact_number')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Send via WhatsApp
    const whatsappService = require('../services/whatsapp');
    const chatId = `${conversation.contact_number}@c.us`;
    
    try {
      const result = await whatsappService.sendMessage(agentId, chatId, value.content);

      // Save message to database
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          agent_id: agentId,
          direction: 'outgoing',
          content: value.content,
          message_type: 'text',
          whatsapp_message_id: result.messageId,
          status: 'sent',
          is_ai_response: false
        })
        .select()
        .single();

      if (msgError) {
        logger.error('Message save error:', msgError);
      }

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      res.status(201).json(message);
    } catch (whatsappError) {
      logger.error('WhatsApp send error:', whatsappError);
      return res.status(500).json({ error: 'Failed to send message via WhatsApp' });
    }
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
