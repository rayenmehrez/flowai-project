const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format working hours object into readable text
 * @param {Object} hours - Working hours object
 * @returns {string} Formatted working hours text
 */
function formatWorkingHours(hours) {
  if (!hours || typeof hours !== 'object') {
    return 'Working hours not specified';
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const formattedDays = [];

  for (const day of days) {
    const dayHours = hours[day];
    if (!dayHours || dayHours.closed) {
      formattedDays.push(`${capitalize(day)}: Closed`);
    } else if (dayHours.shifts && dayHours.shifts.length > 0) {
      const shifts = dayHours.shifts.map(shift => `${shift.open} - ${shift.close}`).join(', ');
      formattedDays.push(`${capitalize(day)}: ${shifts}`);
    } else {
      formattedDays.push(`${capitalize(day)}: Not specified`);
    }
  }

  return formattedDays.join('\n');
}

/**
 * Format service price based on pricing type
 * @param {Object} pricing - Pricing object
 * @param {string} currency - Currency code
 * @returns {string} Formatted price string
 */
function formatServicePrice(pricing, currency = 'USD') {
  if (!pricing) {
    return 'Price on request';
  }

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$'
  };

  const symbol = currencySymbols[currency] || currency;

  if (pricing.type === 'fixed') {
    return `${symbol}${pricing.value}`;
  } else if (pricing.type === 'range') {
    return `${symbol}${pricing.min} - ${symbol}${pricing.max}`;
  } else if (pricing.type === 'starting_from') {
    return `Starting from ${symbol}${pricing.value}`;
  } else if (pricing.type === 'on_request') {
    return 'Price on request';
  }

  return 'Price on request';
}

/**
 * Build system prompt with agent data and knowledge base
 * @param {Object} agent - Agent data from database
 * @param {Array} knowledgeBase - Knowledge base entries
 * @returns {string} System prompt
 */
function buildSystemPrompt(agent, knowledgeBase) {
  let prompt = `You are an AI assistant for ${agent.business_name || agent.name || 'a business'}. `;

  // Add business description
  if (agent.description) {
    prompt += `${agent.description}\n\n`;
  }

  // Add business information
  prompt += `BUSINESS INFORMATION:\n`;
  
  if (agent.address) {
    prompt += `📍 Address: ${agent.address}`;
    if (agent.city) prompt += `, ${agent.city}`;
    if (agent.country) prompt += `, ${agent.country}`;
    prompt += `\n`;
  }

  if (agent.phone_number) {
    prompt += `📞 Phone: ${agent.phone_number}\n`;
  }

  // Add working hours
  if (agent.working_hours) {
    prompt += `\n⏰ WORKING HOURS:\n${formatWorkingHours(agent.working_hours)}\n`;
  }

  // Add services with pricing
  if (agent.services && Array.isArray(agent.services) && agent.services.length > 0) {
    prompt += `\n🛍️ SERVICES:\n`;
    agent.services.forEach((service, index) => {
      prompt += `${index + 1}. ${service.name || 'Service'}`;
      if (service.description) {
        prompt += ` - ${service.description}`;
      }
      if (service.pricing) {
        prompt += ` (${formatServicePrice(service.pricing, agent.currency || 'USD')})`;
      }
      prompt += `\n`;
    });
    prompt += `\n`;
  }

  // Add knowledge base
  if (knowledgeBase && knowledgeBase.length > 0) {
    prompt += `\n📚 KNOWLEDGE BASE:\n`;
    knowledgeBase.forEach((kb, index) => {
      prompt += `Q${index + 1}: ${kb.question || kb.title || 'Question'}\n`;
      prompt += `A${index + 1}: ${kb.answer || kb.content || 'Answer'}\n\n`;
    });
  }

  // Add AI instructions
  prompt += `\nINSTRUCTIONS FOR RESPONSES:
- Be friendly, helpful, and professional
- Keep responses SHORT (2-3 sentences maximum) for WhatsApp
- Use 1-2 emojis per message (sparingly)
- Help customers with bookings, inquiries, and questions
- Use the knowledge base to answer questions accurately
- If you don't know something, politely say so
- Respond in ${agent.language || 'English'}
- Be natural and conversational
- Never make up information not in the knowledge base
- If asked about bookings, provide clear next steps
- Always be respectful and courteous`;

  return prompt;
}

