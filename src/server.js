require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Render.com and other reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For header
app.set('trust proxy', true);

// CORS configuration - MUST be before routes and all other middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8000',
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  'https://v0-flowai-website-design.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) {
      logger.debug('CORS: No origin (allowed)');
      return callback(null, true);
    }
    
    // In development, allow localhost origins
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      logger.info(`CORS allowed (dev): ${origin}`);
      return callback(null, true);
    }
    
    // Normalize origins (remove trailing slashes and protocol variations)
    const normalizeOrigin = (orig) => {
      return orig.replace(/\/+$/, '').toLowerCase();
    };
    
    const normalizedRequestOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.some(allowed => 
      normalizeOrigin(allowed) === normalizedRequestOrigin
    );
    
    if (isAllowed) {
      logger.info(`CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin} (allowed: ${allowedOrigins.join(', ')})`);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS FIRST, before any other middleware
app.use(cors(corsOptions));

// Middleware - Helmet configured to not interfere with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable CSP to avoid CORS conflicts
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies from requests

// Rate limiting - Configured for proxy (Render.com)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true // Trust proxy headers from Render.com
});
app.use('/api/', limiter);

// Request logging - Log all requests for debugging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { 
    ip: req.ip,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
  next();
});

// Routes - Load and mount with error handling
try {
  logger.info('═══════════════════════════════════════');
  logger.info('Loading API routes...');
  logger.info('═══════════════════════════════════════');
  
  // Load auth routes
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logger.info('✓ Auth routes loaded at /api/auth');
  
  // Load agent routes
  app.use('/api/agents', require('./routes/agents'));
  logger.info('✓ Agent routes loaded at /api/agents');
  
  // Load dashboard routes
  app.use('/api/dashboard', require('./routes/dashboard'));
  logger.info('✓ Dashboard routes loaded at /api/dashboard');
  
  // Load webhook routes
  app.use('/api/webhooks', require('./routes/webhooks'));
  logger.info('✓ Webhook routes loaded at /api/webhooks');
  
  // Load WhatsApp routes
  app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
  logger.info('✓ WhatsApp routes loaded at /api/whatsapp');
  
  // Load user routes
  app.use('/api', require('./routes/user.routes'));
  logger.info('✓ User routes loaded at /api/user');
  
  // Load analytics routes
  app.use('/api/analytics', require('./routes/analytics'));
  logger.info('✓ Analytics routes loaded at /api/analytics');
  
  // Log all registered routes for debugging
  logger.info('═══════════════════════════════════════');
  logger.info('✅ All routes registered successfully');
  logger.info('═══════════════════════════════════════');
  logger.info('');
  logger.info('Available endpoints:');
  logger.info('');
  logger.info('  Public:');
  logger.info('  GET    /health');
  logger.info('  GET    /');
  logger.info('');
  logger.info('  Auth:');
  logger.info('  POST   /api/auth/register');
  logger.info('  POST   /api/auth/login');
  logger.info('  POST   /api/auth/logout');
  logger.info('  GET    /api/auth/me');
  logger.info('  GET    /api/auth/session');
  logger.info('  POST   /api/auth/set-cookie');
  logger.info('  POST   /api/auth/google');
  logger.info('');
  logger.info('  Agents:');
  logger.info('  GET    /api/agents');
  logger.info('  POST   /api/agents');
  logger.info('  GET    /api/agents/:id');
  logger.info('  PUT    /api/agents/:id');
  logger.info('  DELETE /api/agents/:id');
  logger.info('');
  logger.info('  WhatsApp:');
  logger.info('  POST   /api/whatsapp/generate-qr/:agentId');
  logger.info('  GET    /api/whatsapp/connection-status/:agentId');
  logger.info('  POST   /api/whatsapp/disconnect/:agentId');
  logger.info('  GET    /api/whatsapp/qr-status/:agentId');
  logger.info('');
  logger.info('  User:');
  logger.info('  GET    /api/user/profile');
  logger.info('  PUT    /api/user/profile');
  logger.info('  GET    /api/user/credits');
  logger.info('  POST   /api/user/credits/purchase');
  logger.info('  GET    /api/user/stats');
  logger.info('  GET    /api/user/usage');
  logger.info('');
  logger.info('  Dashboard:');
  logger.info('  GET    /api/dashboard/overview');
  logger.info('');
} catch (error) {
  logger.error('❌ Error loading routes:', error);
  logger.error('Stack:', error.stack);
  throw error;
}

// Health check (public endpoint)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FlowAI Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      agents: '/api/agents',
      whatsapp: '/api/whatsapp',
      user: '/api/user',
      dashboard: '/api/dashboard',
      analytics: '/api/analytics'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: err.message
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404 Not Found:', { method: req.method, path: req.path });
  res.status(404).json({ 
    success: false,
    error: 'Not found',
    path: req.path,
    method: req.method,
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.listen(PORT, () => {
  logger.info('');
  logger.info('╔═══════════════════════════════════════╗');
  logger.info('║   🚀 FlowAI Backend Server           ║');
  logger.info('║                                       ║');
  logger.info(`║   📡 Port: ${PORT.toString().padEnd(30)}║`);
  logger.info(`║   🌍 Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)}║`);
  logger.info('║   ✅ Server is running                ║');
  logger.info('╚═══════════════════════════════════════╝');
  logger.info('');
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API Base: http://localhost:${PORT}/api`);
  logger.info('');
});

module.exports = app;
