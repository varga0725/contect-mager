import * as bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { users } from '../models/schema.js';
import { eq } from 'drizzle-orm';
const SALT_ROUNDS = 12;
export class AuthService {
    /**
     * Hash a password using bcrypt
     */
    static async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }
    /**
     * Verify a password against a hash
     */
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    /**
     * Create a new user with hashed password
     */
    static async createUser(userData) {
        const { email, password } = userData;
        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existingUser.length > 0) {
            throw new Error('User already exists with this email');
        }
        // Hash password
        const passwordHash = await this.hashPassword(password);
        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
            email,
            passwordHash,
            subscriptionTier: 'free',
            monthlyUsage: 0,
            usageResetDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
            .returning({
            id: users.id,
            email: users.email,
            subscriptionTier: users.subscriptionTier,
            monthlyUsage: users.monthlyUsage,
            usageResetDate: users.usageResetDate,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        });
        if (!newUser) {
            throw new Error('Failed to create user');
        }
        return newUser;
    }
    /**
     * Authenticate user with email and password
     */
    static async authenticateUser(email, password) {
        // Find user by email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (!user) {
            return null;
        }
        // Verify password
        const isValidPassword = await this.verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return null;
        }
        // Return user without password hash
        return {
            id: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            monthlyUsage: user.monthlyUsage,
            usageResetDate: user.usageResetDate,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    /**
     * Find user by ID
     */
    static async findUserById(id) {
        const [user] = await db
            .select({
            id: users.id,
            email: users.email,
            subscriptionTier: users.subscriptionTier,
            monthlyUsage: users.monthlyUsage,
            usageResetDate: users.usageResetDate,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return user || null;
    }
}
//# sourceMappingURL=auth.js.map