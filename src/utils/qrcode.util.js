const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Generate QR code image as base64 data URL
 * @param {string} text - Text to encode in QR code
 * @returns {Promise<string>} Base64 data URL of QR code image
 */
async function generateQRCodeImage(text) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H', // High error correction
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info('QR code generated successfully');
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code: ' + error.message);
  }
}

module.exports = {
  generateQRCodeImage
};
