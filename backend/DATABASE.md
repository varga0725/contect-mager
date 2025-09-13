# Database Setup Guide

This document explains how to set up and manage the PostgreSQL database for the ContentMagic backend.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database. We recommend using [Neon](https://neon.tech) for serverless PostgreSQL.
2. **Environment Variables**: Set up your `.env` file with the database connection string.

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in your `.env` file:
   ```bash
   # For Neon (recommended)
   DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   # For local PostgreSQL
   DATABASE_URL=postgresql://username:password@localhost:5432/contentmagic
   ```

## Database Schema

The database includes four main tables:

- **users**: User accounts and subscription information
- **posts**: Generated content (captions, images, videos)
- **analytics**: Performance metrics for posts
- **subscriptions**: Stripe subscription details

## Available Commands

### Generate Migration
Create a new migration file based on schema changes:
```bash
npm run db:generate
```

### Apply Migrations
Apply pending migrations to the database:
```bash
npm run db:migrate
```

### Push Schema (Development)
Push schema changes directly to the database (for development):
```bash
npm run db:push
```

### Database Studio
Open Drizzle Studio to view and edit data:
```bash
npm run db:studio
```

### Initialize Database
Set up the database with test data:
```bash
npm run db:init
```

### Test Database Connection
Verify database setup and connection:
```bash
npm run db:test
```

## Setup Process

1. **Set up your database** (Neon or local PostgreSQL)
2. **Configure environment variables** in `.env`
3. **Generate and apply migrations**:
   ```bash
   npm run db:generate
   npm run db:push  # or db:migrate for production
   ```
4. **Test the setup**:
   ```bash
   npm run db:test
   ```
5. **Initialize with test data** (optional):
   ```bash
   npm run db:init
   ```

## Database Utilities

The codebase includes several utility classes for database operations:

- `UserRepository`: User CRUD operations and usage tracking
- `PostRepository`: Content management and scheduling
- `AnalyticsRepository`: Metrics collection and retrieval
- `SubscriptionRepository`: Subscription management

## Health Checks

The server includes database health check endpoints:

- `GET /api/health`: Basic server health
- `GET /api/health/database`: Detailed database status

## Error Handling

All database operations use the `DatabaseError` class for consistent error handling. The connection includes:

- Automatic reconnection on connection loss
- Graceful shutdown handling
- Connection pooling with configurable limits
- Timeout management

## Migration Management

Migrations are managed using Drizzle Kit:

1. **Schema Changes**: Modify files in `src/models/schema.ts`
2. **Generate Migration**: Run `npm run db:generate`
3. **Review Migration**: Check the generated SQL in `drizzle/` folder
4. **Apply Migration**: Run `npm run db:migrate` (production) or `npm run db:push` (development)

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is correct
- Check network connectivity to database
- Ensure database server is running

### Migration Issues
- Check if migrations are up to date: `npm run db:generate`
- Verify schema syntax in `src/models/schema.ts`
- Check database permissions

### Performance Issues
- Monitor connection pool usage
- Check query performance in logs
- Consider adding database indexes for frequently queried columns

## Production Considerations

1. **Connection Pooling**: Configure appropriate pool size for your load
2. **SSL**: Always use SSL in production (included in Neon URLs)
3. **Backups**: Set up regular database backups
4. **Monitoring**: Monitor database performance and connection health
5. **Migrations**: Use `db:migrate` instead of `db:push` in production