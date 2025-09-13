import express from 'express';
import { eq, and, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from '../config/database.js';
import { posts } from '../models/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { validationSchemas, handleValidationErrors } from '../middleware/security.js';
const router = express.Router();
// Apply authentication middleware to all routes
router.use(requireAuth);
// POST /api/schedule - Schedule content
router.post('/', validationSchemas.scheduling, handleValidationErrors, async (req, res) => {
    try {
        const { postId, scheduledAt } = req.body;
        const userId = req.user.id;
        // Validate input
        if (!postId || !scheduledAt) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'Post ID and scheduled date are required',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Validate date format
        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DATE',
                    message: 'Invalid date format',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Check if date is in the future
        if (scheduledDate <= new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PAST_DATE',
                    message: 'Scheduled date must be in the future',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Verify the post exists and belongs to the user
        const existingPost = await db
            .select()
            .from(posts)
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .limit(1);
        if (existingPost.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'POST_NOT_FOUND',
                    message: 'Post not found or access denied',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Update the post with scheduled date
        const updatedPost = await db
            .update(posts)
            .set({ scheduledAt: scheduledDate })
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .returning();
        res.json({
            success: true,
            data: updatedPost[0],
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error scheduling content:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to schedule content',
            },
            timestamp: new Date().toISOString(),
        });
    }
});
// GET /api/schedule - Get scheduled content
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate, platform } = req.query;
        let query = db
            .select()
            .from(posts)
            .where(and(eq(posts.userId, userId), isNotNull(posts.scheduledAt)));
        // Add date range filtering if provided
        if (startDate) {
            const start = new Date(startDate);
            if (!isNaN(start.getTime())) {
                query = query.where(and(eq(posts.userId, userId), isNotNull(posts.scheduledAt), gte(posts.scheduledAt, start)));
            }
        }
        if (endDate) {
            const end = new Date(endDate);
            if (!isNaN(end.getTime())) {
                query = query.where(and(eq(posts.userId, userId), isNotNull(posts.scheduledAt), lte(posts.scheduledAt, end)));
            }
        }
        // Add platform filtering if provided
        if (platform) {
            query = query.where(and(eq(posts.userId, userId), isNotNull(posts.scheduledAt), eq(posts.platform, platform)));
        }
        const scheduledPosts = await query.orderBy(posts.scheduledAt);
        res.json({
            success: true,
            data: scheduledPosts,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching scheduled content:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch scheduled content',
            },
            timestamp: new Date().toISOString(),
        });
    }
});
// PUT /api/schedule/:id - Update scheduled content
router.put('/:id', validationSchemas.idParam, handleValidationErrors, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { scheduledAt } = req.body;
        const userId = req.user.id;
        if (isNaN(postId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid post ID',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Validate scheduled date if provided
        let scheduledDate = null;
        if (scheduledAt !== null && scheduledAt !== undefined) {
            scheduledDate = new Date(scheduledAt);
            if (isNaN(scheduledDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_DATE',
                        message: 'Invalid date format',
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            // Check if date is in the future (only if not null)
            if (scheduledDate && scheduledDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PAST_DATE',
                        message: 'Scheduled date must be in the future',
                    },
                    timestamp: new Date().toISOString(),
                });
            }
        }
        // Verify the post exists and belongs to the user
        const existingPost = await db
            .select()
            .from(posts)
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .limit(1);
        if (existingPost.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'POST_NOT_FOUND',
                    message: 'Post not found or access denied',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Update the post
        const updatedPost = await db
            .update(posts)
            .set({ scheduledAt: scheduledDate })
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .returning();
        res.json({
            success: true,
            data: updatedPost[0],
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error updating scheduled content:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update scheduled content',
            },
            timestamp: new Date().toISOString(),
        });
    }
});
// DELETE /api/schedule/:id - Remove from schedule (unschedule)
router.delete('/:id', validationSchemas.idParam, handleValidationErrors, async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.id;
        if (isNaN(postId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid post ID',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Verify the post exists and belongs to the user
        const existingPost = await db
            .select()
            .from(posts)
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .limit(1);
        if (existingPost.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'POST_NOT_FOUND',
                    message: 'Post not found or access denied',
                },
                timestamp: new Date().toISOString(),
            });
        }
        // Remove scheduling (set scheduledAt to null)
        const updatedPost = await db
            .update(posts)
            .set({ scheduledAt: null })
            .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
            .returning();
        res.json({
            success: true,
            data: updatedPost[0],
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error unscheduling content:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to unschedule content',
            },
            timestamp: new Date().toISOString(),
        });
    }
});
export default router;
//# sourceMappingURL=schedule.js.map