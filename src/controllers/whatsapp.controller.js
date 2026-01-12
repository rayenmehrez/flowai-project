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
      logger.warn('Agent not found for QR generation', { agentId, userId });
      return res.status(404).json({ 
        success: false,
        error: 'Agent not found',
        message: 'Agent not found or access denied' 
      });
    }

    logger.info('Generating QR code', { agentId, userId });

    // Initialize client and generate QR
    const result = await whatsappService.initializeClient(agentId, userId);

    // If already connected, return connected status
    if (result.status === 'connected' && result.phoneNumber) {
      logger.info('Agent already connected', { agentId, phoneNumber: result.phoneNumber });
      return res.json({
        success: true,
        agentId,
        status: 'connected',
        connected: true,
        phoneNumber: result.phoneNumber,
        qrCode: null
      });
    }

    // Get current QR code and status from service
    const qrStatus = whatsappService.getQRStatus(agentId);
    const connectionStatus = whatsappService.getConnectionStatus(agentId);

    // Return QR code and status
    logger.info('QR code generated', { agentId, hasQR: !!qrStatus.qrCode, status: connectionStatus.status });
    
    res.json({
      success: true,
      agentId,
      status: connectionStatus.status || result.status || 'connecting',
      connected: connectionStatus.isConnected || false,
      qrCode: qrStatus.qrCode || result.qrCode || null,
      phoneNumber: connectionStatus.phoneNumber || null
    });
  } catch (error) {
    logger.error('Generate QR error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate QR code',
      message: error.message || 'Failed to generate QR code' 
    });
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
      logger.warn('Agent not found for connection status', { agentId, userId });
      return res.status(404).json({ 
        success: false,
        error: 'Agent not found',
        message: 'Agent not found or access denied' 
      });
    }

    const status = whatsappService.getConnectionStatus(agentId);

    // Return status in format expected by frontend
    res.json({
      success: true,
      connected: status.isConnected || status.status === 'connected',
      status: status.status || 'not_connected',
      phoneNumber: status.phoneNumber || agent.phone_number || null,
      qrCode: status.qrCode || null
    });
  } catch (error) {
    logger.error('Check connection status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check status',
      message: error.message || 'Failed to check status' 
    });
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
      logger.warn('Agent not found for disconnect', { agentId, userId });
      return res.status(404).json({ 
        success: false,
        error: 'Agent not found',
        message: 'Agent not found or access denied' 
      });
    }

    logger.info('Disconnecting WhatsApp client', { agentId, userId });
    const result = await whatsappService.disconnectClient(agentId);

    res.json({
      success: result.success !== false,
      message: result.message || 'Disconnected successfully'
    });
  } catch (error) {
    logger.error('Disconnect error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to disconnect',
      message: error.message || 'Failed to disconnect' 
    });
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
      logger.warn('Agent not found for QR status', { agentId, userId });
      return res.status(404).json({ 
        success: false,
        error: 'Agent not found',
        message: 'Agent not found or access denied' 
      });
    }

    const qrStatus = whatsappService.getQRStatus(agentId);

    res.json({
      success: true,
      ...qrStatus
    });
  } catch (error) {
    logger.error('Get QR status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get QR status',
      message: error.message || 'Failed to get QR status' 
    });
  }
}

module.exports = {
  generateQR,
  checkConnectionStatus,
  disconnect,
  getQRStatus
};
