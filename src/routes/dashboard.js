const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateOptional } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/dashboard/overview
 * Get dashboard overview for all user's agents
 * - Uses optional authentication:
 *   - If user is authenticated → returns real stats
 *   - If not authenticated    → returns empty/default stats (never 401)
 */
router.get('/overview', authenticateOptional, async (req, res) => {
  try {
    const userId = req.user?.id;

    // If no authenticated user, return empty/default dashboard instead of 401
    if (!userId) {
      logger.info('Dashboard overview requested without authenticated user, returning default data');
      return res.json({
        agents: [],
        totals: {
          total_agents: 0,
          total_messages_today: 0,
          active_conversations: 0,
        },
        recent_activity: [],
      });
    }

    // Get all agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name, description, status, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (agentsError) {
      logger.error('Agents fetch error:', agentsError);
      return res.status(500).json({ error: 'Failed to fetch agents' });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today).toISOString();

    // Get today's message counts across all agents
    const { count: totalMessagesToday } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('agent_id', agents.map(a => a.id))
      .gte('created_at', todayStart);

    // Get active conversations count
    const { count: activeConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('agent_id', agents.map(a => a.id))
      .eq('is_active', true);

    // Get stats for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const { count: messagesToday } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .gte('created_at', todayStart);

        const { count: activeConvs } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id)
          .eq('is_active', true);

        return {
          ...agent,
          messages_today: messagesToday || 0,
          active_conversations: activeConvs || 0
        };
      })
    );

    // Get recent activity (last 10 messages)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        direction,
        created_at,
        agents!inner(id, name)
      `)
      .in('agent_id', agents.map(a => a.id))
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      agents: agentsWithStats,
      totals: {
        total_agents: agents.length,
        total_messages_today: totalMessagesToday || 0,
        active_conversations: activeConversations || 0
      },
      recent_activity: recentMessages || []
    });
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
