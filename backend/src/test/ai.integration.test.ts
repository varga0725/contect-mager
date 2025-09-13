import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../services/ai/index.js';

// Mock the Google AI module for integration tests
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked AI response for integration test',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 15,
            totalTokenCount: 25,
          },
        },
      }),
    })),
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

describe('AI Services Integration', () => {
  beforeEach(() => {
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-api-key');
  });

  describe('Text Generation', () => {
    it('should generate text content for different platforms', async () => {
      const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'] as const;
      
      for (const platform of platforms) {
        const result = await aiService.generateText({
          prompt: 'Create engaging content about technology',
          platform,
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        expect(typeof result.content).toBe('string');
      }
    });

    it('should generate hashtags for content', async () => {
      const result = await aiService.generateHashtags(
        'Amazing sunset at the beach',
        'instagram'
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });
  });

  describe('Image Generation', () => {
    it('should generate images for different platforms', async () => {
      const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'] as const;
      
      for (const platform of platforms) {
        const result = await aiService.generateImage({
          prompt: 'Beautiful landscape with mountains',
          platform,
        });

        expect(result.success).toBe(true);
        expect(result.imageUrl).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });
  });

  describe('Video Generation', () => {
    it('should generate videos for different platforms', async () => {
      const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'] as const;
      
      for (const platform of platforms) {
        const result = await aiService.generateVideo({
          prompt: 'Dynamic video about innovation',
          platform,
          duration: 15,
        });

        expect(result.success).toBe(true);
        expect(result.videoUrl).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });
  });

  describe('Service Status', () => {
    it('should report correct service status', () => {
      const status = aiService.getServiceStatus();

      expect(status).toEqual({
        gemini: {
          configured: true,
          available: true,
        },
        imagen: {
          configured: false, // API key not set in test environment
          available: false, // Mock implementation
        },
        veo: {
          configured: false, // API key not set in test environment
          available: false, // Mock implementation
        },
      });
    });
  });

  describe('Content Validation', () => {
    it('should validate content safety', async () => {
      const result = await aiService.validateContent('This is safe content for social media');

      expect(result).toHaveProperty('safe');
      expect(typeof result.safe).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Test with empty prompt
      const result = await aiService.generateVideo({
        prompt: '',
        platform: 'instagram',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});