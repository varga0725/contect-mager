import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkUsageLimit, incrementUsage } from '../middleware/usage.js';
import { aiService } from '../services/ai/index.js';
import { AnalyticsService } from '../services/analytics.js';
import { db } from '../config/database.js';
import { posts } from '../models/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { rateLimiters, validationSchemas, handleValidationErrors } from '../middleware/security.js';
import { validateExternalApiKeys } from '../utils/api-keys.js';
const router = Router();
/**
 * POST /api/content/generate-caption
 * Generate AI caption for social media platforms
 */
router.post('/generate-caption', rateLimiters.aiGeneration, requireAuth, checkUsageLimit, validateExternalApiKeys(['google']), validationSchemas.contentGeneration, handleValidationErrors, async (req, res) => {
    try {
        const { prompt, platform, tone, includeHashtags } = req.body;
        // Validate input
        if (!prompt || !platform) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Prompt and platform are required',
                },
            });
            return;
        }
        // Validate platform
        const validPlatforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
        if (!validPlatforms.includes(platform)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLATFORM',
                    message: 'Platform must be one of: ' + validPlatforms.join(', '),
                },
            });
            return;
        }
        // Generate caption using AI service
        const captionResponse = await aiService.generateText({
            prompt,
            platform,
            contentType: 'caption',
            maxLength: getPlatformCharacterLimit(platform),
        });
        if (!captionResponse.success || !captionResponse.content) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'AI_GENERATION_FAILED',
                    message: 'Failed to generate caption',
                },
            });
            return;
        }
        // Generate hashtags if requested
        let hashtags = [];
        if (includeHashtags !== false) {
            try {
                const hashtagResponse = await aiService.generateHashtags(captionResponse.content, platform);
                if (hashtagResponse.success && hashtagResponse.content) {
                    // Parse hashtags from the response content
                    hashtags = hashtagResponse.content
                        .split(/\s+/)
                        .filter(tag => tag.startsWith('#'))
                        .slice(0, 10); // Limit to 10 hashtags
                }
            }
            catch (error) {
                console.warn('Failed to generate hashtags:', error);
                // Continue without hashtags if generation fails
            }
        }
        // Prepare content data
        const contentData = {
            text: captionResponse.content,
            hashtags,
        };
        const metadata = {
            generationParams: {
                prompt,
                tone: tone || 'engaging',
                includeHashtags: includeHashtags !== false,
            },
            platformSpecific: {
                characterLimit: getPlatformCharacterLimit(platform),
            },
        };
        // Store content in database
        const savedPosts = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'caption',
            contentData,
            metadata,
        }).returning();
        const savedPost = savedPosts[0];
        // Initialize analytics for the new post
        await AnalyticsService.initializePostAnalytics(savedPost.id);
        // Increment usage after successful generation
        await incrementUsage(req, res, () => { });
        res.json({
            success: true,
            data: {
                id: savedPost.id,
                caption: captionResponse.content,
                hashtags,
                platform,
                contentType: 'caption',
                createdAt: savedPost.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Error generating caption:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_ERROR',
                message: 'Failed to generate caption',
            },
        });
    }
});
/**
 * POST /api/content/generate-image
 * Generate AI image for social media platforms
 */
router.post('/generate-image', rateLimiters.aiGeneration, requireAuth, checkUsageLimit, validateExternalApiKeys(['google']), validationSchemas.contentGeneration, handleValidationErrors, async (req, res) => {
    try {
        const { prompt, platform, style, aspectRatio } = req.body;
        // Validate input
        if (!prompt || !platform) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Prompt and platform are required',
                },
            });
            return;
        }
        // Validate platform
        const validPlatforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
        if (!validPlatforms.includes(platform)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLATFORM',
                    message: 'Platform must be one of: ' + validPlatforms.join(', '),
                },
            });
            return;
        }
        // Get platform-specific image dimensions
        const dimensions = getPlatformImageDimensions(platform, aspectRatio);
        // Generate image using AI service
        const imageResponse = await aiService.generateImage({
            prompt,
            platform,
            style: style || 'photographic',
            aspectRatio: aspectRatio || 'square',
            quality: 'hd',
        });
        if (!imageResponse.success || !imageResponse.imageUrl) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'AI_GENERATION_FAILED',
                    message: 'Failed to generate image',
                },
            });
            return;
        }
        // Prepare content data
        const contentData = {
            imageUrl: imageResponse.imageUrl,
            description: prompt,
        };
        const metadata = {
            generationParams: {
                prompt,
                style: style || 'photographic',
                aspectRatio: aspectRatio || 'square',
            },
            platformSpecific: {
                dimensions,
                recommendedFormats: getPlatformImageFormats(platform),
            },
        };
        // Store content in database
        const savedPosts = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'image',
            contentData,
            metadata,
        }).returning();
        const savedPost = savedPosts[0];
        // Initialize analytics for the new post
        await AnalyticsService.initializePostAnalytics(savedPost.id);
        // Increment usage after successful generation
        await incrementUsage(req, res, () => { });
        res.json({
            success: true,
            data: {
                id: savedPost.id,
                imageUrl: imageResponse.imageUrl,
                description: prompt,
                platform,
                contentType: 'image',
                dimensions,
                createdAt: savedPost.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_ERROR',
                message: 'Failed to generate image',
            },
        });
    }
});
/**
 * POST /api/content/generate-video
 * Generate AI video for social media platforms
 */
