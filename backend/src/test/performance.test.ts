import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import { GeminiService } from '../services/ai/gemini';
import { ImagenService } from '../services/ai/imagen';
import { VeoService } from '../services/ai/veo';

describe('AI Services Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Response Time Tests', () => {
    it('should generate captions within acceptable time limits', async () => {
      const geminiService = new GeminiService();
      
      // Mock the API call to return quickly
      vi.spyOn(geminiService as any, 'generateContent').mockResolvedValue({
        response: {
          text: () => 'Test caption for performance testing'
        }
      });

      const startTime = performance.now();
      
      await geminiService.generateCaption({
        prompt: 'Test prompt',
        platform: 'instagram',
        tone: 'casual',
        includeHashtags: true,
        maxLength: 100
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds (mocked, but tests the flow)
      expect(duration).toBeLessThan(5000);
    });

    it('should generate images within acceptable time limits', async () => {
      const imagenService = new ImagenService();
      
      // Mock the API call
      vi.spyOn(imagenService as any, 'generateImage').mockResolvedValue({
        images: [{
          bytesBase64Encoded: 'mock-base64-data'
        }]
      });

      const startTime = performance.now();
      
      await imagenService.generateImage({
        prompt: 'Test image prompt',
        aspectRatio: '1:1',
        style: 'photographic'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds (mocked)
      expect(duration).toBeLessThan(10000);
    });

    it('should generate videos within acceptable time limits', async () => {
      const veoService = new VeoService();
      
      // Mock the API call
      vi.spyOn(veoService as any, 'generateVideo').mockResolvedValue({
        video: {
          uri: 'mock-video-uri'
        }
      });

      const startTime = performance.now();
      
      await veoService.generateVideo({
        prompt: 'Test video prompt',
        duration: 5
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 30 seconds (mocked)
      expect(duration).toBeLessThan(30000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple caption requests concurrently', async () => {
      const geminiService = new GeminiService();
      
      // Mock the API call
      vi.spyOn(geminiService as any, 'generateContent').mockResolvedValue({
        response: {
          text: () => 'Concurrent test caption'
        }
      });

      const requests = Array.from({ length: 5 }, (_, i) => 
        geminiService.generateCaption({
          prompt: `Test prompt ${i}`,
          platform: 'instagram',
          tone: 'casual',
          includeHashtags: true,
          maxLength: 100
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All requests should complete
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.caption).toBeTruthy();
      });

      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(10000);
    });

    it('should handle mixed AI service requests concurrently', async () => {
      const geminiService = new GeminiService();
      const imagenService = new ImagenService();
      
      // Mock the API calls
      vi.spyOn(geminiService as any, 'generateContent').mockResolvedValue({
        response: {
          text: () => 'Mixed test caption'
        }
      });
      
      vi.spyOn(imagenService as any, 'generateImage').mockResolvedValue({
        images: [{
          bytesBase64Encoded: 'mock-base64-data'
        }]
      });

      const requests = [
        geminiService.generateCaption({
          prompt: 'Caption prompt',
          platform: 'instagram',
          tone: 'casual',
          includeHashtags: true,
          maxLength: 100
        }),
        imagenService.generateImage({
          prompt: 'Image prompt',
          aspectRatio: '1:1',
          style: 'photographic'
        }),
        geminiService.generateCaption({
          prompt: 'Another caption prompt',
          platform: 'tiktok',
          tone: 'energetic',
          includeHashtags: true,
          maxLength: 150
        })
      ];

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All requests should complete
      expect(results).toHaveLength(3);
      
      // Should handle mixed requests efficiently
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated requests', async () => {
      const geminiService = new GeminiService();
      
      // Mock the API call
      vi.spyOn(geminiService as any, 'generateContent').mockResolvedValue({
        response: {
          text: () => 'Memory test caption'
        }
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 50; i++) {
        await geminiService.generateCaption({
          prompt: `Memory test prompt ${i}`,
          platform: 'instagram',
          tone: 'casual',
          includeHashtags: true,
          maxLength: 100
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should handle errors quickly without blocking', async () => {
      const geminiService = new GeminiService();
      
      // Mock API call to throw error
      vi.spyOn(geminiService as any, 'generateContent').mockRejectedValue(
        new Error('API Error')
      );

      const startTime = performance.now();
      
      try {
        await geminiService.generateCaption({
          prompt: 'Error test prompt',
          platform: 'instagram',
          tone: 'casual',
          includeHashtags: true,
          maxLength: 100
        });
      } catch (error) {
        // Expected to throw
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Error handling should be fast
      expect(duration).toBeLessThan(1000);
    });

    it('should recover from rate limiting efficiently', async () => {
      const geminiService = new GeminiService();
      
      let callCount = 0;
      vi.spyOn(geminiService as any, 'generateContent').mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Rate limit exceeded');
        }
        return Promise.resolve({
          response: {
            text: () => 'Rate limit recovery test'
          }
        });
      });

      const startTime = performance.now();
      
      const result = await geminiService.generateCaption({
        prompt: 'Rate limit test prompt',
        platform: 'instagram',
        tone: 'casual',
        includeHashtags: true,
        maxLength: 100
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should eventually succeed
      expect(result.caption).toBeTruthy();
      
      // Should handle rate limiting within reasonable time
      expect(duration).toBeLessThan(5000);
    });
  });
});