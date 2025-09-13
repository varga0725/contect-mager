import crypto from 'crypto';
/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
    // Session configuration
    SESSION_SECRET_MIN_LENGTH: 32,
    SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    // Rate limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    AUTH_RATE_LIMIT_MAX: 5,
    AI_RATE_LIMIT_MAX: 10,
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    // API key requirements
    API_KEY_LENGTH: 32,
    // Content limits
    MAX_CONTENT_SIZE: '10mb',
    MAX_PROMPT_LENGTH: 1000,
};
/**
 * Generate a secure session secret
 */
export function generateSessionSecret() {
    return crypto.randomBytes(SECURITY_CONFIG.SESSION_SECRET_MIN_LENGTH).toString('hex');
}
/**
 * Generate a secure API key
 */
export function generateApiKey() {
    return crypto.randomBytes(SECURITY_CONFIG.API_KEY_LENGTH).toString('hex');
}
/**
 * Validate session secret strength
 */
export function validateSessionSecret(secret) {
    return secret && secret.length >= SECURITY_CONFIG.SESSION_SECRET_MIN_LENGTH;
}
/**
 * Get secure session configuration
 */
export function getSecureSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        secret: process.env.SESSION_SECRET || generateSessionSecret(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction, // HTTPS only in production
            httpOnly: true, // Prevent XSS
            maxAge: SECURITY_CONFIG.SESSION_MAX_AGE,
            sameSite: isProduction ? 'none' : 'lax', // CSRF protection
        },
        name: 'sessionId', // Don't use default session name
    };
}
/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};
/**
 * Content Security Policy configuration
 */
export function getCSPConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    const directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // Allow inline scripts for React
        "style-src 'self' 'unsafe-inline'", // Allow inline styles for CSS-in-JS
        "img-src 'self' data: https:", // Allow images from HTTPS and data URLs
        "font-src 'self' https:",
        "connect-src 'self' https:",
        "media-src 'self' https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ];
    if (!isProduction) {
        // Allow webpack dev server in development
        directives.push("connect-src 'self' ws: wss: http://localhost:* https://localhost:*");
    }
    return directives.join('; ');
}
/**
 * Validate environment variables for security
 */
export function validateSecurityEnvironment() {
    const errors = [];
    const warnings = [];
    // Check session secret
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        warnings.push('SESSION_SECRET not set, using generated secret (not recommended for production)');
    }
    else if (!validateSessionSecret(sessionSecret)) {
        errors.push(`SESSION_SECRET must be at least ${SECURITY_CONFIG.SESSION_SECRET_MIN_LENGTH} characters long`);
    }
    // Check database URL
    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required');
    }
    // Check API keys for external services
    if (!process.env.GOOGLE_AI_API_KEY) {
        warnings.push('GOOGLE_AI_API_KEY not set, AI features will not work');
    }
    if (!process.env.STRIPE_SECRET_KEY) {
        warnings.push('STRIPE_SECRET_KEY not set, subscription features will not work');
    }
    // Check internal API key
    if (!process.env.INTERNAL_API_KEY) {
        warnings.push('INTERNAL_API_KEY not set, generating one (not recommended for production)');
    }
    // Production-specific checks
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.SESSION_SECRET) {
            errors.push('SESSION_SECRET is required in production');
        }
        if (!process.env.INTERNAL_API_KEY) {
            errors.push('INTERNAL_API_KEY is required in production');
        }
        if (process.env.DATABASE_URL?.includes('localhost')) {
            warnings.push('Using localhost database in production');
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Initialize security environment
 */
export function initializeSecurityEnvironment() {
    const validation = validateSecurityEnvironment();
    // Log warnings
    validation.warnings.forEach(warning => {
        console.warn(`Security Warning: ${warning}`);
    });
    // Throw errors
    if (!validation.isValid) {
        const errorMessage = `Security Configuration Errors:\n${validation.errors.join('\n')}`;
        throw new Error(errorMessage);
    }
    // Generate missing keys in development
    if (process.env.NODE_ENV !== 'production') {
        if (!process.env.SESSION_SECRET) {
            process.env.SESSION_SECRET = generateSessionSecret();
            console.log('Generated SESSION_SECRET for development');
        }
        if (!process.env.INTERNAL_API_KEY) {
            process.env.INTERNAL_API_KEY = generateApiKey();
            console.log('Generated INTERNAL_API_KEY for development');
        }
    }
}
//# sourceMappingURL=security.js.map