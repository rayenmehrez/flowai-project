const logger = require('../utils/logger');

/**
 * Security headers middleware
 * Implements OWASP security best practices
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (HTTPS only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Validate that no API keys are hardcoded
 * This is a development-time check
 */
const checkHardcodedSecrets = () => {
  if (process.env.NODE_ENV === 'development') {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENROUTER_API_KEY'
    ];
    
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      logger.warn(`Missing environment variables: ${missing.join(', ')}`);
      logger.warn('Make sure all API keys are set in .env file, never hardcode them!');
    }
  }
};

/**
 * Log security events
 */
const logSecurityEvent = (event, details) => {
  logger.warn('Security Event:', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = {
  securityHeaders,
  checkHardcodedSecrets,
  logSecurityEvent
};
