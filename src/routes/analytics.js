const express = require('express');
const router = express.Router({ mergeParams: true });
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/agents/:agentId/analytics/overview
 * Get analytics overview for date range
 */
router.get('/overview', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.end_date || new Date().toISOString().split('T')[0];

    // Get aggregated analytics
    const { data: analytics, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('agent_id', agentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      logger.error('Analytics fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Aggregate totals
    const totals = analytics.reduce((acc, day) => {
      acc.total_messages += day.total_messages || 0;
      acc.incoming_messages += day.incoming_messages || 0;
      acc.outgoing_messages += day.outgoing_messages || 0;
      acc.new_conversations += day.new_conversations || 0;
      acc.active_conversations = Math.max(acc.active_conversations, day.active_conversations || 0);
      acc.ai_responses += day.ai_responses || 0;
      acc.tokens_used += day.tokens_used || 0;
      acc.total_response_time += day.avg_response_time_ms || 0;
      acc.days_with_data++;
      return acc;
    }, {
      total_messages: 0,
      incoming_messages: 0,
      outgoing_messages: 0,
      new_conversations: 0,
      active_conversations: 0,
      ai_responses: 0,
      tokens_used: 0,
      total_response_time: 0,
      days_with_data: 0
    });

    const avgResponseTime = totals.days_with_data > 0 
      ? Math.round(totals.total_response_time / totals.days_with_data)
      : 0;

    // Get unique contacts count
    const { count: uniqueContacts } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Estimate cost (Claude 3.5 Sonnet pricing via OpenRouter)
    const estimatedCost = (totals.tokens_used / 1000000) * 3; // Approximate $3 per 1M tokens

    res.json({
      period: { start_date: startDate, end_date: endDate },
      totals: {
        ...totals,
        unique_contacts: uniqueContacts || 0,
        avg_response_time_ms: avgResponseTime,
        estimated_cost_usd: estimatedCost.toFixed(4)
      },
      daily: analytics
    });
  } catch (error) {
    logger.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/analytics/messages-over-time
 * Get messages over time for chart
 */
router.get('/messages-over-time', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
    const granularity = req.query.granularity || 'day'; // day, week, month

    const { data: analytics, error } = await supabase
      .from('analytics')
      .select('date, total_messages, incoming_messages, outgoing_messages')
      .eq('agent_id', agentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      logger.error('Messages over time error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    res.json({
      granularity,
      data: analytics
    });
  } catch (error) {
    logger.error('Messages over time error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/analytics/peak-hours
 * Get message volume by hour of day
 */
router.get('/peak-hours', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date || new Date().toISOString();

    // Get all messages in date range
    const { data: messages, error } = await supabase
      .from('messages')
      .select('created_at')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      logger.error('Peak hours error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Group by hour (0-23)
    const hourCounts = Array(24).fill(0);
    messages.forEach(msg => {
      const hour = new Date(msg.created_at).getHours();
      hourCounts[hour]++;
    });

    const data = hourCounts.map((count, hour) => ({
      hour,
      count
    }));

    res.json({ data });
  } catch (error) {
    logger.error('Peak hours error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agents/:agentId/analytics/top-contacts
 * Get most active contacts
 */
router.get('/top-contacts', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.end_date || new Date().toISOString();
    const limit = parseInt(req.query.limit) || 10;

    // Get message counts per conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('conversation_id, conversations!inner(contact_name, contact_number)')
      .eq('agent_id', agentId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      logger.error('Top contacts error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Count messages per contact
    const contactCounts = {};
    messages.forEach(msg => {
      const contact = msg.conversations;
      const key = contact.contact_number;
      if (!contactCounts[key]) {
        contactCounts[key] = {
          contact_name: contact.contact_name || contact.contact_number,
          contact_number: contact.contact_number,
          message_count: 0
        };
      }
      contactCounts[key].message_count++;
    });

    // Sort and limit
    const topContacts = Object.values(contactCounts)
      .sort((a, b) => b.message_count - a.message_count)
      .slice(0, limit);

    res.json({ contacts: topContacts });
  } catch (error) {
    logger.error('Top contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
