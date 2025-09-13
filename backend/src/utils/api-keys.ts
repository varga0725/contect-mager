import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * API Key management utilities
 */

export interface ApiKeyConfig {
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * Generate a secure API key
 */
export function generateApiKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // API keys should be hex strings of specific length
  const hexRegex = /^[a-f0-9]{64}$/i; // 32 bytes = 64 hex chars
  return hexRegex.test(apiKey);
}

/**
 * Mask API key for logging (show only first and last 4 characters)
 */
export function maskApiKey(apiKey: string): string {
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
  private static instance: ExternalApiKeyManager;
  private keys: Map<string, string> = new Map();

  private constructor() {
    this.loadApiKeys();
  }

  public static getInstance(): ExternalApiKeyManager {
    if (!ExternalApiKeyManager.instance) {
      ExternalApiKeyManager.instance = new ExternalApiKeyManager();
    }
    return ExternalApiKeyManager.instance;
  }

  /**
   * Load API keys from environment variables
   */
  private loadApiKeys(): void {
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
      } else {
        logger.warn(`Missing API key for ${service}`);
      }
    }
  }

  /**
   * Get API key for a service
   */
  public getApiKey(service: string): string | undefined {
    return this.keys.get(service);
  }

  /**
   * Validate that required API keys are present
   */
  public validateRequiredKeys(requiredServices: string[]): {
    isValid: boolean;
    missingKeys: string[];
  } {
    const missingKeys: string[] = [];

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
  public rotateApiKey(service: string, newKey: string): void {
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
  public isApiKeyExpired(service: string): boolean {
    // This would need to be implemented based on service-specific logic
    // For now, we assume keys don't expire
    return false;
  }

  /**
   * Get API key health status
   */
  public getHealthStatus(): {
    [service: string]: {
      hasKey: boolean;
      keyPreview: string;
      isExpired: boolean;
    };
  } {
    const status: any = {};

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
export function validateExternalApiKeys(requiredServices: string[]) {
  return (req: any, res: any, next: any) => {
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
export function getExternalApiKey(service: string): string {
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
export function initializeApiKeyManagement(): void {
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