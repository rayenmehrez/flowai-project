const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  generateQR,
  checkConnectionStatus,
  disconnect,
  getQRStatus
} = require('../controllers/whatsapp.controller');

/**
 * POST /api/whatsapp/generate-qr/:agentId
 * Generate QR code for WhatsApp connection
 */
router.post('/generate-qr/:agentId', authenticate, generateQR);

/**
 * GET /api/whatsapp/connection-status/:agentId
 * Check WhatsApp connection status
 */
router.get('/connection-status/:agentId', authenticate, checkConnectionStatus);

/**
 * POST /api/whatsapp/disconnect/:agentId
 * Disconnect WhatsApp client
 */
router.post('/disconnect/:agentId', authenticate, disconnect);

/**
 * GET /api/whatsapp/qr-status/:agentId
 * Get QR code status
 */
router.get('/qr-status/:agentId', authenticate, getQRStatus);

module.exports = router;
