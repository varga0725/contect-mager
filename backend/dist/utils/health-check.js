import { db, testConnection } from '../config/database.js';
import { users, posts, analytics, subscriptions } from '../models/schema.js';
import { count } from 'drizzle-orm';
export async function checkDatabaseHealth() {
    const status = {
        connected: false,
        tablesExist: false,
        canQuery: false,
        statistics: {
            userCount: 0,
            postCount: 0,
            analyticsCount: 0,
            subscriptionCount: 0,
        },
        errors: [],
    };
    try {
        // Test basic connection
        await testConnection();
        status.connected = true;
        // Test if tables exist and can be queried
        try {
            const [userCount] = await db.select({ count: count() }).from(users);
            const [postCount] = await db.select({ count: count() }).from(posts);
            const [analyticsCount] = await db.select({ count: count() }).from(analytics);
            const [subscriptionCount] = await db.select({ count: count() }).from(subscriptions);
            status.tablesExist = true;
            status.canQuery = true;
            status.statistics = {
                userCount: userCount.count,
                postCount: postCount.count,
                analyticsCount: analyticsCount.count,
                subscriptionCount: subscriptionCount.count,
            };
        }
        catch (error) {
            status.errors.push(`Query failed: ${error.message}`);
            // Check if it's a table not found error
            if (error.message.includes('does not exist')) {
                status.errors.push('Database tables do not exist. Run migrations first.');
            }
        }
    }
    catch (error) {
        status.errors.push(`Connection failed: ${error.message}`);
    }
    return status;
}
export async function validateDatabaseSchema() {
    const errors = [];
    try {
        // Test each table structure by attempting basic operations
        // Test users table
        try {
            await db.select().from(users).limit(1);
        }
        catch (error) {
            errors.push(`Users table issue: ${error.message}`);
        }
        // Test posts table
        try {
            await db.select().from(posts).limit(1);
        }
        catch (error) {
            errors.push(`Posts table issue: ${error.message}`);
        }
        // Test analytics table
        try {
            await db.select().from(analytics).limit(1);
        }
        catch (error) {
            errors.push(`Analytics table issue: ${error.message}`);
        }
        // Test subscriptions table
        try {
            await db.select().from(subscriptions).limit(1);
        }
        catch (error) {
            errors.push(`Subscriptions table issue: ${error.message}`);
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    catch (error) {
        return {
            valid: false,
            errors: [`Schema validation failed: ${error.message}`],
        };
    }
}
export function formatHealthStatus(status) {
    const lines = [
        '🏥 Database Health Check',
        '========================',
        `Connection: ${status.connected ? '✅ Connected' : '❌ Disconnected'}`,
        `Tables: ${status.tablesExist ? '✅ Exist' : '❌ Missing'}`,
        `Queries: ${status.canQuery ? '✅ Working' : '❌ Failed'}`,
        '',
        '📊 Statistics:',
        `  Users: ${status.statistics.userCount}`,
        `  Posts: ${status.statistics.postCount}`,
        `  Analytics: ${status.statistics.analyticsCount}`,
        `  Subscriptions: ${status.statistics.subscriptionCount}`,
    ];
    if (status.errors.length > 0) {
        lines.push('', '❌ Errors:');
        status.errors.forEach(error => lines.push(`  - ${error}`));
    }
    return lines.join('\n');
}
//# sourceMappingURL=health-check.js.map