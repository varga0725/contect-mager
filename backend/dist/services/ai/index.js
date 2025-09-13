import { GeminiService } from './gemini.js';
import { ImagenService } from './imagen.js';
import { VeoService } from './veo.js';
export class AIService {
    geminiService;
    imagenService;
    veoService;
    config;
    constructor(config = {}) {
        this.geminiService = new GeminiService();
        this.imagenService = new ImagenService();
        this.veoService = new VeoService();
        this.config = {
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            timeout: config.timeout || 30000,
        };
    }
    /**
     * Generate text content using Gemini
     */
    async generateText(options) {
        return this.withRetry(() => this.geminiService.generateContent(options));
    }
    /**
     * Generate hashtags for content
     */
    async generateHashtags(content, platform) {
        return this.withRetry(() => this.geminiService.generateHashtags(content, platform));
    }
    /**
     * Generate images using Imagen
     */
    async generateImage(options) {
        return this.withRetry(() => this.imagenService.generateImage(options));
    }
    /**
     * Generate videos using Veo
     */
    async generateVideo(options) {
        return this.withRetry(() => this.veoService.generateVideo(options));
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
     * Retry mechanism for AI service calls
     */
    async withRetry(operation) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                // Add timeout to the operation
                return await Promise.race([
                    operation(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)),
                ]);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                // Don't retry on the last attempt
                if (attempt === this.config.retryAttempts) {
                    break;
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
        throw lastError;
    }
    /**
     * Validate content for safety (using Gemini's built-in safety filters)
     */
    async validateContent(content) {
        try {
            const response = await this.geminiService.generateContent({
                prompt: `Analyze this content for safety and appropriateness: "${content}". Respond with only "SAFE" or "UNSAFE: [reason]"`,
                platform: 'instagram', // Default platform for validation
            });
            if (response.success && response.content) {
                const result = response.content.toUpperCase();
                if (result.startsWith('SAFE')) {
                    return { safe: true };
                }
                else if (result.startsWith('UNSAFE:')) {
                    return { safe: false, reason: result.substring(7).trim() };
                }
            }
            // Default to safe if we can't determine
            return { safe: true };
        }
        catch (error) {
            console.error('Content validation error:', error);
            // Default to safe if validation fails
            return { safe: true };
        }
    }
}
// Export individual services and types
export { GeminiService, ImagenService, VeoService };
// Create and export a default instance
export const aiService = new AIService();
//# sourceMappingURL=index.js.map