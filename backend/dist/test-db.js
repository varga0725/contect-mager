#!/usr/bin/env tsx
import { checkDatabaseHealth, formatHealthStatus } from './utils/health-check.js';
import { closeConnection } from './config/database.js';
async function testDatabase() {
    try {
        console.log('🧪 Testing database setup...\n');
        const healthStatus = await checkDatabaseHealth();
        console.log(formatHealthStatus(healthStatus));
        if (healthStatus.connected && healthStatus.canQuery) {
            console.log('\n🎉 Database setup is working correctly!');
        }
        else {
            console.log('\n❌ Database setup has issues. Check the errors above.');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
    finally {
        await closeConnection();
    }
}
testDatabase();
//# sourceMappingURL=test-db.js.map