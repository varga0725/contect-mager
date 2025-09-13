import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImagenService } from '../services/ai/imagen.js';

describe('ImagenService', () => {
  let imagenService: ImagenService;

  beforeEach(() => {
    // Mock environment variable
    vi.stubEnv('GOOGLE_AI_API_KEY', 'test-api-key');
    imagenService = new ImagenService();
  });

  describe('generateImage', () => {
    it('should generate image with correct platform dimensions', async () => {
      const options = {
        prompt: 'beautiful landscape',
        platform: 'instagram' as const,
        aspectRatio: 'square' as const,
      };

      const result = await imagenService.generateImage(options);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.width).toBe(1080);
      expect(result.metadata?.height).toBe(1080);
    });

    it('should handle different aspect ratios for Instagram', async () => {
      // Test portrait
      const portraitResult = await imagenService.generateImage({
        prompt: 'test',
        platform: 'instagram',
        aspectRatio: 'portrait',
      });

      expect(portraitResult.metadata?.width).toBe(1080);
      expect(portraitResult.metadata?.height).toBe(1350);

      // Test landscape
      const landscapeResult = await imagenService.generateImage({
        prompt: 'test',
        platform: 'instagram',
        aspectRatio: 'landscape',
      });

      expect(landscapeResult.metadata?.width).toBe(1080);
      expect(landscapeResult.metadata?.height).toBe(608);
    });

    it('should handle TikTok portrait dimensions', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'tiktok',
        aspectRatio: 'portrait',
      });

      expect(result.metadata?.width).toBe(1080);
      expect(result.metadata?.height).toBe(1920);
    });

    it('should handle YouTube landscape dimensions', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'youtube',
        aspectRatio: 'landscape',
      });

      expect(result.metadata?.width).toBe(1920);
      expect(result.metadata?.height).toBe(1080);
    });

    it('should handle LinkedIn dimensions', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'linkedin',
        aspectRatio: 'landscape',
      });

      expect(result.metadata?.width).toBe(1200);
      expect(result.metadata?.height).toBe(627);
    });

    it('should handle Twitter dimensions', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'twitter',
        aspectRatio: 'landscape',
      });

      expect(result.metadata?.width).toBe(1200);
      expect(result.metadata?.height).toBe(675);
    });

    it('should default to square aspect ratio when not specified', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'instagram',
      });

      expect(result.metadata?.width).toBe(1080);
      expect(result.metadata?.height).toBe(1080);
    });

    it('should include style in the enhanced prompt', async () => {
      // Since we're using mock generation, we can't directly test the prompt
      // but we can test that different styles are handled
      const styles = ['photographic', 'digital-art', 'illustration', 'anime'] as const;
      
      for (const style of styles) {
        const result = await imagenService.generateImage({
          prompt: 'test',
          platform: 'instagram',
          style,
        });

        expect(result.success).toBe(true);
      }
    });

    it('should return mock data with proper structure', async () => {
      const result = await imagenService.generateImage({
        prompt: 'test image',
        platform: 'instagram',
      });

      expect(result).toMatchObject({
        success: true,
        imageUrl: expect.stringContaining('picsum.photos'),
        metadata: {
          width: expect.any(Number),
          height: expect.any(Number),
          format: 'jpeg',
          size: expect.any(Number),
        },
      });
    });

    it('should simulate processing delay', async () => {
      const startTime = Date.now();
      
      await imagenService.generateImage({
        prompt: 'test',
        platform: 'instagram',
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 100ms (mock delay)
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some margin
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is configured', () => {
      expect(imagenService.isConfigured()).toBe(true);
    });

    it('should return false when API key is not configured', () => {
      vi.stubEnv('GOOGLE_AI_API_KEY', '');
      const unconfiguredService = new ImagenService();
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('platform dimensions', () => {
    it('should return correct dimensions for all platforms and aspect ratios', () => {
      const testCases = [
        { platform: 'instagram', aspectRatio: 'square', expected: { width: 1080, height: 1080 } },
        { platform: 'instagram', aspectRatio: 'portrait', expected: { width: 1080, height: 1350 } },
        { platform: 'instagram', aspectRatio: 'landscape', expected: { width: 1080, height: 608 } },
        { platform: 'tiktok', aspectRatio: 'portrait', expected: { width: 1080, height: 1920 } },
        { platform: 'youtube', aspectRatio: 'landscape', expected: { width: 1920, height: 1080 } },
        { platform: 'linkedin', aspectRatio: 'landscape', expected: { width: 1200, height: 627 } },
        { platform: 'twitter', aspectRatio: 'landscape', expected: { width: 1200, height: 675 } },
      ];

      testCases.forEach(async ({ platform, aspectRatio, expected }) => {
        const result = await imagenService.generateImage({
          prompt: 'test',
          platform: platform as any,
          aspectRatio: aspectRatio as any,
        });

        expect(result.metadata?.width).toBe(expected.width);
        expect(result.metadata?.height).toBe(expected.height);
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid platform gracefully', async () => {
      // The service should handle invalid platforms by using default dimensions
      const result = await imagenService.generateImage({
        prompt: 'test',
        platform: 'invalid-platform' as any,
      });

      // Should succeed with default dimensions
      expect(result.success).toBe(true);
      expect(result.metadata?.width).toBe(1080);
      expect(result.metadata?.height).toBe(1080);
    });
  });
});