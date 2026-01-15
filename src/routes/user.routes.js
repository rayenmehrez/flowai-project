const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

console.log('Loading user routes...');

// Validation schema for profile updates with security rules
const profileUpdateSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/) // Only letters, spaces, hyphens, apostrophes
    .required()
    .messages({
      'string.pattern.base': 'Full name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Full name is required'
    }),
  company_name: Joi.string()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s&.,'-]*$/) // Alphanumeric and common business characters
    .optional()
    .allow('', null),
  phone_number: Joi.string()
    .max(20)
    .pattern(/^[\d+\-() ]+$/) // Only digits, +, -, (, ), spaces
    .optional()
    .allow('', null),
  avatar_url: Joi.string()
    .uri({ scheme: ['http', 'https'] }) // Only allow http/https
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.uri': 'Avatar URL must be a valid HTTP/HTTPS URL'
    }),
  timezone: Joi.string()
    .max(50)
    .pattern(/^[a-zA-Z/_-]+$/) // Valid timezone format
    .optional(),
  language: Joi.string()
    .valid('en', 'es', 'fr', 'ar', 'pt', 'de', 'it', 'zh')
    .optional()
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/user/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info('Get profile for user:', userId);

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Profile fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        message: error.message
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile: {
        id: profile.id,
        email: req.user.email,
        full_name: profile.full_name,
        company_name: profile.company_name,
        phone_number: profile.phone_number,
        avatar_url: profile.avatar_url,
        timezone: profile.timezone,
        language: profile.language,
        credits_balance: profile.credits_balance,
        api_quota_used: profile.api_quota_used,
        api_quota_limit: profile.api_quota_limit,
        max_agents: profile.max_agents,
        max_messages_per_day: profile.max_messages_per_day,
        created_at: profile.created_at
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/user/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { error: validationError, value } = profileUpdateSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: validationError.details[0].message
      });
    }

    logger.info('Update profile for user:', userId);

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(value)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        message: error.message
      });
    }

    res.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/user/credits
 * Get user's credit balance and usage
 */
router.get('/user/credits', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('credits_balance, credits_used_total, api_quota_used, api_quota_limit, last_quota_reset')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error('Credits fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch credits',
        message: error.message
      });
    }

    res.json({
      success: true,
      credits: {
        balance: profile.credits_balance || 0,
        used_total: profile.credits_used_total || 0,
        api_quota_used: profile.api_quota_used || 0,
        api_quota_limit: profile.api_quota_limit || 10000,
        last_reset: profile.last_quota_reset
      }
    });
  } catch (error) {
    logger.error('Get credits error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});


/**
 * GET /api/user/stats
 * Get user statistics for dashboard
 */
router.get('/user/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get agent count
    const { count: agentCount } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get connected agents count
    const { count: connectedAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'connected');

    // Get today's message count
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAnalytics } = await supabase
      .from('analytics')
      .select('total_messages')
      .gte('date', today)
      .in('agent_id', supabase.from('agents').select('id').eq('user_id', userId));

    const totalMessagesToday = todayAnalytics?.reduce((sum, a) => sum + (a.total_messages || 0), 0) || 0;

    // Get active conversations count
    const { count: activeConversations } = await supabase
      .from('conversations')
      .select('*, agents!inner(*)', { count: 'exact', head: true })
      .eq('agents.user_id', userId)
      .eq('is_active', true);

    // Get profile for credits info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('credits_balance, api_quota_used, api_quota_limit')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      stats: {
        total_agents: agentCount || 0,
        connected_agents: connectedAgents || 0,
        messages_today: totalMessagesToday,
        active_conversations: activeConversations || 0,
        credits_balance: profile?.credits_balance || 0,
        api_quota_used: profile?.api_quota_used || 0,
        api_quota_limit: profile?.api_quota_limit || 10000
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/user/usage
 * Get detailed API usage history
 */
router.get('/user/usage', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const { data: usage, error, count } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      logger.error('Usage fetch error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch usage',
        message: error.message
      });
    }

    res.json({
      success: true,
      usage: usage || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

console.log('User routes loaded');

module.exports = router;
