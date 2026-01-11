// Start message queue processor (non-blocking, will work without Redis)
try {
  require('./queue/messageProcessor');
} catch (error) {
  // If message processor fails to load, log but don't crash
  const logger = require('./utils/logger');
  logger.warn('⚠️  Message queue processor failed to load:', error.message);
  logger.warn('⚠️  App will continue, but WhatsApp message processing may not work.');
}

// Start server
require('./server');