router.post('/generate-video', rateLimiters.aiGeneration, requireAuth, checkUsageLimit, validateExternalApiKeys(['google']), validationSchemas.contentGeneration, handleValidationErrors, async (req, res) => {
    try {
        const { prompt, platform, duration, style } = req.body;
        // Validate input
        if (!prompt || !platform) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PARAMETERS',
                    message: 'Prompt and platform are required',
                },
            });
            return;
        }
        // Validate platform
        const validPlatforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
        if (!validPlatforms.includes(platform)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLATFORM',
                    message: 'Platform must be one of: ' + validPlatforms.join(', '),
                },
            });
            return;
        }
        // Get platform-specific video specifications
        const videoSpecs = getPlatformVideoSpecs(platform, duration);
        // Generate video using AI service
        const videoResponse = await aiService.generateVideo({
            prompt,
            platform,
            duration: videoSpecs.duration,
            style: style || 'cinematic',
            aspectRatio: videoSpecs.aspectRatio === '9:16' ? 'portrait' :
                videoSpecs.aspectRatio === '16:9' ? 'landscape' : 'square',
            quality: 'hd',
        });
        if (!videoResponse.success || !videoResponse.videoUrl) {
            res.status(500).json({
                success: false,
                error: {
                    code: 'AI_GENERATION_FAILED',
                    message: 'Failed to generate video',
                },
            });
            return;
        }
        // Prepare content data
        const contentData = {
            videoUrl: videoResponse.videoUrl,
            description: prompt,
        };
        const metadata = {
            generationParams: {
                prompt,
                duration: videoSpecs.duration,
                style: style || 'cinematic',
            },
            platformSpecific: {
                aspectRatio: videoSpecs.aspectRatio,
                maxDuration: videoSpecs.maxDuration,
                recommendedFormats: getPlatformVideoFormats(platform),
            },
        };
        // Store content in database
        const savedPosts = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'video',
            contentData,
            metadata,
        }).returning();
        const savedPost = savedPosts[0];
        // Initialize analytics for the new post
        await AnalyticsService.initializePostAnalytics(savedPost.id);
        // Increment usage after successful generation
        await incrementUsage(req, res, () => { });
        res.json({
            success: true,
            data: {
                id: savedPost.id,
                videoUrl: videoResponse.videoUrl,
                description: prompt,
                platform,
                contentType: 'video',
                duration: videoSpecs.duration,
                aspectRatio: videoSpecs.aspectRatio,
                createdAt: savedPost.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Error generating video:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_ERROR',
                message: 'Failed to generate video',
            },
        });
    }
});
/**
 * GET /api/content/library
 * Get user's content library with pagination and filtering
 */
router.get('/library', requireAuth, validationSchemas.pagination, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = '1', limit = '10', platform, contentType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;
        // Validate sort parameters
        const validSortFields = ['createdAt', 'platform', 'contentType'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const order = sortOrder === 'asc' ? 'asc' : 'desc';
        // Build filter conditions
        const conditions = [eq(posts.userId, userId)];
        if (platform && typeof platform === 'string') {
            const validPlatforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
            if (validPlatforms.includes(platform)) {
                conditions.push(eq(posts.platform, platform));
            }
        }
        if (contentType && typeof contentType === 'string') {
            const validContentTypes = ['caption', 'image', 'video'];
            if (validContentTypes.includes(contentType)) {
                conditions.push(eq(posts.contentType, contentType));
            }
        }
        // Get total count for pagination
        const [totalResult] = await db
            .select({ count: count() })
            .from(posts)
            .where(and(...conditions));
        const total = totalResult?.count || 0;
        // Get paginated content
        let query = db
            .select({
            id: posts.id,
            platform: posts.platform,
            contentType: posts.contentType,
            contentData: posts.contentData,
            metadata: posts.metadata,
            scheduledAt: posts.scheduledAt,
            createdAt: posts.createdAt,
        })
            .from(posts)
            .where(and(...conditions))
            .limit(limitNum)
            .offset(offset);
        // Apply sorting
        if (sortField === 'createdAt') {
            query = order === 'desc' ? query.orderBy(desc(posts.createdAt)) : query.orderBy(posts.createdAt);
        }
        else if (sortField === 'platform') {
            query = order === 'desc' ? query.orderBy(desc(posts.platform)) : query.orderBy(posts.platform);
        }
        else if (sortField === 'contentType') {
            query = order === 'desc' ? query.orderBy(desc(posts.contentType)) : query.orderBy(posts.contentType);
        }
        const content = await query;
        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        res.json({
            success: true,
            data: {
                content,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNextPage,
                    hasPrevPage,
                },
                filters: {
                    platform: (platform && typeof platform === 'string' &&
                        ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'].includes(platform))
                        ? platform : null,
                    contentType: (contentType && typeof contentType === 'string' &&
                        ['caption', 'image', 'video'].includes(contentType))
                        ? contentType : null,
                    sortBy: sortField,
                    sortOrder: order,
                },
            },
        });
    }
    catch (error) {
        console.error('Error fetching content library:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LIBRARY_FETCH_ERROR',
                message: 'Failed to fetch content library',
            },
        });
    }
});
/**
 * DELETE /api/content/:id
 * Delete a specific content item
 */
