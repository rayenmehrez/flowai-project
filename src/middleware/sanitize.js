const logger = require('../utils/logger');

/**
 * Sanitize string input - remove dangerous characters and trim
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

/**
 * Sanitize email - validate format and remove dangerous characters
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') return email;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();
  
  if (!emailRegex.test(sanitized)) {
    return null; // Invalid email format
  }
  
  return sanitized.replace(/[<>]/g, '');
}

/**
 * Sanitize URL - validate and clean URL
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch (e) {
    // Invalid URL
    return null;
  }
}

/**
 * Sanitize phone number - keep only digits, +, -, spaces, parentheses
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string' || !phone) return phone;
  
  return phone
    .trim()
    .replace(/[^\d+\-() ]/g, '') // Keep only digits, +, -, (, ), spaces
    .substring(0, 20); // Limit length
}

/**
 * Sanitize integer - ensure it's a valid integer
 */
function sanitizeInteger(input, min = null, max = null) {
  const num = parseInt(input, 10);
  
  if (isNaN(num)) return null;
  
  if (min !== null && num < min) return min;
  if (max !== null && num > max) return max;
  
  return num;
}

/**
 * Sanitize search query - remove dangerous characters but keep search terms
 */
function sanitizeSearch(query) {
  if (typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 200); // Limit length
}

/**
 * Sanitize UUID - validate UUID format
 */
function sanitizeUUID(uuid) {
  if (typeof uuid !== 'string') return null;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const trimmed = uuid.trim();
  
  return uuidRegex.test(trimmed) ? trimmed : null;
}

/**
 * Middleware to sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          // Apply appropriate sanitization based on field name
          if (key.toLowerCase().includes('email')) {
            sanitized[key] = sanitizeEmail(value);
          } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('avatar')) {
            sanitized[key] = sanitizeUrl(value);
          } else if (key.toLowerCase().includes('phone')) {
            sanitized[key] = sanitizePhone(value);
          } else if (key.toLowerCase().includes('search') || key.toLowerCase().includes('query')) {
            sanitized[key] = sanitizeSearch(value);
          } else {
            sanitized[key] = sanitizeString(value);
          }
        } else if (typeof value === 'number') {
          sanitized[key] = value;
        } else if (typeof value === 'boolean') {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'string' ? sanitizeString(item) : item
          );
        } else if (value && typeof value === 'object') {
          sanitized[key] = value; // Nested objects handled by validation
        } else {
          sanitized[key] = value;
        }
      }
      
      req.body = sanitized;
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid input data'
    });
  }
};

/**
 * Middleware to sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  try {
    if (req.query && typeof req.query === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          if (key === 'page' || key === 'limit' || key === 'offset') {
            sanitized[key] = sanitizeInteger(value, 1, 1000);
          } else if (key === 'search' || key === 'q' || key === 'query') {
            sanitized[key] = sanitizeSearch(value);
          } else if (key === 'id' || key.endsWith('_id') || key.endsWith('Id')) {
            sanitized[key] = sanitizeUUID(value) || sanitizeString(value);
          } else {
            sanitized[key] = sanitizeString(value);
          }
        } else {
          sanitized[key] = value;
        }
      }
      
      req.query = sanitized;
    }
    
    next();
  } catch (error) {
    logger.error('Query sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters'
    });
  }
};

/**
 * Middleware to sanitize URL parameters
 */
const sanitizeParams = (req, res, next) => {
  try {
    if (req.params && typeof req.params === 'object') {
      const sanitized = {};
      
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          if (key.endsWith('Id') || key.endsWith('_id') || key === 'id') {
            sanitized[key] = sanitizeUUID(value) || sanitizeString(value);
          } else {
            sanitized[key] = sanitizeString(value);
          }
        } else {
          sanitized[key] = value;
        }
      }
      
      req.params = sanitized;
    }
    
    next();
  } catch (error) {
    logger.error('Params sanitization error:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid URL parameters'
    });
  }
};

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeInteger,
  sanitizeSearch,
  sanitizeUUID,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams
};
