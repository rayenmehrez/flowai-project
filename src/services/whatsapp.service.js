const { Client, LocalAuth } = require('whatsapp-web.js');
const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const { generateQRCodeImage } = require('../utils/qrcode.util');
const messageService = require('./message.service');
const creditsService = require('./credits.service');
const { processWhatsAppMessage } = require('./ai.service');

/**
 * WhatsAppService - Manages WhatsApp client connections and message handling
 */
class WhatsAppService {
  constructor() {
    // Store active clients: agentId -> Client
    this.clients = new Map();
    // Store QR codes: agentId -> base64 QR code
    this.qrCodes = new Map();
    // Store connection status: agentId -> status
    this.connectionStatus = new Map();
    
    // Session directory path
    this.sessionDir = process.env.SESSION_DIR || path.join(process.cwd(), '.wwa-sessions');
    
    // Ensure session directory exists
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      logger.info(`Created session directory: ${this.sessionDir}`);
    }
  }

  /**
   * Initialize WhatsApp client for an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID (for ownership verification)
   * @returns {Promise<Object>} Connection result with QR code or status
   */
  async initializeClient(agentId, userId) {
    try {
      // Verify agent ownership
      const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', userId)
        .single();

      if (error || !agent) {
        throw new Error('Agent not found or access denied');
      }

      // Check if client already exists and is connected
      if (this.clients.has(agentId)) {
        const existingClient = this.clients.get(agentId);
        if (existingClient.info) {
          logger.info(`Agent ${agentId} already connected`);
          return {
            success: true,
            status: 'connected',
            phoneNumber: existingClient.info.wid.user
          };
        }
      }

      // Create Puppeteer options for Render.com
      const puppeteerOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      };

      // Use system Chromium if available
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        logger.info(`Using Chromium at: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      } else if (process.platform === 'linux') {
        const possiblePaths = [
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable'
        ];
        
        for (const execPath of possiblePaths) {
          if (fs.existsSync(execPath)) {
            puppeteerOptions.executablePath = execPath;
            logger.info(`Found Chromium at: ${execPath}`);
            break;
          }
        }
      }

      // Create client with LocalAuth
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: agentId,
          dataPath: this.sessionDir
        }),
        puppeteer: puppeteerOptions,
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        }
      });

      // Set up event handlers
      this.setupEventHandlers(agentId, client, userId);

      // Store client
      this.clients.set(agentId, client);
      this.connectionStatus.set(agentId, 'initializing');

      // Initialize client
      await client.initialize();

      logger.info(`WhatsApp client initialized for agent ${agentId}`);

      // Wait a bit for QR code generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const qrCode = this.qrCodes.get(agentId);
      const status = this.connectionStatus.get(agentId);

      return {
        success: true,
        status: status || 'connecting',
        qrCode: qrCode || null
      };
    } catch (error) {
      logger.error(`Initialize client error for agent ${agentId}:`, error);
      this.connectionStatus.set(agentId, 'error');
      throw error;
    }
  }

  /**
   * Set up event handlers for WhatsApp client
   * @param {string} agentId - Agent ID
   * @param {Client} client - WhatsApp client instance
   * @param {string} userId - User ID
   */
  setupEventHandlers(agentId, client, userId) {
    // QR code event
    client.on('qr', async (qr) => {
      try {
        logger.info(`QR code generated for agent ${agentId}`);
        const qrCodeBase64 = await generateQRCodeImage(qr);
        this.qrCodes.set(agentId, qrCodeBase64);
        this.connectionStatus.set(agentId, 'qr_ready');

        // Update agent in database
        await supabase
          .from('agents')
          .update({
            whatsapp_qr_code: qrCodeBase64,
            whatsapp_connected: false,
            whatsapp_connected_at: null
          })
          .eq('id', agentId);
      } catch (error) {
        logger.error('QR code generation error:', error);
      }
    });

    // Ready event (connected)
    client.on('ready', async () => {
      try {
        const info = client.info;
        const phoneNumber = info.wid.user;

        logger.info(`Agent ${agentId} connected with phone ${phoneNumber}`);

        this.connectionStatus.set(agentId, 'connected');
        this.qrCodes.delete(agentId);

        // Update agent in database
        await supabase
          .from('agents')
          .update({
            whatsapp_connected: true,
            whatsapp_phone_number: phoneNumber,
            whatsapp_qr_code: null,
            whatsapp_connected_at: new Date().toISOString()
          })
          .eq('id', agentId);

        // Set up message listener
        this.setupMessageListener(agentId, client, userId);
      } catch (error) {
        logger.error('Ready event error:', error);
      }
    });

    // Authenticated event
    client.on('authenticated', () => {
      logger.info(`Agent ${agentId} authenticated`);
      this.connectionStatus.set(agentId, 'authenticated');
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      logger.error(`Auth failure for agent ${agentId}:`, msg);
      this.connectionStatus.set(agentId, 'auth_failed');
      
      await supabase
        .from('agents')
        .update({
          whatsapp_connected: false,
          whatsapp_qr_code: null
        })
        .eq('id', agentId);
      
      this.clients.delete(agentId);
    });

    // Disconnected
    client.on('disconnected', async (reason) => {
      logger.warn(`Agent ${agentId} disconnected:`, reason);
      this.connectionStatus.set(agentId, 'disconnected');
      
      await supabase
        .from('agents')
        .update({
          whatsapp_connected: false,
          whatsapp_qr_code: null
        })
        .eq('id', agentId);
      
      this.clients.delete(agentId);
    });

    // Error handling
    client.on('error', (error) => {
      logger.error(`WhatsApp client error for agent ${agentId}:`, error);
    });
  }

  /**
   * Set up message listener for incoming messages
   * @param {string} agentId - Agent ID
   * @param {Client} client - WhatsApp client instance
   * @param {string} userId - User ID
   */
  setupMessageListener(agentId, client, userId) {
    client.on('message', async (message) => {
      try {
        // Skip status broadcasts and group messages
        if (message.from === 'status@broadcast') {
          return;
        }

        const chat = await message.getChat();
        if (chat.isGroup) {
          return; // Skip group messages
        }

        // Extract message data
        const contact = await message.getContact();
        const customerPhone = message.from.replace('@c.us', '');
        const customerName = contact.pushname || contact.number || 'Unknown';
        const messageText = message.body;
        const whatsappMessageId = message.id._serialized;

        logger.info(`Received message from ${customerPhone} for agent ${agentId}`);

        // Check if user has enough credits (2 credits per message)
        const CREDITS_PER_MESSAGE = 2;
        const hasCredits = await creditsService.hasEnoughCredits(userId, CREDITS_PER_MESSAGE);

        if (!hasCredits) {
          logger.warn(`Insufficient credits for user ${userId}. Message not processed.`);
          // Send friendly message to customer
          await client.sendMessage(message.from, "I'm sorry, but the service is temporarily unavailable. Please contact support.");
          return;
        }

        // Get or create conversation
        const conversation = await messageService.getOrCreateConversation(
          agentId,
          customerPhone,
          customerName
        );

        // Save incoming message
        await messageService.saveIncomingMessage(
          conversation.id,
          agentId,
          messageText,
          whatsappMessageId
        );

        // Process message with AI
        const aiResult = await processWhatsAppMessage(agentId, messageText, customerPhone);

        // Send AI response via WhatsApp
        const responseMessage = await client.sendMessage(message.from, aiResult.response);
        const responseWhatsappId = responseMessage.id._serialized;

        // Save outgoing message
        await messageService.saveOutgoingMessage(
          conversation.id,
          agentId,
          aiResult.response,
          CREDITS_PER_MESSAGE,
          responseWhatsappId
        );

        // Deduct credits
        await creditsService.deductCredits(
          userId,
          CREDITS_PER_MESSAGE,
          `WhatsApp message processing for agent ${agentId}`,
          conversation.id
        );

        // Update conversation stats
        const messageCount = await messageService.getMessageCount(conversation.id);
        await messageService.updateConversationStats(conversation.id, messageCount);

        logger.info(`Processed and responded to message for agent ${agentId}. Credits deducted: ${CREDITS_PER_MESSAGE}`);
      } catch (error) {
        logger.error('Message listener error:', error);
        // Try to send error message to customer
        try {
          await client.sendMessage(message.from, "I'm sorry, I encountered an error. Please try again later.");
        } catch (sendError) {
          logger.error('Failed to send error message:', sendError);
        }
      }
    });
  }

  /**
   * Get connection status for an agent
   * @param {string} agentId - Agent ID
   * @returns {Object} Connection status
   */
  getConnectionStatus(agentId) {
    const status = this.connectionStatus.get(agentId) || 'not_connected';
    const client = this.clients.get(agentId);
    const qrCode = this.qrCodes.get(agentId);

    return {
      agentId,
      status,
      isConnected: client && client.info ? true : false,
      phoneNumber: client && client.info ? client.info.wid.user : null,
      qrCode: qrCode || null
    };
  }

  /**
   * Disconnect WhatsApp client for an agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnectClient(agentId) {
    try {
      const client = this.clients.get(agentId);
      
      if (client) {
        await client.destroy();
        this.clients.delete(agentId);
        this.qrCodes.delete(agentId);
        this.connectionStatus.delete(agentId);

        // Update agent in database
        await supabase
          .from('agents')
          .update({
            whatsapp_connected: false,
            whatsapp_qr_code: null,
            whatsapp_phone_number: null
          })
          .eq('id', agentId);

        logger.info(`Disconnected WhatsApp client for agent ${agentId}`);
        return { success: true };
      }

      return { success: false, message: 'Client not found' };
    } catch (error) {
      logger.error('Disconnect client error:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp client instance
   * @param {string} agentId - Agent ID
   * @returns {Client|null} WhatsApp client or null
   */
  getClient(agentId) {
    return this.clients.get(agentId) || null;
  }

  /**
   * Get QR code status for an agent
   * @param {string} agentId - Agent ID
   * @returns {Object} QR code status
   */
  getQRStatus(agentId) {
    const qrCode = this.qrCodes.get(agentId);
    const status = this.connectionStatus.get(agentId);

    return {
      agentId,
      hasQR: !!qrCode,
      qrCode: qrCode || null,
      status: status || 'not_connected'
    };
  }

  /**
   * Destroy all WhatsApp clients (graceful shutdown)
   * @returns {Promise<void>}
   */
  async destroyAllClients() {
    logger.info('Destroying all WhatsApp clients...');
    
    const destroyPromises = Array.from(this.clients.keys()).map(async (agentId) => {
      try {
        await this.disconnectClient(agentId);
      } catch (error) {
        logger.error(`Error destroying client for agent ${agentId}:`, error);
      }
    });

    await Promise.all(destroyPromises);
    logger.info('All WhatsApp clients destroyed');
  }
}

// Export singleton instance
module.exports = new WhatsAppService();
