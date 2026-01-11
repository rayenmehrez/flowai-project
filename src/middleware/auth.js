const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using Supabase JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authentication failed', { error: error?.message });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware to check if user owns the resource
 */
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { agentId, conversationId, knowledgeId } = req.params;
      const userId = req.user.id;
      let resourceUserId;

      if (agentId) {
        const { data: agent, error } = await supabase
          .from('agents')
          .select('user_id')
          .eq('id', agentId)
          .single();

        if (error || !agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }
        resourceUserId = agent.user_id;
      } else if (conversationId) {
        const { data: conversation, error } = await supabase
          .from('conversations')
          .select('agent_id, agents!inner(user_id)')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        resourceUserId = conversation.agents.user_id;
      } else if (knowledgeId) {
        const { data: knowledge, error } = await supabase
          .from('knowledge_base')
          .select('agent_id, agents!inner(user_id)')
          .eq('id', knowledgeId)
          .single();

        if (error || !knowledge) {
          return res.status(404).json({ error: 'Knowledge entry not found' });
        }
        resourceUserId = knowledge.agents.user_id;
      }

      if (resourceUserId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({ error: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticate,
  checkOwnership
};
