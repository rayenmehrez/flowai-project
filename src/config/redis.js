const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;
let redisAvailable = false;

/**
 * Initialize Redis connection with error handling
 * Returns null if Redis is not available, allowing app to continue
 */
function initializeRedis() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('⚠️  REDIS_URL environment variable is not set. Redis features will be disabled.');
    logger.warn('   The app will continue to run, but message queue processing will not work.');
    logger.warn('   To enable Redis, set REDIS_URL in your environment variables.');
    return null;
  }

  try {
    logger.info('🔌 Attempting to connect to Redis...');
    
    redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        // Stop retrying after 5 attempts
        if (times > 5) {
          logger.warn('⚠️  Redis connection failed after 5 attempts. Giving up.');
          redisAvailable = false;
          redis = null;
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
      enableOfflineQueue: false,
      // Suppress connection errors in logs (we handle them)
      showFriendlyErrorStack: false
    });

    // Handle connection events
    redis.on('connect', () => {
      logger.info('✅ Redis connection established');
      redisAvailable = true;
    });

    redis.on('ready', () => {
      logger.info('✅ Redis is ready to accept commands');
      redisAvailable = true;
    });

    redis.on('error', (error) => {
      // Only log if it's not a connection refused (we already handle that)
      if (!error.message.includes('ECONNREFUSED')) {
        logger.error('❌ Redis error:', error.message);
      }
      redisAvailable = false;
      // Don't set redis to null on error, allow retries
    });

    redis.on('close', () => {
      logger.warn('⚠️  Redis connection closed');
      redisAvailable = false;
    });

    redis.on('reconnecting', (delay) => {
      logger.warn(`🔄 Redis reconnecting in ${delay}ms...`);
      redisAvailable = false;
    });

    // Attempt to connect (non-blocking, wrapped in try-catch)
    redis.connect().catch((error) => {
      // Suppress ECONNREFUSED errors - they're expected if Redis is not available
      if (error.message && !error.message.includes('ECONNREFUSED')) {
        logger.error('❌ Failed to connect to Redis:', error.message);
      }
      logger.warn('⚠️  The app will continue without Redis. Message queue will not work.');
      logger.warn('⚠️  Redis will retry connection automatically.');
      redisAvailable = false;
      // Keep redis instance for retry attempts
    });

    return redis;
  } catch (error) {
    logger.error('❌ Redis initialization error:', error.message);
    logger.warn('⚠️  The app will continue without Redis. Message queue will not work.');
    redisAvailable = false;
    redis = null;
    return null;
  }
}

/**
 * Get Redis connection instance
 * Returns null if Redis is not available
 */
function getRedis() {
  return redis;
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
  return redisAvailable && redis !== null;
}

/**
 * Get Redis configuration for Bull queue
 * Returns null if Redis is not available or REDIS_URL is not set
 */
function getRedisConfig() {
  const redisUrl = process.env.REDIS_URL;
  
  // If REDIS_URL is not set, return null
  if (!redisUrl) {
    return null;
  }

  // Parse Redis URL if it's a full URL
  if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined
      };
    } catch (error) {
      logger.warn('Failed to parse REDIS_URL, using defaults');
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD
  };
}

/**
 * Close Redis connection gracefully
 */
async function closeRedis() {
  if (redis) {
    try {
      await redis.quit();
      logger.info('✅ Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error.message);
    }
    redis = null;
    redisAvailable = false;
  }
}

// Initialize Redis on module load (non-blocking)
// Wrap in try-catch to prevent any initialization errors from crashing the app
try {
  initializeRedis();
} catch (error) {
  logger.error('Failed to initialize Redis during module load:', error.message);
  logger.warn('⚠️  App will continue without Redis. This is not critical for startup.');
  redis = null;
  redisAvailable = false;
}

module.exports = {
  getRedis,
  isRedisAvailable,
  getRedisConfig,
  closeRedis,
  initializeRedis
};
