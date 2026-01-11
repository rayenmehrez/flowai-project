# WhatsApp Backend System Documentation

## Overview
Complete WhatsApp integration system for SaaS platform using Node.js, Express, whatsapp-web.js, Supabase, and OpenRouter Claude AI.

## Architecture

### Services
- **WhatsAppService** (`src/services/whatsapp.service.js`): Manages WhatsApp client lifecycle
- **MessageService** (`src/services/message.service.js`): Handles message and conversation operations
- **CreditsService** (`src/services/credits.service.js`): Manages user credits
- **AIService** (`src/services/ai.service.js`): Processes messages with Claude AI

### Routes
- `POST /api/whatsapp/generate-qr/:agentId` - Generate QR code for connection
- `GET /api/whatsapp/connection-status/:agentId` - Check connection status
- `POST /api/whatsapp/disconnect/:agentId` - Disconnect WhatsApp client
- `GET /api/whatsapp/qr-status/:agentId` - Get QR code status

## Environment Variables

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
BACKEND_URL=https://your-backend.onrender.com
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
SESSION_DIR=/app/.wwa-sessions
```

## Message Flow

1. **Receive Message**: WhatsApp client receives incoming message
2. **Check Credits**: Verify user has 2 credits available
3. **Get/Create Conversation**: Find or create conversation in database
4. **Save Incoming Message**: Store message in messages table
5. **Process with AI**: Call OpenRouter API with Claude 3.5 Sonnet
6. **Send Response**: Send AI response via WhatsApp
7. **Save Outgoing Message**: Store response in messages table
8. **Deduct Credits**: Deduct 2 credits from user account
9. **Update Stats**: Update conversation message count

## Database Tables

### agents
- `whatsapp_connected` (boolean)
- `whatsapp_qr_code` (text)
- `whatsapp_phone_number` (text)
- `whatsapp_connected_at` (timestamp)

### conversations
- `agent_id` (uuid)
- `customer_phone` (text)
- `customer_name` (text)
- `status` (text: 'active', 'closed')
- `message_count` (integer)
- `last_message_at` (timestamp)

### messages
- `conversation_id` (uuid)
- `agent_id` (uuid)
- `direction` (text: 'incoming', 'outgoing')
- `content` (text)
- `whatsapp_message_id` (text)
- `ai_processed` (boolean)
- `credits_used` (integer)

### user_profiles
- `credits_balance` (integer)
- `credits_used` (integer)

### credit_transactions
- `user_id` (uuid)
- `transaction_type` (text: 'debit', 'credit')
- `amount` (integer)
- `balance_before` (integer)
- `balance_after` (integer)
- `description` (text)
- `related_entity_id` (uuid)

## Usage Examples

### Generate QR Code
```bash
POST /api/whatsapp/generate-qr/:agentId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "agentId": "uuid",
  "status": "qr_ready",
  "qrCode": "data:image/png;base64,...",
  "phoneNumber": null
}
```

### Check Connection Status
```bash
GET /api/whatsapp/connection-status/:agentId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "agentId": "uuid",
  "status": "connected",
  "isConnected": true,
  "phoneNumber": "1234567890",
  "qrCode": null
}
```

### Disconnect
```bash
POST /api/whatsapp/disconnect/:agentId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Disconnected successfully"
}
```

## Error Handling

- All async functions wrapped in try-catch
- Errors logged with context
- Friendly error messages sent to customers
- Server never crashes on WhatsApp errors
- Graceful shutdown on SIGTERM/SIGINT

## Render.com Compatibility

- Uses system Chromium installed via apt-get
- Persistent disk at `/app/.wwa-sessions` for sessions
- Handles process signals for graceful shutdown
- Environment variables configured in render.yaml

## Credits System

- **2 credits per message** (incoming + AI processing + outgoing)
- Credits checked before processing
- Automatic deduction after successful processing
- Transaction logging in `credit_transactions` table

## AI Configuration

- Model: `anthropic/claude-3.5-sonnet` via OpenRouter
- Max tokens: 200 (optimized for WhatsApp)
- Temperature: 0.7
- Responses: 2-3 sentences, friendly, concise
- Knowledge base integration
