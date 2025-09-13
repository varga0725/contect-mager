import dotenv from 'dotenv';
import { vi } from 'vitest';
// Load test environment variables
dotenv.config({ path: '.env.test' });
// Set test environment
process.env['NODE_ENV'] = 'test';
// Mock database connection for tests that don't need real DB
vi.mock('../config/database.ts', async () => {
    const actual = await vi.importActual('../config/database.ts');
    return {
        ...actual,
        testConnection: vi.fn().mockResolvedValue(true),
        closeConnection: vi.fn().mockResolvedValue(undefined),
    };
});
// Global test setup
beforeEach(() => {
    vi.clearAllMocks();
});
// Suppress console logs in tests unless explicitly needed
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
};
//# sourceMappingURL=setup.js.map