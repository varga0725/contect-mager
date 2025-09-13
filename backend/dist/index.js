import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { checkDatabaseHealth, formatHealthStatus } from './utils/health-check.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscription.js';
import contentRoutes from './routes/content.js';
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env['PORT'] || 3001;
// Initialize PostgreSQL session store
const PgSession = connectPgSimple(session);
// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('combined'));
// Raw body parsing for Stripe webhooks
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session configuration
app.use(session({
    store: new PgSession({
        conString: process.env['DATABASE_URL'],
        tableName: 'session',
        createTableIfMissing: true,
    }),
    secret: process.env['SESSION_SECRET'] || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env['NODE_ENV'] === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
    },
}));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/content', contentRoutes);
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
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
        });
    }
});
// Initialize database connection and start server
async function startServer() {
    try {
        // Test database connection
        await testConnection();
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
export default app;
//# sourceMappingURL=index.js.map