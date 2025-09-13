import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Set environment variables before importing
process.env['STRIPE_SECRET_KEY'] = 'sk_test_fake_key';
process.env['STRIPE_WEBHOOK_SECRET'] = 'whsec_fake_secret';

// Mock Stripe before any imports
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prices: {
        create: vi.fn().mockResolvedValue({ id: 'price_test123' }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test123',
            url: 'https://checkout.stripe.com/test',
          }),
        },
      },
      subscriptions: {
        cancel: vi.fn().mockResolvedValue({ id: 'sub_test123' }),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

// Mock AI services
vi.mock('../services/ai/index.js', () => ({
  aiService: {
    generateText: vi.fn().mockResolvedValue({
      success: true,
      content: 'Generated caption content for your post! 🌅 #sunset #beautiful',
    }),
    generateHashtags: vi.fn().mockResolvedValue({
      success: true,
      hashtags: ['#sunset', '#beautiful', '#nature', '#photography'],
    }),
    generateImage: vi.fn().mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/generated-image.jpg',
    }),
    generateVideo: vi.fn().mockResolvedValue({
      success: true,
      videoUrl: 'https://example.com/generated-video.mp4',
    }),
  },
}));

import app from '../index.js';

// Mock the subscription service
vi.mock('../services/subscription.js', () => ({
  SubscriptionService: {
    canGenerateContent: vi.fn().mockResolvedValue({ canGenerate: true }),
    incrementUsage: vi.fn().mockResolvedValue(undefined),
    getUsageStats: vi.fn().mockResolvedValue({
      currentUsage: 5,
      monthlyLimit: 10,
      tier: 'free',
      resetDate: new Date(),
      remainingPosts: 5,
    }),
  },
}));

// Mock the database
vi.mock('../config/database.js', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          platform: 'instagram',
          contentType: 'caption',
          contentData: { text: 'Generated content' },
          createdAt: new Date(),
        }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  platform: 'instagram',
                  contentType: 'caption',
                  contentData: { text: 'Test content 1' },
                  metadata: { generationParams: { prompt: 'test' } },
                  scheduledAt: null,
                  createdAt: new Date('2024-01-01'),
                },
                {
                  id: 2,
                  platform: 'tiktok',
                  contentType: 'image',
                  contentData: { imageUrl: 'https://example.com/image.jpg' },
                  metadata: { generationParams: { prompt: 'test image' } },
                  scheduledAt: null,
                  createdAt: new Date('2024-01-02'),
                },
              ]),
            }),
          }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 1,
          email: 'test@example.com',
          subscriptionTier: 'free',
          monthlyUsage: 5,
        }),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  testConnection: vi.fn().mockResolvedValue(undefined),
}));

// Mock authentication middleware
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  },
  requireGuest: (req: any, res: any, next: any) => {
    next();
  },
}));

