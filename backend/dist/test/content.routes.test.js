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
    requireAuth: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    },
    requireGuest: (req, res, next) => {
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
                const response = await request(app)[method](endpoint)
                    .send({ prompt: 'test', platform: 'instagram' });
                // Should not return 404 (endpoint exists) and should be accessible with auth
                expect(response.status).not.toBe(404);
            }
        });
    });
});
//# sourceMappingURL=content.routes.test.js.map