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

// Validation schemas - Flexible to support both old and new frontend formats
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  // New fields (optional to support legacy frontend)
  first_name: Joi.string().min(1).max(50).optional(),
  last_name: Joi.string().min(1).max(50).optional(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).optional().allow(''),
  // Legacy fields for backward compatibility
  full_name: Joi.string().min(2).optional(),
  name: Joi.string().min(2).optional(), // Some frontends use 'name'
  // Optional fields
  company_name: Joi.string().max(100).optional().allow('', null),
  phone_number: Joi.string().max(20).optional().allow('', null),
  phone: Joi.string().max(20).optional().allow('', null) // Alternative field name
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const profileUpdateSchema = Joi.object({
  first_name: Joi.string().min(1).max(50).optional(),
  last_name: Joi.string().min(1).max(50).optional(),
  username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).optional(),
  full_name: Joi.string().min(2).optional(),
  company_name: Joi.string().min(2).max(100).optional().allow(''),
  phone_number: Joi.string().max(20).optional().allow(''),
  avatar_url: Joi.string().uri().optional().allow(''),
  timezone: Joi.string().optional(),
  language: Joi.string().valid('en', 'es', 'fr', 'ar', 'pt', 'de', 'it', 'zh').optional()
});

/**
 * POST /api/auth/register
 * Register a new user
 * Supports both new format (first_name, last_name) and legacy format (full_name, name)
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
      first_name: providedFirstName, 
      last_name: providedLastName, 
      username,
      company_name, 
      phone_number,
      phone,
      full_name: providedFullName,
      name: providedName
    } = value;

    // Flexible name handling - support multiple input formats
    let first_name = providedFirstName;
    let last_name = providedLastName;
    let full_name = providedFullName || providedName;

    // If we have full_name or name but not first/last, split it
    if (!first_name && !last_name && full_name) {
      const nameParts = full_name.trim().split(' ');
      first_name = nameParts[0] || 'User';
      last_name = nameParts.slice(1).join(' ') || '';
    }

    // If we still don't have names, use email prefix
    if (!first_name) {
      first_name = email.split('@')[0] || 'User';
    }
    if (!last_name) {
      last_name = '';
    }

    // Compute full_name if not provided
    if (!full_name) {
      full_name = `${first_name} ${last_name}`.trim();
    }
    
    // Handle phone number (support both field names)
    const finalPhoneNumber = phone_number || phone || null;
    
    // Generate username if not provided
    const generatedUsername = username || `${first_name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;

    logger.info('Processed registration data:', { 
      email, 
      first_name, 
      last_name, 
      username: generatedUsername 
    });

    // Use Supabase Admin API to create user (required when using service role key)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        full_name,
        username: generatedUsername,
        company_name: company_name || null,
        phone_number: finalPhoneNumber
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

    // Create user profile - try with all fields first, fallback to basic fields
    let profileError = null;
    
    // Try with extended fields first
    const extendedProfile = {
      id: authData.user.id,
      email,
      first_name,
      last_name,
      username: generatedUsername,
      full_name,
      company_name: company_name || null,
      phone_number: finalPhoneNumber
    };

    const { error: extendedError } = await supabase
      .from('user_profiles')
      .insert(extendedProfile);

    if (extendedError) {
      logger.warn('Extended profile creation failed, trying basic profile:', extendedError.message);
      
      // Fallback to basic profile (for databases without new columns)
      const basicProfile = {
        id: authData.user.id,
        full_name,
        company_name: company_name || null,
        phone_number: finalPhoneNumber
      };

      const { error: basicError } = await supabase
        .from('user_profiles')
        .insert(basicProfile);

      profileError = basicError;
    }

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
            first_name,
            last_name,
            username: generatedUsername,
            full_name,
            company_name,
            phone_number,
            subscription_tier: 'free',
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
        first_name,
        last_name,
        username: generatedUsername,
        full_name,
        company_name,
        phone_number,
        subscription_tier: 'free',
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
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    if (!data || !data.user || !data.session) {
      logger.error('Login succeeded but no user/session data returned');
      return res.status(500).json({ 
        success: false,
        error: 'Internal server error: Invalid response from authentication service' 
      });
    }

    // Get user profile - handle errors gracefully
    let profile = null;
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist (PGRST116), that's okay - user can create it later
      if (profileError.code === 'PGRST116') {
        logger.info('Profile not found for user, continuing without profile:', { userId: data.user.id });
      } else {
        // Log other errors but don't fail the login
        logger.error('Profile fetch error (non-critical):', { 
          userId: data.user.id,
          error: profileError.message,
          code: profileError.code 
        });
      }
    } else {
      profile = profileData;
    }

    // Return user data with or without profile
    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...(profile || {}),
        ...(data.user.user_metadata || {})
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
      // If profile doesn't exist, return user data without profile
      if (error.code === 'PGRST116') {
        logger.info('Profile not found for user, returning basic user data:', { userId: req.user.id });
        return res.json({
          success: true,
          id: req.user.id,
          email: req.user.email,
          ...(req.user.user_metadata || {})
        });
      }
      
      logger.error('Profile fetch error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch profile',
        message: error.message 
      });
    }

    res.json({
      success: true,
      id: req.user.id,
      email: req.user.email,
      ...profile
    });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (alternative endpoint)
 * Can be called with session token from login response
 */
