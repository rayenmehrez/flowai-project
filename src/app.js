// Start message queue processor (non-blocking, will work without Redis)
try {
  require('./queue/messageProcessor');
} catch (error) {
  // If message processor fails to load, log but don't crash
  const logger = require('./utils/logger');
  logger.warn('⚠️  Message queue processor failed to load:', error.message);
  logger.warn('⚠️  App will continue, but WhatsApp message processing may not work.');
}

// Graceful shutdown handlers
const whatsappService = require('./services/whatsapp.service');
const logger = require('./utils/logger');

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  try {
    await whatsappService.destroyAllClients();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  try {
    await whatsappService.destroyAllClients();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Start server
require('./server');
