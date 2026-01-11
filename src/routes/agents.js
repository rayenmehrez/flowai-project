const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate, checkOwnership } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');
const whatsappService = require('../services/whatsapp');
const knowledgeRoutes = require('./knowledge');
const conversationRoutes = require('./conversations');
const analyticsRoutes = require('./analytics');

// Validation schemas
const agentCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  personality: Joi.string().max(1000).optional(),
  language: Joi.string().valid('en', 'es', 'fr', 'ar', 'pt', 'de', 'it', 'zh').optional(),
  response_delay: Joi.number().integer().min(0).max(10).optional(),
  max_context_messages: Joi.number().integer().min(5).max(50).optional()
});

const agentUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  personality: Joi.string().max(1000).optional(),
  language: Joi.string().valid('en', 'es', 'fr', 'ar', 'pt', 'de', 'it', 'zh').optional(),
  response_delay: Joi.number().integer().min(0).max(10).optional(),
  max_context_messages: Joi.number().integer().min(5).max(50).optional(),
  is_active: Joi.boolean().optional()
});

// Mount sub-routes
router.use('/:agentId/knowledge', checkOwnership('agent'), knowledgeRoutes);
router.use('/:agentId/conversations', checkOwnership('agent'), conversationRoutes);
router.use('/:agentId/analytics', checkOwnership('agent'), analyticsRoutes);

/**
 * GET /api/agents
 * Get all agents for authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Agents fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }

    // Get total count
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    res.json({
      agents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    logger.error('Get agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents
 * Create new agent
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { error, value } = agentCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const agentData = {
      user_id: req.user.id,
      name: value.name,
      description: value.description || '',
      personality: value.personality || 'You are a helpful and friendly AI assistant.',
      language: value.language || 'en',
      response_delay: value.response_delay ?? 2,
      max_context_messages: value.max_context_messages ?? 20,
      is_active: true,
      status: 'disconnected'
    };

    const { data: agent, error: insertError } = await supabase
      .from('agents')
      .insert(agentData)
      .select()
      .single();

    if (insertError) {
      logger.error('Agent creation error:', insertError);
      return res.status(500).json({ error: 'Failed to create agent' });
    }

    res.status(201).json(agent);
  } catch (error) {
    logger.error('Create agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId
 * Get agent details
 */
router.get('/:agentId', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    logger.error('Get agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/agents/:agentId
 * Update agent
 */
router.put('/:agentId', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { error, value } = agentUpdateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: agent, error: updateError } = await supabase
      .from('agents')
      .update(value)
      .eq('id', agentId)
      .select()
      .single();

    if (updateError) {
      logger.error('Agent update error:', updateError);
      return res.status(500).json({ error: 'Failed to update agent' });
    }

    res.json(agent);
  } catch (error) {
    logger.error('Update agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/agents/:agentId
 * Delete agent
 */
router.delete('/:agentId', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;

    // Disconnect WhatsApp if connected
    await whatsappService.disconnect(agentId);

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      logger.error('Agent deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete agent' });
    }

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    logger.error('Delete agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/:agentId/connect
 * Initiate WhatsApp connection
 */
router.post('/:agentId/connect', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;

    const result = await whatsappService.connect(agentId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      qr_code: result.qrCode,
      status: 'connecting'
    });
  } catch (error) {
    logger.error('Connect agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/connection-status
 * Get connection status
 */
router.get('/:agentId/connection-status', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;

    const { data: agent, error } = await supabase
      .from('agents')
      .select('status, phone_number, qr_code')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      status: agent.status,
      connected: agent.status === 'connected',
      phone_number: agent.phone_number,
      qr_code: agent.qr_code
    });
  } catch (error) {
    logger.error('Connection status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/agents/:agentId/disconnect
 * Disconnect WhatsApp
 */
router.post('/:agentId/disconnect', authenticate, checkOwnership('agent'), async (req, res) => {
  try {
    const { agentId } = req.params;

    await whatsappService.disconnect(agentId);

    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    logger.error('Disconnect agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