/**
 * Process WhatsApp message with AI
 * @param {string} agentId - Agent ID
 * @param {string} messageText - Incoming message text
 * @param {string} customerPhone - Customer phone number
 * @returns {Promise<Object>} AI response with message content
 */
async function processWhatsAppMessage(agentId, messageText, customerPhone) {
  const startTime = Date.now();

  try {
    // Get agent data from Supabase
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      logger.error(`Agent not found: ${agentId}`, agentError);
      throw new Error('Agent not found');
    }

    // Get knowledge base data
    const { data: knowledgeBase, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .select('question, answer, title, content')
      .eq('agent_id', agentId)
      .eq('enabled', true)
      .order('priority', { ascending: false })
      .limit(50);

    if (knowledgeError) {
      logger.error('Knowledge base fetch error:', knowledgeError);
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(agent, knowledgeBase || []);

    // Check if knowledge base was used
    const knowledgeBaseUsed = knowledgeBase && knowledgeBase.length > 0;

    // Prepare API request
    const requestData = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageText }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    // Call OpenRouter API
    const response = await axios.post(
      OPENROUTER_API_URL,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001',
          'X-Title': 'FlowAI WhatsApp Agent'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    const tokensUsed = response.data.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    logger.info(`AI processed WhatsApp message for agent ${agentId}. Tokens: ${tokensUsed}, Time: ${processingTime}ms`);

    return {
      response: aiResponse,
      knowledgeBaseUsed: knowledgeBaseUsed,
      tokensUsed: tokensUsed,
      processingTime: processingTime
    };
  } catch (error) {
    logger.error('AI WhatsApp processing error:', error);
    const processingTime = Date.now() - startTime;

    // Return fallback response
    let fallbackMessage = "I'm having trouble right now. Please try again later. 😊";
    
    if (error.response) {
      logger.error('OpenRouter API error:', error.response.data);
      fallbackMessage = "I'm experiencing technical difficulties. Please contact us directly or try again in a few moments. 😊";
    } else if (error.code === 'ECONNABORTED') {
      fallbackMessage = "The request is taking too long. Please try again. 😊";
    }

    return {
      response: fallbackMessage,
      knowledgeBaseUsed: false,
      tokensUsed: 0,
      processingTime: processingTime,
      error: error.message
    };
  }
}

/**
 * Generate Q&A pairs from agent data (for knowledge base generation)
 * @param {Object} agentData - Agent data
 * @returns {Array} Array of Q&A pairs
 */
function generateQAPairs(agentData) {
  try {
    const qaPairs = [];

    // Generate Q&A from business name
    if (agentData.business_name) {
      qaPairs.push({
        question: `What is ${agentData.business_name}?`,
        answer: agentData.description || `${agentData.business_name} is a business.`
      });
    }

    // Generate Q&A from services
    if (agentData.services && Array.isArray(agentData.services)) {
      agentData.services.forEach(service => {
        if (service.name) {
          qaPairs.push({
            question: `What is ${service.name}?`,
            answer: service.description || `${service.name} is one of our services.`
          });
        }
      });
    }

    // Generate Q&A from working hours
    if (agentData.working_hours) {
      qaPairs.push({
        question: 'What are your working hours?',
        answer: formatWorkingHours(agentData.working_hours)
      });
    }

    return qaPairs;
  } catch (error) {
    logger.error('Generate Q&A pairs error:', error);
    return [];
  }
}

module.exports = {
  processWhatsAppMessage,
  generateQAPairs,
  buildSystemPrompt,
  formatWorkingHours,
  formatServicePrice,
  capitalize
};