router.delete('/:id', requireAuth, validationSchemas.idParam, handleValidationErrors, async (req, res) => {
    try {
        const userId = req.user.id;
        const contentId = parseInt(req.params.id, 10);
        // Validate content ID
        if (isNaN(contentId) || contentId <= 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CONTENT_ID',
                    message: 'Invalid content ID provided',
                },
            });
            return;
        }
        // Check if content exists and belongs to user
        const existingContent = await db
            .select({ id: posts.id, userId: posts.userId })
            .from(posts)
            .where(eq(posts.id, contentId))
            .limit(1);
        if (existingContent.length === 0) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CONTENT_NOT_FOUND',
                    message: 'Content not found',
                },
            });
            return;
        }
        if (existingContent[0].userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED_ACCESS',
                    message: 'You do not have permission to delete this content',
                },
            });
            return;
        }
        // Delete the content
        await db.delete(posts).where(eq(posts.id, contentId));
        res.json({
            success: true,
            data: {
                message: 'Content deleted successfully',
                deletedId: contentId,
            },
        });
    }
    catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: 'Failed to delete content',
            },
        });
    }
});
/**
 * GET /api/content/usage
 * Get current usage statistics
 */
router.get('/usage', requireAuth, async (req, res) => {
    try {
        const { SubscriptionService } = await import('../services/subscription.js');
        const userId = req.user.id;
        const usageStats = await SubscriptionService.getUsageStats(userId);
        res.json({
            success: true,
            data: usageStats,
        });
    }
    catch (error) {
        console.error('Error fetching usage stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_FETCH_ERROR',
                message: 'Failed to fetch usage statistics',
            },
        });
    }
});
// Helper functions for platform-specific configurations
function getPlatformCharacterLimit(platform) {
    const limits = {
        instagram: 2200,
        tiktok: 4000,
        youtube: 5000,
        linkedin: 3000,
        twitter: 280,
    };
    return limits[platform];
}
function getPlatformImageDimensions(platform, aspectRatio) {
    const defaultDimensions = {
        instagram: { width: 1080, height: 1080 }, // Square
        tiktok: { width: 1080, height: 1920 }, // Vertical
        youtube: { width: 1280, height: 720 }, // Horizontal
        linkedin: { width: 1200, height: 627 }, // Horizontal
        twitter: { width: 1200, height: 675 }, // Horizontal
    };
    if (aspectRatio === 'vertical') {
        return { width: 1080, height: 1920 };
    }
    else if (aspectRatio === 'horizontal') {
        return { width: 1280, height: 720 };
    }
    return defaultDimensions[platform];
}
function getPlatformImageFormats(platform) {
    const formats = {
        instagram: ['JPG', 'PNG'],
        tiktok: ['JPG', 'PNG'],
        youtube: ['JPG', 'PNG', 'GIF'],
        linkedin: ['JPG', 'PNG'],
        twitter: ['JPG', 'PNG', 'GIF'],
    };
    return formats[platform];
}
function getPlatformVideoSpecs(platform, requestedDuration) {
    const specs = {
        instagram: { maxDuration: 60, aspectRatio: '9:16' },
        tiktok: { maxDuration: 180, aspectRatio: '9:16' },
        youtube: { maxDuration: 60, aspectRatio: '9:16' },
        linkedin: { maxDuration: 600, aspectRatio: '16:9' },
        twitter: { maxDuration: 140, aspectRatio: '16:9' },
    };
    const platformSpec = specs[platform];
    const duration = requestedDuration
        ? Math.min(requestedDuration, platformSpec.maxDuration)
        : Math.min(30, platformSpec.maxDuration); // Default to 30 seconds
    return {
        duration,
        maxDuration: platformSpec.maxDuration,
        aspectRatio: platformSpec.aspectRatio,
    };
}
function getPlatformVideoFormats(platform) {
    const formats = {
        instagram: ['MP4', 'MOV'],
        tiktok: ['MP4', 'MOV'],
        youtube: ['MP4', 'MOV', 'AVI'],
        linkedin: ['MP4', 'MOV'],
        twitter: ['MP4', 'MOV'],
    };
    return formats[platform];
}
export default router;
//# sourceMappingURL=content.js.map