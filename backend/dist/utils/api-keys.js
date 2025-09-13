import crypto from 'crypto';
import { logger } from './logger.js';
/**
 * Generate a secure API key
 */
export function generateApiKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}
/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey, hash) {
    const computedHash = hashApiKey(apiKey);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}
/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey) {
    // API keys should be hex strings of specific length
    const hexRegex = /^[a-f0-9]{64}$/i; // 32 bytes = 64 hex chars
    return hexRegex.test(apiKey);
}
/**
 * Mask API key for logging (show only first and last 4 characters)
 */
export function maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
        return '****';
    }
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(0, apiKey.length - 8));
    return `${start}${middle}${end}`;
}
/**
 * External service API key management
 */
export class ExternalApiKeyManager {
    static instance;
    keys = new Map();
    constructor() {
        this.loadApiKeys();
    }
    static getInstance() {
        if (!ExternalApiKeyManager.instance) {
            ExternalApiKeyManager.instance = new ExternalApiKeyManager();
        }
        return ExternalApiKeyManager.instance;
    }
    /**
     * Load API keys from environment variables
     */
    loadApiKeys() {
        const apiKeys = {
            google: process.env.GOOGLE_AI_API_KEY,
            stripe: process.env.STRIPE_SECRET_KEY,
            internal: process.env.INTERNAL_API_KEY,
        };
        for (const [service, key] of Object.entries(apiKeys)) {
            if (key) {
                this.keys.set(service, key);
                logger.info(`Loaded API key for ${service}`, {
                    service,
                    keyPreview: maskApiKey(key),
                });
            }
            else {
                logger.warn(`Missing API key for ${service}`);
            }
        }
    }
    /**
     * Get API key for a service
     */
    getApiKey(service) {
        return this.keys.get(service);
    }
    /**
     * Validate that required API keys are present
     */
    validateRequiredKeys(requiredServices) {
        const missingKeys = [];
        for (const service of requiredServices) {
            if (!this.keys.has(service)) {
                missingKeys.push(service);
            }
        }
        return {
            isValid: missingKeys.length === 0,
            missingKeys,
        };
    }
    /**
     * Rotate API key for a service
     */
    rotateApiKey(service, newKey) {
        if (!newKey) {
            throw new Error(`New API key for ${service} cannot be empty`);
        }
        const oldKey = this.keys.get(service);
        this.keys.set(service, newKey);
        logger.info(`API key rotated for ${service}`, {
            service,
            oldKeyPreview: oldKey ? maskApiKey(oldKey) : 'none',
            newKeyPreview: maskApiKey(newKey),
        });
    }
    /**
     * Check if API key is expired (for services that support expiration)
     */
    isApiKeyExpired(service) {
        // This would need to be implemented based on service-specific logic
        // For now, we assume keys don't expire
        return false;
    }
    /**
     * Get API key health status
     */
    getHealthStatus() {
        const status = {};
        for (const [service, key] of this.keys.entries()) {
            status[service] = {
                hasKey: !!key,
                keyPreview: maskApiKey(key),
                isExpired: this.isApiKeyExpired(service),
            };
        }
        return status;
    }
}
/**
 * Middleware to validate external service API keys
 */
export function validateExternalApiKeys(requiredServices) {
    return (req, res, next) => {
        const keyManager = ExternalApiKeyManager.getInstance();
        const validation = keyManager.validateRequiredKeys(requiredServices);
        if (!validation.isValid) {
            logger.error('Missing required API keys', {
                missingKeys: validation.missingKeys,
                endpoint: req.path,
            });
            return res.status(503).json({
                success: false,
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Required external services are not configured',
                    details: {
                        missingServices: validation.missingKeys,
                    },
                },
                timestamp: new Date().toISOString(),
            });
        }
        next();
    };
}
/**
 * Get API key for external service with error handling
 */
export function getExternalApiKey(service) {
    const keyManager = ExternalApiKeyManager.getInstance();
    const key = keyManager.getApiKey(service);
    if (!key) {
        throw new Error(`API key for ${service} is not configured`);
    }
    return key;
}
/**
 * Initialize API key management
 */
export function initializeApiKeyManagement() {
    const keyManager = ExternalApiKeyManager.getInstance();
    const healthStatus = keyManager.getHealthStatus();
    logger.info('API key management initialized', {
        services: Object.keys(healthStatus),
        status: healthStatus,
    });
    // Validate critical services in production
    if (process.env.NODE_ENV === 'production') {
        const criticalServices = ['google', 'stripe', 'internal'];
        const validation = keyManager.validateRequiredKeys(criticalServices);
        if (!validation.isValid) {
            throw new Error(`Missing critical API keys in production: ${validation.missingKeys.join(', ')}`);
        }
    }
}
//# sourceMappingURL=api-keys.js.map