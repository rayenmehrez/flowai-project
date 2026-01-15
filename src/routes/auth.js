const express = require('express');
const router = express.Router();
const { supabase, supabaseAnon } = require('../config/supabase');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const logger = require('../utils/logger');
const Joi = require('joi');

// Test endpoint to verify routes are loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!', timestamp: new Date().toISOString() });
});

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().max(100).optional().allow('', null),
  phone_number: Joi.string().max(20).optional().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().max(100).optional().allow('', null),
  phone_number: Joi.string().max(20).optional().allow(''),
  avatar_url: Joi.string().uri().optional().allow(''),
  timezone: Joi.string().optional(),
  language: Joi.string().valid('en', 'es', 'fr', 'ar', 'pt', 'de', 'it', 'zh').optional()
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    // Log incoming request for debugging
    logger.info('Register request received:', { 
      fields: Object.keys(req.body),
      email: req.body.email 
    });

    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error:', error.details[0].message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        message: error.details[0].message 
      });
    }

    const { 
      email, 
      password, 
      full_name,
      company_name, 
      phone_number
    } = value;

    logger.info('Processed registration data:', { 
      email, 
      full_name,
      company_name
    });

    // Use Supabase Admin API to create user (required when using service role key)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        company_name: company_name || null,
        phone_number: phone_number || null
      }
    });

    if (authError) {
      logger.error('Registration error:', authError);
      
      // Handle specific Supabase errors
      let statusCode = 400;
      let errorMessage = authError.message || 'Failed to create user';
      
      // User already exists
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already been registered') ||
          authError.message?.includes('User already registered') ||
          authError.status === 422) {
        statusCode = 422;
        errorMessage = 'This email address is already registered. Please try logging in instead.';
      }
      
      // Invalid email
      if (authError.message?.includes('Invalid email') || 
          authError.message?.includes('email address')) {
        statusCode = 400;
        errorMessage = 'Please enter a valid email address.';
      }
      
      // Password too weak
      if (authError.message?.includes('Password') || 
          authError.message?.includes('password')) {
        statusCode = 400;
        errorMessage = 'Password must be at least 8 characters long.';
      }
      
      return res.status(statusCode).json({ 
        success: false,
        error: errorMessage,
        code: authError.status || 'REGISTRATION_ERROR'
      });
    }

    if (!authData || !authData.user) {
      return res.status(500).json({ 
        success: false,
        error: 'User creation failed - no user data returned' 
      });
    }

    // Create user profile
    const profile = {
      id: authData.user.id,
      email,
      full_name,
      company_name: company_name || null,
      phone_number: phone_number || null
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profile);

    if (profileError) {
      logger.error('Profile creation error:', profileError);
      // Try to delete the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        logger.error('Failed to delete user after profile creation error:', deleteError);
      }
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create user profile: ' + profileError.message 
      });
    }

    // Generate session token using admin API
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
        user_id: authData.user.id
      });

      if (!sessionError && sessionData) {
        return res.status(201).json({
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            full_name,
            company_name: company_name || null,
            phone_number: phone_number || null,
            credits_balance: 100
          },
          session: sessionData.session || sessionData,
          message: 'Account created successfully'
        });
      }
    } catch (sessionErr) {
      logger.warn('Session creation failed, user will need to login:', sessionErr.message);
    }

    // If session creation fails, return user data - frontend can login separately
    res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        company_name: company_name || null,
        phone_number: phone_number || null,
        credits_balance: 100
      },
      message: 'Account created successfully. Please login.'
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error: ' + error.message 
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      logger.warn('Login failed:', { email, error: loginError.message });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      logger.error('Profile fetch error:', profileError);
    }

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      },
      session: data.session
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({ error: 'Failed to logout' });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      logger.error('Password reset error:', error);
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If email exists, password reset link has been sent' });
    }

    res.json({ message: 'If email exists, password reset link has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      logger.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      ...profile
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/session
 * Get current user session and profile
 * - Reads auth token from cookie "auth-token" OR Authorization header
 * - Validates token against database using SQL function
 * - Returns user object with id, email, name
 * - Returns 401 if no token or invalid token
 * - Returns 500 if database error
 */
router.get('/session', async (req, res) => {
  try {
    // Get token from cookie first, then fallback to Authorization header
    let token = req.cookies?.['auth-token'] || req.cookies?.authToken;
    
    // Fallback to Authorization header if no cookie
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    logger.info('Session endpoint called', {
      hasCookie: !!req.cookies,
      cookieNames: req.cookies ? Object.keys(req.cookies) : [],
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      hasAuthHeader: !!req.headers.authorization
    });

    // Check if token exists
    if (!token) {
      logger.warn('Session endpoint called without auth-token cookie or Authorization header');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided. Please log in.',
        user: null
      });
    }

    // Validate token with Supabase to get user ID
    let userId;
    let userEmail;
    
    try {
      const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError || !user) {
        logger.warn('Token validation failed', {
          error: tokenError?.message,
          hasUser: !!user
        });
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token. Please log in again.',
          user: null
        });
      }

      userId = user.id;
      userEmail = user.email;
      
      logger.info('Token validated successfully', { userId, email: userEmail });
    } catch (tokenValidationError) {
      logger.error('Token validation error:', tokenValidationError);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Failed to validate authentication token.',
        user: null
      });
    }

    // Validate token and get user from database using SQL function
    try {
      const { data: userData, error: dbError } = await supabase.rpc('validate_token_and_get_user', {
        p_user_id: userId
      });

      if (dbError) {
        logger.error('Database function error:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Failed to validate user session. Please try again later.',
          user: null
        });
      }

      if (!userData) {
        logger.warn('User not found in database', { userId });
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not found. Please log in again.',
          user: null
        });
      }

      // Success - return user data
      logger.info('Session retrieved successfully', {
        userId: userData.id,
        email: userData.email,
        hasProfile: userData.profile_exists
      });

      res.json({
        success: true,
        user: {
          id: userData.id,
          email: userData.email || userEmail,
          full_name: userData.name || userData.email || 'User',
          company_name: userData.company_name || null
        }
      });

    } catch (dbFunctionError) {
      logger.error('Database function execution error:', dbFunctionError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to retrieve user data. Please try again later.',
        user: null
      });
    }

  } catch (error) {
    logger.error('Session endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      user: null,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(value)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      logger.error('Profile update error:', updateError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      full_name: profile.full_name,
      company_name: profile.company_name,
      phone_number: profile.phone_number,
      avatar_url: profile.avatar_url,
      timezone: profile.timezone,
      language: profile.language,
      credits_balance: profile.credits_balance,
      api_quota_used: profile.api_quota_used,
      api_quota_limit: profile.api_quota_limit
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
