#!/usr/bin/env tsx
import { testConnection, closeConnection } from '../config/database.js';
import { UserRepository } from '../utils/database.js';
import bcrypt from 'bcrypt';
async function initializeDatabase() {
    try {
        console.log('🚀 Initializing database...');
        // Test connection
        await testConnection();
        // Check if we can create a test user (this will validate our schema)
        console.log('📝 Testing database operations...');
        const testEmail = 'test@example.com';
        // Check if test user already exists
        const existingUser = await UserRepository.findByEmail(testEmail);
        if (!existingUser) {
            // Create a test user
            const hashedPassword = await bcrypt.hash('testpassword123', 10);
            const testUser = await UserRepository.create({
                email: testEmail,
                passwordHash: hashedPassword,
                subscriptionTier: 'free',
                monthlyUsage: 0,
                usageResetDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log('✅ Test user created:', { id: testUser.id, email: testUser.email });
        }
        else {
            console.log('✅ Test user already exists:', { id: existingUser.id, email: existingUser.email });
        }
        console.log('🎉 Database initialization completed successfully!');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
    finally {
        await closeConnection();
    }
}
// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeDatabase();
}
export { initializeDatabase };
//# sourceMappingURL=init-db.js.map