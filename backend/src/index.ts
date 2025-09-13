import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { checkDatabaseHealth, formatHealthStatus } from './utils/health-check.js';
import { logger, morganStream } from './utils/logger.js';
import { initializeSecurityEnvironment, getSecureSessionConfig, getCSPConfig } from './config/security.js';
import { initializeApiKeyManagement } from './utils/api-keys.js';
import { requestIdMiddleware, errorHandler, notFoundHandler } from './middleware/error.js';
import { 
  sanitizeInput, 
  rateLimiters, 
  csrfProtection, 
  generateCSRFToken, 
  securityHeaders 
} from './middleware/security.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import contentRoutes from './routes/content.js';
import scheduleRoutes from './routes/schedule.js';
import analyticsRoutes from './routes/analytics.js';

// Load environment variables
dotenv.config();

// Initialize security environment
initializeSecurityEnvironment();

// Initialize API key management
initializeApiKeyManagement();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Initialize PostgreSQL session store
const PgSession = connectPgSimple(session);

// Middleware
app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for AI service compatibility
}));
app.use(securityHeaders);
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: morganStream }));

// Apply general rate limiting to all routes
app.use(rateLimiters.general);
// Raw body parsing for Stripe webhooks
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Session configuration
const sessionConfig = getSecureSessionConfig();
app.use(session({
  store: new PgSession({
    conString: process.env['DATABASE_URL'],
    tableName: 'session',
    createTableIfMissing: true,
  }),
  ...sessionConfig,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// CSRF protection
app.use(generateCSRFToken);
app.use(csrfProtection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check route
app.get('/api/health/database', async (_req, res) => {
  try {
    const healthStatus = await checkDatabaseHealth();
    const statusCode = healthStatus.connected && healthStatus.canQuery ? 200 : 503;
    
    res.status(statusCode).json({
      status: statusCode === 200 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: healthStatus,
      formatted: formatHealthStatus(healthStatus),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
});

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    logger.info('Database connection established');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;