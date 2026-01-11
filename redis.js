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
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
      enableOfflineQueue: false
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
      logger.error('❌ Redis connection error:', error.message);
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

    // Attempt to connect (non-blocking)
    redis.connect().catch((error) => {
      logger.error('❌ Failed to connect to Redis:', error.message);
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
 * Returns null if Redis is not available
 */
function getRedisConfig() {
  if (!isRedisAvailable()) {
    return null;
  }

  const redisUrl = process.env.REDIS_URL;
  
  // Parse Redis URL if it's a full URL
  if (redisUrl && redisUrl.startsWith('redis://')) {
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

// Initialize Redis on module load
initializeRedis();

module.exports = {
  getRedis,
  isRedisAvailable,
  getRedisConfig,
  closeRedis,
  initializeRedis
};