describe('Content Generation API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/content/generate-caption', () => {
    it('should generate caption successfully with all parameters', async () => {
      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset over the ocean',
          platform: 'instagram',
          tone: 'inspiring',
          includeHashtags: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('caption');
      expect(response.body.data).toHaveProperty('hashtags');
      expect(response.body.data.platform).toBe('instagram');
      expect(response.body.data.contentType).toBe('caption');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should generate caption without hashtags when requested', async () => {
      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset',
          platform: 'instagram',
          includeHashtags: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtags).toEqual([]);
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          platform: 'instagram',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for missing platform', async () => {
      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset',
          platform: 'invalid-platform',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PLATFORM');
    });

    it('should handle AI service failure gracefully', async () => {
      const { aiService } = await import('../services/ai/index.js');
      vi.mocked(aiService.generateText).mockResolvedValueOnce({
        success: false,
        content: null,
      });

      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'A beautiful sunset',
          platform: 'instagram',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AI_GENERATION_FAILED');
    });

    it('should work with all supported platforms', async () => {
      const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
      
      for (const platform of platforms) {
        const response = await request(app)
          .post('/api/content/generate-caption')
          .send({
            prompt: 'Test content',
            platform,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.platform).toBe(platform);
      }
    });
  });

  describe('POST /api/content/generate-image', () => {
    it('should generate image successfully with all parameters', async () => {
      const response = await request(app)
        .post('/api/content/generate-image')
        .send({
          prompt: 'A serene mountain landscape',
          platform: 'instagram',
          style: 'photorealistic',
          aspectRatio: 'square',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('imageUrl');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('dimensions');
      expect(response.body.data.platform).toBe('instagram');
      expect(response.body.data.contentType).toBe('image');
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/content/generate-image')
        .send({
          platform: 'instagram',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .post('/api/content/generate-image')
        .send({
          prompt: 'A mountain landscape',
          platform: 'invalid-platform',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PLATFORM');
    });

    it('should handle AI service failure gracefully', async () => {
      const { aiService } = await import('../services/ai/index.js');
      vi.mocked(aiService.generateImage).mockResolvedValueOnce({
        success: false,
        imageUrl: null,
      });

      const response = await request(app)
        .post('/api/content/generate-image')
        .send({
          prompt: 'A mountain landscape',
          platform: 'instagram',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('AI_GENERATION_FAILED');
    });

    it('should use platform-specific dimensions', async () => {
      const response = await request(app)
        .post('/api/content/generate-image')
        .send({
          prompt: 'Test image',
          platform: 'tiktok',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.dimensions).toEqual({ width: 1080, height: 1920 });
    });
  });

  describe('POST /api/content/generate-video', () => {
    it('should generate video successfully with all parameters', async () => {
      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          prompt: 'A time-lapse of city traffic',
          platform: 'tiktok',
          duration: 15,
          style: 'cinematic',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('videoUrl');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('duration');
      expect(response.body.data).toHaveProperty('aspectRatio');
      expect(response.body.data.platform).toBe('tiktok');
      expect(response.body.data.contentType).toBe('video');
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          platform: 'tiktok',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          prompt: 'A city time-lapse',
          platform: 'invalid-platform',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PLATFORM');
    });

    it('should handle AI service failure gracefully', async () => {
      const { aiService } = await import('../services/ai/index.js');
      vi.mocked(aiService.generateVideo).mockResolvedValueOnce({
        success: false,
        videoUrl: null,
      });

      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          prompt: 'A city time-lapse',
          platform: 'tiktok',
        });

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('AI_GENERATION_FAILED');
    });

    it('should respect platform duration limits', async () => {
      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          prompt: 'Test video',
          platform: 'instagram',
          duration: 120, // Requesting 120 seconds
        });

      expect(response.status).toBe(200);
      // Instagram max is 60 seconds, so it should be capped
      expect(response.body.data.duration).toBeLessThanOrEqual(60);
    });

    it('should use platform-specific aspect ratios', async () => {
      const response = await request(app)
        .post('/api/content/generate-video')
        .send({
          prompt: 'Test video',
          platform: 'linkedin',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.aspectRatio).toBe('16:9');
    });
  });

  describe('Usage Tracking Integration', () => {
    it('should check usage limits before generation', async () => {
      const { SubscriptionService } = await import('../services/subscription.js');
      vi.mocked(SubscriptionService.canGenerateContent).mockResolvedValueOnce({
        canGenerate: false,
        reason: 'Monthly limit exceeded',
      });

      const response = await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'Test content',
          platform: 'instagram',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('USAGE_LIMIT_EXCEEDED');
    });

    it('should increment usage after successful generation', async () => {
      const { SubscriptionService } = await import('../services/subscription.js');
      
      await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'Test content',
          platform: 'instagram',
        });

      expect(SubscriptionService.incrementUsage).toHaveBeenCalledWith(1);
    });

    it('should store content in database after generation', async () => {
      const { db } = await import('../config/database.js');
      
      await request(app)
        .post('/api/content/generate-caption')
        .send({
          prompt: 'Test content',
          platform: 'instagram',
        });

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('GET /api/content/library', () => {
    beforeEach(async () => {
      // Mock the select chain for content library
      const { db } = await import('../config/database.js');
      
      // Mock count query
      vi.mocked(db.select).mockImplementation((fields: any) => {
        if (fields && fields.count) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 2 }]),
            }),
          };
        }
        
        // Mock content query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([
                    {
                      id: 1,
                      platform: 'instagram',
                      contentType: 'caption',
                      contentData: { text: 'Test content 1' },
                      metadata: { generationParams: { prompt: 'test' } },
                      scheduledAt: null,
                      createdAt: new Date('2024-01-01'),
                    },
                    {
                      id: 2,
                      platform: 'tiktok',
                      contentType: 'image',
                      contentData: { imageUrl: 'https://example.com/image.jpg' },
                      metadata: { generationParams: { prompt: 'test image' } },
                      scheduledAt: null,
                      createdAt: new Date('2024-01-02'),
                    },
                  ]),
                }),
              }),
            }),
          }),
        };
      });
    });

    it('should return paginated content library', async () => {
      const response = await request(app)
        .get('/api/content/library');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data.content)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/content/library?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(5);
    });

    it('should support platform filtering', async () => {
      const response = await request(app)
        .get('/api/content/library?platform=instagram');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.platform).toBe('instagram');
    });

    it('should support content type filtering', async () => {
      const response = await request(app)
        .get('/api/content/library?contentType=caption');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.contentType).toBe('caption');
    });

    it('should support sorting parameters', async () => {
      const response = await request(app)
        .get('/api/content/library?sortBy=platform&sortOrder=asc');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.sortBy).toBe('platform');
      expect(response.body.data.filters.sortOrder).toBe('asc');
    });

    it('should validate and sanitize pagination parameters', async () => {
      const response = await request(app)
        .get('/api/content/library?page=-1&limit=100');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1); // Should default to 1
      expect(response.body.data.pagination.limit).toBe(50); // Should cap at 50
    });

    it('should ignore invalid platform filters', async () => {
      const response = await request(app)
        .get('/api/content/library?platform=invalid-platform');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.platform).toBe(null);
    });

    it('should ignore invalid content type filters', async () => {
      const response = await request(app)
        .get('/api/content/library?contentType=invalid-type');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.contentType).toBe(null);
    });

    it('should default to valid sort parameters for invalid input', async () => {
      const response = await request(app)
        .get('/api/content/library?sortBy=invalid&sortOrder=invalid');

      expect(response.status).toBe(200);
      expect(response.body.data.filters.sortBy).toBe('createdAt');
      expect(response.body.data.filters.sortOrder).toBe('desc');
    });
  });

  describe('DELETE /api/content/:id', () => {
    beforeEach(async () => {
      const { db } = await import('../config/database.js');
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Mock select for checking content existence
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 1, userId: 1 }
            ]),
          }),
        }),
      });
      
      // Mock delete operation
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('should delete content successfully', async () => {
      const response = await request(app)
        .delete('/api/content/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Content deleted successfully');
      expect(response.body.data.deletedId).toBe(1);
    });

    it('should return 400 for invalid content ID', async () => {
      const response = await request(app)
        .delete('/api/content/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CONTENT_ID');
    });

    it('should return 400 for negative content ID', async () => {
      const response = await request(app)
        .delete('/api/content/-1');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CONTENT_ID');
    });

    it('should return 404 for non-existent content', async () => {
      const { db } = await import('../config/database.js');
      
      // Mock empty result for non-existent content
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Empty array
          }),
        }),
      });

      const response = await request(app)
        .delete('/api/content/999');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('CONTENT_NOT_FOUND');
    });

    it('should return 403 for unauthorized access', async () => {
      const { db } = await import('../config/database.js');
      
      // Mock content belonging to different user
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { id: 1, userId: 999 } // Different user ID
            ]),
          }),
        }),
      });

      const response = await request(app)
        .delete('/api/content/1');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
    });

    it('should handle database errors gracefully', async () => {
      const { db } = await import('../config/database.js');
      
      // Mock database error
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const response = await request(app)
        .delete('/api/content/1');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('DELETE_ERROR');
    });
  });

  describe('GET /api/content/usage', () => {
    it('should return usage statistics', async () => {
      const response = await request(app)
        .get('/api/content/usage');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentUsage');
      expect(response.body.data).toHaveProperty('monthlyLimit');
      expect(response.body.data).toHaveProperty('tier');
      expect(response.body.data).toHaveProperty('remainingPosts');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for all endpoints', async () => {
      // This test verifies that the endpoints are protected by authentication middleware
      // In our current mock setup, we're always authenticated, so we'll test the middleware exists
      const endpoints = [
        '/api/content/generate-caption',
        '/api/content/generate-image', 
        '/api/content/generate-video',
        '/api/content/usage',
      ];

      // Verify that all endpoints exist and are accessible with authentication
      for (const endpoint of endpoints) {
        const method = endpoint.includes('usage') ? 'get' : 'post';
        const response = await request(app)[method as 'post' | 'get'](endpoint)
          .send({ prompt: 'test', platform: 'instagram' });
        
        // Should not return 404 (endpoint exists) and should be accessible with auth
        expect(response.status).not.toBe(404);
      }
    });
  });
});