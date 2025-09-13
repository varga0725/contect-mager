import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { SubscriptionService } from '../services/subscription.js';
import { requireAuth } from '../middleware/auth.js';
import type { SubscriptionTier } from '../types/database.js';

const router = Router();

// Initialize Stripe for webhook handling
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2025-08-27.basil',
});

/**
 * GET /api/subscription/status
 * Get current subscription status and usage
 */
router.get('/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const [subscriptionData, usageStats] = await Promise.all([
      SubscriptionService.getUserSubscription(userId),
      SubscriptionService.getUsageStats(userId),
    ]);

    res.json({
      success: true,
      data: {
        subscription: subscriptionData.subscription,
        usage: usageStats,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_FETCH_ERROR',
        message: 'Failed to fetch subscription status',
      },
    });
  }
});

/**
 * GET /api/subscription/usage
 * Get detailed usage statistics
 */
router.get('/usage', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const usageStats = await SubscriptionService.getUsageStats(userId);

    res.json({
      success: true,
      data: usageStats,
    });
  } catch (error) {
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

/**
 * POST /api/subscription/checkout
 * Create Stripe checkout session for subscription upgrade
 */
router.post('/checkout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tier, successUrl, cancelUrl } = req.body;

    // Validate tier
    if (!tier || !['pro', 'creator'].includes(tier)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIER',
          message: 'Invalid subscription tier. Must be "pro" or "creator"',
        },
      });
      return;
    }

    // Validate URLs
    if (!successUrl || !cancelUrl) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_URLS',
          message: 'Success URL and cancel URL are required',
        },
      });
      return;
    }

    const session = await SubscriptionService.createCheckoutSession(
      userId,
      tier as SubscriptionTier,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHECKOUT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
    });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel current subscription
 */
router.post('/cancel', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await SubscriptionService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel subscription',
      },
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    res.status(400).json({
      success: false,
      error: 'Invalid signature',
    });
    return;
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await SubscriptionService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await SubscriptionService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await SubscriptionService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ success: true, received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook handler failed',
    });
  }
});

export default router;