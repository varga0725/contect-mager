import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIService } from '../services/ai/index.js';
import { AIServiceError } from '../types/errors.js';

// Mock the individual AI services
vi.mock('../services/ai/gemini.js', () => ({
  GeminiService: vi.fn().mockImplementation(() => ({
    generateContent: vi.fn(),
    generateHashtags: vi.fn(),
  })),
}));

vi.mock('../services/ai/imagen.js', () => ({
  ImagenService: vi.fn().mockImplementation(() => ({
    generateImage: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  })),
}));

vi.mock('../services/ai/veo.js', () => ({
  VeoService: vi.fn().mockImplementation(() => ({
    generateVideo: vi.fn(),
    isConfigured: vi.fn().mockReturnValue(true),
  })),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  loggers: {
    ai: {
      request: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      retry: vi.fn(),
    },
  },
}));

describe('AI Service Retry Mechanism', () => {
  let aiService: AIService;
  let mockGeminiService: any;
  let mockImagenService: any;
  let mockVeoService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create AI service with test configuration
    aiService = new AIService({
      retryAttempts: 3,
      retryDelay: 100, // Shorter delay for tests
      timeout: 1000,
      maxRetryDelay: 500,
      backoffMultiplier: 2,
    });

    // Get mocked services
    const { GeminiService } = require('../services/ai/gemini.js');
    const { ImagenService } = require('../services/ai/imagen.js');
    const { VeoService } = require('../services/ai/veo.js');

    mockGeminiService = new GeminiService();
    mockImagenService = new ImagenService();
    mockVeoService = new VeoService();

    // Replace the services in the AI service instance
    (aiService as any).geminiService = mockGeminiService;
    (aiService as any).imagenService = mockImagenService;
    (aiService as any).veoService = mockVeoService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Operations', () => {
    it('should succeed on first attempt', async () => {
      const mockResponse = { success: true, content: 'Generated text' };
      mockGeminiService.generateContent.mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateText({
        prompt: 'Test prompt',
        platform: 'instagram',
      });

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should log successful requests', async () => {
      const mockResponse = { success: true, content: 'Generated text' };
      mockGeminiService.generateContent.mockResolvedValueOnce(mockResponse);

      const { loggers } = require('../utils/logger.js');

      await aiService.generateText(
        { prompt: 'Test prompt', platform: 'instagram' },
        123,
        'req-456'
      );

      expect(loggers.ai.request).toHaveBeenCalledWith(
        123,
        'gemini',
        'Test prompt',
        'req-456'
      );
      expect(loggers.ai.success).toHaveBeenCalledWith(
        123,
        'gemini',
        expect.any(Number),
        'req-456'
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry on server errors and eventually succeed', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      const mockResponse = { success: true, content: 'Generated text' };

      mockGeminiService.generateContent
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateText({
        prompt: 'Test prompt',
        platform: 'instagram',
      });

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should retry with exponential backoff', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      mockGeminiService.generateContent.mockRejectedValue(serverError);

      const startTime = Date.now();
      
      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        // Expected to fail after retries
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have taken at least the sum of delays: 100 + 200 = 300ms
      expect(duration).toBeGreaterThan(250);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should log retry attempts', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      mockGeminiService.generateContent.mockRejectedValue(serverError);

      const { loggers } = require('../utils/logger.js');

      try {
        await aiService.generateText(
          { prompt: 'Test prompt', platform: 'instagram' },
          123,
          'req-456'
        );
      } catch (error) {
        // Expected to fail
      }

      expect(loggers.ai.retry).toHaveBeenCalledWith(123, 'gemini', 1, 'req-456');
      expect(loggers.ai.retry).toHaveBeenCalledWith(123, 'gemini', 2, 'req-456');
      expect(loggers.ai.error).toHaveBeenCalledWith(
        123,
        'gemini',
        expect.any(String),
        'req-456'
      );
    });

    it('should not retry on client errors', async () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;

      mockGeminiService.generateContent.mockRejectedValue(clientError);

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
      }

      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should retry on rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      const mockResponse = { success: true, content: 'Generated text' };

      mockGeminiService.generateContent
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateText({
        prompt: 'Test prompt',
        platform: 'instagram',
      });

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
    });

    it('should not retry on quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      mockGeminiService.generateContent.mockRejectedValue(quotaError);

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.message).toContain('quota');
      }

      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running operations', async () => {
      mockGeminiService.generateContent.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds
      );

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
        expect.fail('Should have thrown timeout error');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.message).toContain('timeout');
      }
    });

    it('should retry after timeout', async () => {
      let callCount = 0;
      mockGeminiService.generateContent.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return new Promise(resolve => setTimeout(resolve, 2000)); // Timeout
        }
        return Promise.resolve({ success: true, content: 'Generated text' });
      });

      const result = await aiService.generateText({
        prompt: 'Test prompt',
        platform: 'instagram',
      });

      expect(result).toEqual({ success: true, content: 'Generated text' });
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize rate limit errors correctly', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      (rateLimitError as any).retryAfter = 60;

      mockGeminiService.generateContent.mockRejectedValue(rateLimitError);

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.message).toContain('rate limit');
        expect(error.details).toEqual({
          service: 'gemini',
          retryAfter: 60,
        });
      }
    });

    it('should categorize service unavailable errors correctly', async () => {
      const unavailableError = new Error('Service unavailable');
      (unavailableError as any).status = 503;

      mockGeminiService.generateContent.mockRejectedValue(unavailableError);

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.message).toContain('service unavailable');
        expect(error.details).toEqual({
          service: 'gemini',
          status: 503,
        });
      }
    });

    it('should handle unknown errors gracefully', async () => {
      const unknownError = new Error('Unknown error');

      mockGeminiService.generateContent.mockRejectedValue(unknownError);

      try {
        await aiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect(error.message).toContain('service error');
        expect(error.details).toEqual({
          service: 'gemini',
          originalError: unknownError,
        });
      }
    });
  });

  describe('Different AI Services', () => {
    it('should handle image generation with retry', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      const mockResponse = { success: true, imageUrl: 'http://example.com/image.jpg' };

      mockImagenService.generateImage
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateImage({
        prompt: 'Test image prompt',
        platform: 'instagram',
      });

      expect(result).toEqual(mockResponse);
      expect(mockImagenService.generateImage).toHaveBeenCalledTimes(2);
    });

    it('should handle video generation with retry', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      const mockResponse = { success: true, videoUrl: 'http://example.com/video.mp4' };

      mockVeoService.generateVideo
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateVideo({
        prompt: 'Test video prompt',
        platform: 'tiktok',
      });

      expect(result).toEqual(mockResponse);
      expect(mockVeoService.generateVideo).toHaveBeenCalledTimes(2);
    });

    it('should handle hashtag generation with retry', async () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      const mockResponse = { success: true, content: '#test #hashtags' };

      mockGeminiService.generateHashtags
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(mockResponse);

      const result = await aiService.generateHashtags('Test content', 'instagram');

      expect(result).toEqual(mockResponse);
      expect(mockGeminiService.generateHashtags).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration', () => {
    it('should respect custom retry configuration', async () => {
      const customAiService = new AIService({
        retryAttempts: 1,
        retryDelay: 50,
        timeout: 500,
      });

      (customAiService as any).geminiService = mockGeminiService;

      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      mockGeminiService.generateContent.mockRejectedValue(serverError);

      try {
        await customAiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        // Expected to fail
      }

      // Should only try once (no retries)
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry delay', async () => {
      const customAiService = new AIService({
        retryAttempts: 5,
        retryDelay: 100,
        maxRetryDelay: 200,
        backoffMultiplier: 3,
      });

      (customAiService as any).geminiService = mockGeminiService;

      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      mockGeminiService.generateContent.mockRejectedValue(serverError);

      const startTime = Date.now();

      try {
        await customAiService.generateText({
          prompt: 'Test prompt',
          platform: 'instagram',
        });
      } catch (error) {
        // Expected to fail
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // With maxRetryDelay of 200ms, total delay should be less than without the limit
      // Delays would be: 100, 200, 200, 200 = 700ms + jitter
      expect(duration).toBeLessThan(1000);
      expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(5);
    });
  });
});