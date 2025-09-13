import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.js';

/**
 * Middleware to check if user can generate content based on their subscription limits
 */
export const checkUsageLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userId = req.user.id;
    const { canGenerate, reason } = await SubscriptionService.canGenerateContent(userId);

    if (!canGenerate) {
      res.status(403).json({
        success: false,
        error: {
          code: 'USAGE_LIMIT_EXCEEDED',
          message: reason || 'Usage limit exceeded',
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking usage limit:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USAGE_CHECK_ERROR',
        message: 'Failed to check usage limits',
      },
    });
  }
};

/**
 * Middleware to increment usage after successful content generation
 */
export const incrementUsage = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    await SubscriptionService.incrementUsage(userId);
    next();
  } catch (error) {
    console.error('Error incrementing usage:', error);
    // Don't fail the request if usage increment fails, just log it
    next();
  }
};