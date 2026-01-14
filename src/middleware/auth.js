const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate requests using Supabase JWT token (required)
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    logger.info('Auth check:', { 
      path: req.path, 
      method: req.method,
      hasAuthHeader: !!authHeader 
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No valid authorization header', { path: req.path });
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authorization token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    logger.debug('Token extracted', { tokenLength: token.length });

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.warn('Token verification error', { 
        error: error.message,
        path: req.path 
      });
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    if (!user) {
      logger.warn('No user found with token', { path: req.path });
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }

    logger.info('User authenticated', { userId: user.id, path: req.path });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to authenticate requests using Supabase JWT token (optional)
 * - If token is valid, attaches req.user
 * - If token is missing/invalid, DOES NOT return 401, simply continues without user
 *   (useful for routes like dashboard overview where we can show default/empty data)
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    logger.info('Optional auth check:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!authHeader,
    });

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Optional token verification failed', {
        error: error?.message,
        path: req.path,
      });
      req.user = null;
      return next();
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
    };

    logger.info('Optional auth succeeded', { userId: user.id, path: req.path });
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    // On error, continue without user
    req.user = null;
    next();
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
        logger.warn('Access denied', { 
          userId, 
          resourceUserId, 
          resourceType,
          path: req.path 
        });
        return res.status(403).json({ 
          success: false,
          error: 'Forbidden',
          message: 'Access denied' 
        });
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        message: 'Authorization error' 
      });
    }
  };
};

module.exports = {
  authenticate,
  authenticateOptional,
  checkOwnership
};
