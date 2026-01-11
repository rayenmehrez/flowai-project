const express = require('express');
const router = express.Router();
const { addMessage } = require('../queue/messageProcessor');
const logger = require('../utils/logger');

/**
 * POST /api/webhooks/whatsapp/:agentId
 * Webhook endpoint for WhatsApp messages (internal use)
 * This is called by the WhatsApp service when a message is received
 */
router.post('/whatsapp/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { from, body, timestamp, messageId, contactName } = req.body;

    // Add message to queue for processing
    await addMessage({
      agentId,
      from,
      body,
      timestamp: timestamp || new Date(),
      messageId,
      contactName
    });

    // Return immediately (async processing)
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
