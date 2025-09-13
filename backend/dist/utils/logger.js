import winston from 'winston';
import path from 'path';
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Add colors to winston
winston.addColors(colors);
// Define log format
const format = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.errors({ stack: true }), winston.format.colorize({ all: true }), winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
// Define log format for production (JSON)
const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
// Create transports
const transports = [];
// Console transport
if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'debug',
        format,
    }));
}
else {
    transports.push(new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: productionFormat,
    }));
}
// File transports for production
if (process.env.NODE_ENV === 'production') {
    // Error log file
    transports.push(new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    // Combined log file
    transports.push(new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: productionFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels,
    format: process.env.NODE_ENV === 'production' ? productionFormat : format,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});
// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
    logger.exceptions.handle(new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
        format: productionFormat,
    }));
    logger.rejections.handle(new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'rejections.log'),
        format: productionFormat,
    }));
}
// Create a stream object for Morgan HTTP logging
export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Utility functions for structured logging
export const loggers = {
    // Authentication events
    auth: {
        login: (userId, email, ip) => {
            logger.info('User login', { userId, email, ip, event: 'login' });
        },
        logout: (userId, email) => {
            logger.info('User logout', { userId, email, event: 'logout' });
        },
        register: (userId, email, ip) => {
            logger.info('User registration', { userId, email, ip, event: 'register' });
        },
        loginFailed: (email, ip, reason) => {
            logger.warn('Login failed', { email, ip, reason, event: 'login_failed' });
        },
    },
    // AI service events
    ai: {
        request: (userId, service, prompt, requestId) => {
            logger.info('AI service request', {
                userId,
                service,
                promptLength: prompt.length,
                requestId,
                event: 'ai_request'
            });
        },
        success: (userId, service, duration, requestId) => {
            logger.info('AI service success', {
                userId,
                service,
                duration,
                requestId,
                event: 'ai_success'
            });
        },
        error: (userId, service, error, requestId) => {
            logger.error('AI service error', {
                userId,
                service,
                error,
                requestId,
                event: 'ai_error'
            });
        },
        retry: (userId, service, attempt, requestId) => {
            logger.warn('AI service retry', {
                userId,
                service,
                attempt,
                requestId,
                event: 'ai_retry'
            });
        },
    },
    // Usage tracking
    usage: {
        increment: (userId, contentType, newUsage, limit) => {
            logger.info('Usage incremented', {
                userId,
                contentType,
                newUsage,
                limit,
                event: 'usage_increment'
            });
        },
        limitExceeded: (userId, usage, limit) => {
            logger.warn('Usage limit exceeded', {
                userId,
                usage,
                limit,
                event: 'usage_limit_exceeded'
            });
        },
    },
    // Database events
    database: {
        connectionError: (error) => {
            logger.error('Database connection error', { error, event: 'db_connection_error' });
        },
        queryError: (query, error, duration) => {
            logger.error('Database query error', {
                query: query.substring(0, 100),
                error,
                duration,
                event: 'db_query_error'
            });
        },
        slowQuery: (query, duration) => {
            logger.warn('Slow database query', {
                query: query.substring(0, 100),
                duration,
                event: 'db_slow_query'
            });
        },
    },
};
export default logger;
//# sourceMappingURL=logger.js.map