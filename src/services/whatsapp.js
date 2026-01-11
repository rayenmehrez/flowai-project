const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { addMessage } = require('../queue/messageProcessor');

// Store active clients
const clients = new Map();

/**
 * Initialize WhatsApp client for an agent
 */
async function connect(agentId) {
  try {
    // Check if already connected
    if (clients.has(agentId)) {
      const client = clients.get(agentId);
      if (client.info) {
        return { error: 'Already connected' };
      }
    }

    // Get agent data
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      return { error: 'Agent not found' };
    }

    // Create session directory
    const sessionPath = path.join(process.cwd(), '.wwa-sessions', agentId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Create client with LocalAuth
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionPath }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    let qrCodeBase64 = null;

    // QR code event
    client.on('qr', async (qr) => {
      try {
        qrCodeBase64 = await qrcode.toDataURL(qr);
        
        // Update agent with QR code
        await supabase
          .from('agents')
          .update({
            qr_code: qrCodeBase64,
            status: 'connecting'
          })
          .eq('id', agentId);

        logger.info(`QR code generated for agent ${agentId}`);
      } catch (error) {
        logger.error('QR code generation error:', error);
      }
    });

    // Ready event (connected)
    client.on('ready', async () => {
      try {
        const info = client.info;
        const phoneNumber = info.wid.user;

        await supabase
          .from('agents')
          .update({
            status: 'connected',
            phone_number: phoneNumber,
            qr_code: null,
            last_connected_at: new Date().toISOString()
          })
          .eq('id', agentId);

        logger.info(`Agent ${agentId} connected with phone ${phoneNumber}`);

        // Setup message listener
        setupMessageListener(agentId, client);
      } catch (error) {
        logger.error('Ready event error:', error);
      }
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      logger.error(`Auth failure for agent ${agentId}:`, msg);
      await supabase
        .from('agents')
        .update({ status: 'error' })
        .eq('id', agentId);
      
      clients.delete(agentId);
    });

    // Disconnected
    client.on('disconnected', async (reason) => {
      logger.warn(`Agent ${agentId} disconnected:`, reason);
      await supabase
        .from('agents')
        .update({ status: 'disconnected' })
        .eq('id', agentId);
      
      clients.delete(agentId);
    });

    // Initialize client
    await client.initialize();

    // Store client
    clients.set(agentId, client);

    // Wait a bit for QR code to be generated
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      qrCode: qrCodeBase64,
      status: 'connecting'
    };
  } catch (error) {
    logger.error('WhatsApp connect error:', error);
    return { error: error.message };
  }
}

/**
 * Setup message listener for client
 */
function setupMessageListener(agentId, client) {
  client.on('message', async (message) => {
    try {
      // Only handle individual messages (not groups)
      if (message.from === 'status@broadcast') {
        return;
      }

      const contact = await message.getContact();
      const chat = await message.getChat();
      
      if (chat.isGroup) {
        return; // Skip group messages
      }

      // Extract message data
      const messageData = {
        from: message.from,
        body: message.body,
        timestamp: new Date(message.timestamp * 1000),
        messageId: message.id._serialized,
        contactName: contact.pushname || contact.number || 'Unknown'
      };

      // Add to message queue for processing
      await addMessage({
        agentId,
        ...messageData
      });

      logger.info(`Message queued for agent ${agentId}`, { from: messageData.from });
    } catch (error) {
      logger.error('Message listener error:', error);
    }
  });
}

/**
 * Disconnect WhatsApp client
 */
async function disconnect(agentId) {
  try {
    const client = clients.get(agentId);
    
    if (client) {
      await client.destroy();
      clients.delete(agentId);
    }

    // Update agent status
    await supabase
      .from('agents')
      .update({
        status: 'disconnected',
        qr_code: null
      })
      .eq('id', agentId);

    logger.info(`Agent ${agentId} disconnected`);
    return { success: true };
  } catch (error) {
    logger.error('WhatsApp disconnect error:', error);
    return { error: error.message };
  }
}

/**
 * Send message via WhatsApp
 */
async function sendMessage(agentId, chatId, messageText) {
  try {
    const client = clients.get(agentId);
    
    if (!client || !client.info) {
      throw new Error('WhatsApp client not connected');
    }

    const result = await client.sendMessage(chatId, messageText);
    return { success: true, messageId: result.id._serialized };
  } catch (error) {
    logger.error('Send message error:', error);
    throw error;
  }
}

/**
 * Get client for agent
 */
function getClient(agentId) {
  return clients.get(agentId);
}

module.exports = {
  connect,
  disconnect,
  sendMessage,
  getClient
};
