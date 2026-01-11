const whatsappService = require('../services/whatsapp.service');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Generate QR code for WhatsApp connection
 * POST /api/whatsapp/generate-qr/:agentId
 */
async function generateQR(req, res) {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    // Verify agent ownership
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }

    // Initialize client and generate QR
    const result = await whatsappService.initializeClient(agentId, userId);

    res.json({
      success: true,
      agentId,
      status: result.status,
      qrCode: result.qrCode,
      phoneNumber: result.phoneNumber || null
    });
  } catch (error) {
    logger.error('Generate QR error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate QR code' });
  }
}

/**
 * Check WhatsApp connection status
 * GET /api/whatsapp/connection-status/:agentId
 */
async function checkConnectionStatus(req, res) {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    // Verify agent ownership
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }

    const status = whatsappService.getConnectionStatus(agentId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    logger.error('Check connection status error:', error);
    res.status(500).json({ error: error.message || 'Failed to check status' });
  }
}

/**
 * Disconnect WhatsApp client
 * POST /api/whatsapp/disconnect/:agentId
 */
async function disconnect(req, res) {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    // Verify agent ownership
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }

    const result = await whatsappService.disconnectClient(agentId);

    res.json({
      success: result.success,
      message: result.message || 'Disconnected successfully'
    });
  } catch (error) {
    logger.error('Disconnect error:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect' });
  }
}

/**
 * Get QR code status
 * GET /api/whatsapp/qr-status/:agentId
 */
async function getQRStatus(req, res) {
  try {
    const { agentId } = req.params;
    const userId = req.user.id;

    // Verify agent ownership
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: 'Agent not found or access denied' });
    }

    const qrStatus = whatsappService.getQRStatus(agentId);

    res.json({
      success: true,
      ...qrStatus
    });
  } catch (error) {
    logger.error('Get QR status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get QR status' });
  }
}

module.exports = {
  generateQR,
  checkConnectionStatus,
  disconnect,
  getQRStatus
};
