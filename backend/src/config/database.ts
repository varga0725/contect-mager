import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema.js';

// Database connection configuration
const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close connections after 20 seconds of inactivity
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Database connection utilities
export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new DatabaseError('Failed to connect to database', error as Error);
  }
}

export async function closeConnection(): Promise<void> {
  try {
    await client.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw new DatabaseError('Failed to close database connection', error as Error);
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connection...');
  await closeConnection();
  process.exit(0);
});