router.get('/profile', async (req, res) => {
  try {
    // Get token from Authorization header or query parameter
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    // Validate token and get user
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    
    if (tokenError || !user) {
      logger.warn('Invalid token for profile request:', { error: tokenError?.message });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, return user data without profile
      if (profileError.code === 'PGRST116') {
        logger.info('Profile not found for user, returning basic user data:', { userId: user.id });
        return res.json({
          success: true,
          id: user.id,
          email: user.email,
          ...(user.user_metadata || {})
        });
      }
      
      logger.error('Profile fetch error:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        message: profileError.message
      });
    }

    res.json({
      success: true,
      id: user.id,
      email: user.email,
      ...profile
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
          name: userData.name || userData.email || 'User',
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          username: userData.username || null
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
 * GET /api/auth/session
 * Get current user session and profile
 * - Returns user data with session info
 * - Works with optional authentication (returns 401 if no user)
 * - Used by Next.js dashboard to load user session
 */
router.get('/session', authenticateOptional, async (req, res) => {
  try {
    // If no authenticated user, return 401
    if (!req.user || !req.user.id) {
      logger.warn('Session endpoint called without authenticated user');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No active session. Please log in.',
        session: null,
        user: null
      });
    }

    const userId = req.user.id;

    logger.info('Fetching session for user:', { userId });

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.error('Profile fetch error in session endpoint:', profileError);
      
      // If profile doesn't exist, return user data without profile
      if (profileError.code === 'PGRST116') {
        logger.warn('Profile not found for user, returning basic user data');
        return res.json({
          success: true,
          session: {
            authenticated: true,
            userId: req.user.id,
            email: req.user.email
          },
          user: {
            id: req.user.id,
            email: req.user.email,
            ...req.user.user_metadata
          },
          profile: null,
          message: 'Profile not found, using basic user data'
        });
      }

      // Other database errors
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to fetch user profile',
        session: {
          authenticated: true,
          userId: req.user.id
        },
        user: {
          id: req.user.id,
          email: req.user.email
        }
      });
    }

    // Success - return complete session data
    logger.info('Session retrieved successfully', { userId, hasProfile: !!profile });

    res.json({
      success: true,
      session: {
        authenticated: true,
        userId: req.user.id,
        email: req.user.email
      },
      user: {
        id: req.user.id,
        email: req.user.email,
        ...req.user.user_metadata
      },
      profile: profile || null
    });

  } catch (error) {
    logger.error('Session endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to load user session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/google
 * Initiate Google OAuth flow
 * Returns the URL to redirect user to Google for authentication
 */
router.post('/google', async (req, res) => {
  try {
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      logger.error('Google OAuth error:', error);
      return res.status(400).json({ 
        success: false,
        error: 'Failed to initiate Google sign-in',
        message: error.message 
      });
    }

    res.json({
      success: true,
      url: data.url
    });
  } catch (error) {
    logger.error('Google OAuth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth callback - exchange code for session
 */
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        success: false,
        error: 'Authorization code is required' 
      });
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error('Google OAuth callback error:', error);
      return res.status(400).json({ 
        success: false,
        error: 'Failed to complete Google sign-in',
        message: error.message 
      });
    }

    const { user, session } = data;

    // Check if user profile exists, if not create one
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileFetchError && profileFetchError.code === 'PGRST116') {
      // Profile doesn't exist, create one from Google user metadata
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const companyName = user.user_metadata?.company_name || 'My Company';

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          company_name: companyName
        });

      if (profileError) {
        logger.error('Profile creation error for Google user:', profileError);
        // Don't fail the login, just log the error
      }

      logger.info('Created profile for Google user:', { userId: user.id, email: user.email });
    }

    // Fetch the profile (newly created or existing)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        ...profile
      },
      session: session
    });
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
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
      ...profile
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
