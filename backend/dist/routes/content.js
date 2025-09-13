import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { checkUsageLimit, incrementUsage } from '../middleware/usage.js';
import { aiService } from '../services/ai/index.js';
import { db } from '../config/database.js';
import { posts } from '../models/schema.js';
const router = Router();
/**
 * POST /api/content/generate-caption
 * Generate AI caption for social media platforms
 */
router.post('/generate-caption', requireAuth, checkUsageLimit, async (req, res) => {
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
            tone: tone || 'engaging',
            includeHashtags: includeHashtags !== false,
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
                if (hashtagResponse.success && hashtagResponse.hashtags) {
                    hashtags = hashtagResponse.hashtags;
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
        const [savedPost] = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'caption',
            contentData,
            metadata,
        }).returning();
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
router.post('/generate-image', requireAuth, checkUsageLimit, async (req, res) => {
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
            style: style || 'photorealistic',
            width: dimensions.width,
            height: dimensions.height,
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
                style: style || 'photorealistic',
                aspectRatio: aspectRatio || 'square',
            },
            platformSpecific: {
                dimensions,
                recommendedFormats: getPlatformImageFormats(platform),
            },
        };
        // Store content in database
        const [savedPost] = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'image',
            contentData,
            metadata,
        }).returning();
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
router.post('/generate-video', requireAuth, checkUsageLimit, async (req, res) => {
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
            aspectRatio: videoSpecs.aspectRatio,
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
        const [savedPost] = await db.insert(posts).values({
            userId: req.user.id,
            platform,
            contentType: 'video',
            contentData,
            metadata,
        }).returning();
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