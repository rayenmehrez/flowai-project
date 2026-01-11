require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Render.com and other reverse proxies
// This allows Express to correctly identify client IPs from X-Forwarded-For header
app.set('trust proxy', true);

// CORS configuration - MUST be before routes and all other middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'https://v0-flowai-website-design.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl requests)
    if (!origin) {
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
  logger.info('Loading routes...');
  
  // Load auth routes
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  logger.info('✓ Auth routes loaded at /api/auth');
  
  // Load other routes
  app.use('/api/agents', require('./routes/agents'));
  logger.info('✓ Agent routes loaded');
  
  app.use('/api/dashboard', require('./routes/dashboard'));
  logger.info('✓ Dashboard routes loaded');
  
  app.use('/api/webhooks', require('./routes/webhooks'));
  logger.info('✓ Webhook routes loaded');
  
  // Log all registered routes for debugging
  logger.info('All routes registered successfully');
} catch (error) {
  logger.error('Error loading routes:', error);
  logger.error('Stack:', error.stack);
  throw error;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
