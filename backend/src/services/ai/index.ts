import { GeminiService, GeminiGenerationOptions, GeminiResponse } from './gemini.js';
import { ImagenService, ImagenGenerationOptions, ImagenResponse } from './imagen.js';
import { VeoService, VeoGenerationOptions, VeoResponse } from './veo.js';
import { AIServiceError, ErrorCode } from '../../types/errors.js';
import { logger, loggers } from '../../utils/logger.js';

export interface AIServiceConfig {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  maxRetryDelay?: number;
  backoffMultiplier?: number;
}

export class AIService {
  private geminiService: GeminiService;
  private imagenService: ImagenService;
  private veoService: VeoService;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.geminiService = new GeminiService();
    this.imagenService = new ImagenService();
    this.veoService = new VeoService();
    
    this.config = {
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 30000,
      maxRetryDelay: config.maxRetryDelay || 10000,
      backoffMultiplier: config.backoffMultiplier || 2,
    };
  }

  /**
   * Generate text content using Gemini
   */
  async generateText(options: GeminiGenerationOptions, userId?: number, requestId?: string): Promise<GeminiResponse> {
    return this.withRetry(
      () => this.geminiService.generateContent(options),
      'gemini',
      userId,
      requestId,
      options.prompt
    );
  }

  /**
   * Generate hashtags for content
   */
  async generateHashtags(content: string, platform: string, userId?: number, requestId?: string): Promise<GeminiResponse> {
    return this.withRetry(
      () => this.geminiService.generateHashtags(content, platform),
      'gemini-hashtags',
      userId,
      requestId,
      `Generate hashtags for ${platform}: ${content.substring(0, 100)}`
    );
  }

  /**
   * Generate images using Imagen
   */
  async generateImage(options: ImagenGenerationOptions, userId?: number, requestId?: string): Promise<ImagenResponse> {
    return this.withRetry(
      () => this.imagenService.generateImage(options),
      'imagen',
      userId,
      requestId,
      options.prompt
    );
  }

  /**
   * Generate videos using Veo
   */
  async generateVideo(options: VeoGenerationOptions, userId?: number, requestId?: string): Promise<VeoResponse> {
    return this.withRetry(
      () => this.veoService.generateVideo(options),
      'veo',
      userId,
      requestId,
      options.prompt
    );
  }

  /**
   * Check service health and configuration
   */
  getServiceStatus() {
    return {
      gemini: {
        configured: true, // Gemini is always available with the SDK
        available: true,
      },
      imagen: {
        configured: this.imagenService.isConfigured(),
        available: false, // Will be true when API is available
      },
      veo: {
        configured: this.veoService.isConfigured(),
        available: false, // Will be true when API is available
      },
    };
  }

  /**
   * Enhanced retry mechanism for AI service calls with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    serviceName: string,
    userId?: number,
    requestId?: string,
    prompt?: string
  ): Promise<T> {
    let lastError: Error | null = null;
    const startTime = Date.now();
    
    // Log the initial request
    if (userId && requestId && prompt) {
      loggers.ai.request(userId, serviceName, prompt, requestId);
    }
    
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        // Add timeout to the operation
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new AIServiceError(
              `${serviceName} service timeout after ${this.config.timeout}ms`,
              { service: serviceName, timeout: this.config.timeout }
            )), this.config.timeout)
          ),
        ]);

        // Log successful completion
        if (userId && requestId) {
          const duration = Date.now() - startTime;
          loggers.ai.success(userId, serviceName, duration, requestId);
        }

        return result;
      } catch (error) {
        const aiError = this.handleAIError(error, serviceName);
        lastError = aiError;
        
        // Log retry attempt
        if (userId && requestId && attempt < this.config.retryAttempts!) {
          loggers.ai.retry(userId, serviceName, attempt, requestId);
        }
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(aiError)) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        // Calculate exponential backoff delay
        const baseDelay = this.config.retryDelay!;
        const backoffDelay = Math.min(
          baseDelay * Math.pow(this.config.backoffMultiplier!, attempt - 1),
          this.config.maxRetryDelay!
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * backoffDelay;
        const delay = backoffDelay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Log final error
    if (userId && requestId && lastError) {
      loggers.ai.error(userId, serviceName, lastError.message, requestId);
    }
    
    throw lastError;
  }

  /**
   * Handle and categorize AI service errors
   */
  private handleAIError(error: any, serviceName: string): AIServiceError {
    if (error instanceof AIServiceError) {
      return error;
    }

    // Handle specific error types
    if (error.message?.includes('timeout')) {
      return new AIServiceError(
        `${serviceName} service timeout`,
        { service: serviceName, originalError: error.message }
      );
    }

    if (error.message?.includes('rate limit') || error.status === 429) {
      return new AIServiceError(
        `${serviceName} rate limit exceeded`,
        { service: serviceName, retryAfter: error.retryAfter }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('billing')) {
      return new AIServiceError(
        `${serviceName} quota exceeded`,
        { service: serviceName, originalError: error.message }
      );
    }

    if (error.status >= 500 || error.message?.includes('unavailable')) {
      return new AIServiceError(
        `${serviceName} service unavailable`,
        { service: serviceName, status: error.status }
      );
    }

    if (error.status >= 400 && error.status < 500) {
      return new AIServiceError(
        `${serviceName} client error: ${error.message}`,
        { service: serviceName, status: error.status }
      );
    }

    // Generic AI service error
    return new AIServiceError(
      `${serviceName} service error: ${error.message || 'Unknown error'}`,
      { service: serviceName, originalError: error }
    );
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: AIServiceError): boolean {
    // Don't retry client errors (4xx) except rate limits
    if (error.details?.status >= 400 && error.details?.status < 500) {
      return !error.message.includes('rate limit');
    }

    // Don't retry quota/billing errors
    if (error.message.includes('quota') || error.message.includes('billing')) {
      return true;
    }

    return false;
  }

  /**
   * Validate content for safety (using Gemini's built-in safety filters)
   */
  async validateContent(content: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const response = await this.geminiService.generateContent({
        prompt: `Analyze this content for safety and appropriateness: "${content}". Respond with only "SAFE" or "UNSAFE: [reason]"`,
        platform: 'instagram', // Default platform for validation
      });

      if (response.success && response.content) {
        const result = response.content.toUpperCase();
        if (result.startsWith('SAFE')) {
          return { safe: true };
        } else if (result.startsWith('UNSAFE:')) {
          return { safe: false, reason: result.substring(7).trim() };
        }
      }
      
      // Default to safe if we can't determine
      return { safe: true };
    } catch (error) {
      console.error('Content validation error:', error);
      // Default to safe if validation fails
      return { safe: true };
    }
  }
}

// Export individual services and types
export { GeminiService, ImagenService, VeoService };
export type { 
  GeminiGenerationOptions, 
  GeminiResponse,
  ImagenGenerationOptions, 
  ImagenResponse,
  VeoGenerationOptions, 
  VeoResponse 
};

// Create and export a default instance
export const aiService = new AIService();