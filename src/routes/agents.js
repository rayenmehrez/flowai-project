const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/agents
 * Get all agents for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Agents fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch agents'
      });
    }

    res.json({
      success: true,
      agents: agents || []
    });
  } catch (error) {
    logger.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/agents
 * Create a new agent
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, personality, knowledge_base, instructions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Agent name is required'
      });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: userId,
        name,
        description: description || '',
        personality: personality || 'helpful and professional',
        knowledge_base: knowledge_base || '',
        instructions: instructions || '',
        status: 'inactive',
        is_active: false
      })
      .select()
      .single();

    if (error) {
      logger.error('Agent creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create agent'
      });
    }

    logger.info('Agent created:', { agentId: agent.id, userId });

    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    logger.error('Create agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/agents/:id
 * Get a specific agent
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !agent) {
      logger.error('Agent fetch error:', error);
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    logger.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/agents/:id
 * Update an agent
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description, personality, knowledge_base, instructions, is_active, status } = req.body;

    // First check if agent exists and belongs to user
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingAgent || existingAgent.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (personality !== undefined) updates.personality = personality;
    if (knowledge_base !== undefined) updates.knowledge_base = knowledge_base;
    if (instructions !== undefined) updates.instructions = instructions;
    if (is_active !== undefined) updates.is_active = is_active;
    if (status !== undefined) updates.status = status;

    updates.updated_at = new Date().toISOString();

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Agent update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update agent'
      });
    }

    logger.info('Agent updated:', { agentId: id, userId });

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    logger.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First check if agent exists and belongs to user
    const { data: existingAgent } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingAgent || existingAgent.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      logger.error('Agent deletion error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete agent'
      });
    }

    logger.info('Agent deleted:', { agentId: id, userId });

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    logger.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
