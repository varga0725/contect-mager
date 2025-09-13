import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users, subscriptions } from '../models/schema.js';
// Initialize Stripe
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
    apiVersion: '2025-08-27.basil',
});
// Subscription tier limits
export const SUBSCRIPTION_LIMITS = {
    free: { monthlyPosts: 10, price: 0 },
    pro: { monthlyPosts: 100, price: 1999 }, // $19.99 in cents
    creator: { monthlyPosts: 500, price: 4999 }, // $49.99 in cents
};
export class SubscriptionService {
    /**
     * Get user's current subscription status
     */
    static async getUserSubscription(userId) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            with: {
                subscription: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            user,
            subscription: user.subscription || undefined,
        };
    }
    /**
     * Check if user can generate content (within usage limits)
     */
    static async canGenerateContent(userId) {
        const { user } = await this.getUserSubscription(userId);
        // Check if usage needs to be reset (monthly cycle)
        const now = new Date();
        const resetDate = new Date(user.usageResetDate);
        if (now >= resetDate) {
            await this.resetMonthlyUsage(userId);
            // Refresh user data after reset
            const updatedUser = await db.query.users.findFirst({
                where: eq(users.id, userId),
            });
            if (updatedUser) {
                user.monthlyUsage = updatedUser.monthlyUsage;
            }
        }
        const limit = SUBSCRIPTION_LIMITS[user.subscriptionTier].monthlyPosts;
        if (user.monthlyUsage >= limit) {
            return {
                canGenerate: false,
                reason: `Monthly limit of ${limit} posts reached. Upgrade your subscription to generate more content.`,
            };
        }
        return { canGenerate: true };
    }
    /**
     * Increment user's monthly usage
     */
    static async incrementUsage(userId) {
        // First get current usage
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });
        if (!user) {
            throw new Error('User not found');
        }
        await db
            .update(users)
            .set({
            monthlyUsage: user.monthlyUsage + 1,
            updatedAt: new Date(),
        })
            .where(eq(users.id, userId));
    }
    /**
     * Reset monthly usage (called at the start of each billing cycle)
     */
    static async resetMonthlyUsage(userId) {
        const nextResetDate = new Date();
        nextResetDate.setMonth(nextResetDate.getMonth() + 1);
        await db
            .update(users)
            .set({
            monthlyUsage: 0,
            usageResetDate: nextResetDate,
            updatedAt: new Date(),
        })
            .where(eq(users.id, userId));
    }
    /**
     * Create Stripe checkout session for subscription upgrade
     */
    static async createCheckoutSession(userId, tier, successUrl, cancelUrl) {
        if (tier === 'free') {
            throw new Error('Cannot create checkout session for free tier');
        }
        const { user } = await this.getUserSubscription(userId);
        const priceAmount = SUBSCRIPTION_LIMITS[tier].price;
        // Create Stripe price object (in a real app, you'd create these in Stripe dashboard)
        const price = await stripe.prices.create({
            unit_amount: priceAmount,
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: {
                name: `ContentMagic ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
            },
        });
        const session = await stripe.checkout.sessions.create({
            customer_email: user.email,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId: userId.toString(),
                tier,
            },
        });
        if (!session.url) {
            throw new Error('Failed to create checkout session');
        }
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    /**
     * Handle successful subscription creation from Stripe webhook
     */
    static async handleSubscriptionCreated(stripeSubscription) {
        const userId = parseInt(stripeSubscription.metadata['userId'] || '0');
        const tier = stripeSubscription.metadata['tier'];
        if (!userId || !tier) {
            throw new Error('Missing metadata in subscription');
        }
        // Create subscription record
        await db.insert(subscriptions).values({
            userId,
            stripeSubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        });
        // Update user's subscription tier
        await db
            .update(users)
            .set({
            subscriptionTier: tier,
            updatedAt: new Date(),
        })
            .where(eq(users.id, userId));
    }
    /**
     * Handle subscription updates from Stripe webhook
     */
    static async handleSubscriptionUpdated(stripeSubscription) {
        await db
            .update(subscriptions)
            .set({
            status: stripeSubscription.status,
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
    }
    /**
     * Handle subscription cancellation from Stripe webhook
     */
    static async handleSubscriptionDeleted(stripeSubscription) {
        // Find the subscription
        const subscription = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubscription.id),
            with: { user: true },
        });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        // Update subscription status
        await db
            .update(subscriptions)
            .set({
            status: 'canceled',
        })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
        // Downgrade user to free tier
        await db
            .update(users)
            .set({
            subscriptionTier: 'free',
            updatedAt: new Date(),
        })
            .where(eq(users.id, subscription.userId));
    }
    /**
     * Get usage statistics for a user
     */
    static async getUsageStats(userId) {
        const { user } = await this.getUserSubscription(userId);
        const tier = user.subscriptionTier;
        const monthlyLimit = SUBSCRIPTION_LIMITS[tier].monthlyPosts;
        return {
            currentUsage: user.monthlyUsage,
            monthlyLimit,
            tier,
            resetDate: user.usageResetDate,
            remainingPosts: Math.max(0, monthlyLimit - user.monthlyUsage),
        };
    }
    /**
     * Cancel subscription
     */
    static async cancelSubscription(userId) {
        const { subscription } = await this.getUserSubscription(userId);
        if (!subscription || !subscription.stripeSubscriptionId) {
            throw new Error('No active subscription found');
        }
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }
}
//# sourceMappingURL=subscription.js.map