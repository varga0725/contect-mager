import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { db } from '../config/database.js';
import { users, posts } from '../models/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
describe('Schedule Routes', () => {
    let testUser;
    let testPost;
    let agent;
    beforeEach(async () => {
        // Create test user
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        const [user] = await db.insert(users).values({
            email: 'test@example.com',
            passwordHash: hashedPassword,
            subscriptionTier: 'free',
            monthlyUsage: 0,
        }).returning();
        testUser = user;
        // Create test post
        const [post] = await db.insert(posts).values({
            userId: testUser.id,
            platform: 'instagram',
            contentType: 'caption',
            contentData: { text: 'Test caption', hashtags: ['#test'] },
            metadata: {},
        }).returning();
        testPost = post;
        // Create authenticated agent
        agent = request.agent(app);
        await agent
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'testpassword' });
    });
    afterEach(async () => {
        // Clean up test data
        await db.delete(posts).where(eq(posts.userId, testUser.id));
        await db.delete(users).where(eq(users.id, testUser.id));
    });
    describe('POST /api/schedule', () => {
        it('should schedule content successfully', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const response = await agent
                .post('/api/schedule')
                .send({
                postId: testPost.id,
                scheduledAt: futureDate.toISOString(),
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.scheduledAt).toBeDefined();
            expect(new Date(response.body.data.scheduledAt)).toEqual(futureDate);
        });
        it('should reject scheduling for past dates', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const response = await agent
                .post('/api/schedule')
                .send({
                postId: testPost.id,
                scheduledAt: pastDate.toISOString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('PAST_DATE');
        });
        it('should reject invalid date format', async () => {
            const response = await agent
                .post('/api/schedule')
                .send({
                postId: testPost.id,
                scheduledAt: 'invalid-date',
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_DATE');
        });
        it('should reject missing fields', async () => {
            const response = await agent
                .post('/api/schedule')
                .send({
                postId: testPost.id,
            });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_FIELDS');
        });
        it('should reject scheduling non-existent post', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const response = await agent
                .post('/api/schedule')
                .send({
                postId: 99999,
                scheduledAt: futureDate.toISOString(),
            });
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('POST_NOT_FOUND');
        });
        it('should require authentication', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const response = await request(app)
                .post('/api/schedule')
                .send({
                postId: testPost.id,
                scheduledAt: futureDate.toISOString(),
            });
            expect(response.status).toBe(401);
        });
    });
    describe('GET /api/schedule', () => {
        beforeEach(async () => {
            // Schedule the test post
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            await db.update(posts)
                .set({ scheduledAt: futureDate })
                .where(eq(posts.id, testPost.id));
        });
        it('should get scheduled content', async () => {
            const response = await agent.get('/api/schedule');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(testPost.id);
            expect(response.body.data[0].scheduledAt).toBeDefined();
        });
        it('should filter by platform', async () => {
            const response = await agent
                .get('/api/schedule')
                .query({ platform: 'instagram' });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });
        it('should filter by date range', async () => {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            const response = await agent
                .get('/api/schedule')
                .query({
                startDate: today.toISOString(),
                endDate: dayAfter.toISOString(),
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });
        it('should require authentication', async () => {
            const response = await request(app).get('/api/schedule');
            expect(response.status).toBe(401);
        });
    });
    describe('PUT /api/schedule/:id', () => {
        beforeEach(async () => {
            // Schedule the test post
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            await db.update(posts)
                .set({ scheduledAt: futureDate })
                .where(eq(posts.id, testPost.id));
        });
        it('should update scheduled content', async () => {
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + 2);
            const response = await agent
                .put(`/api/schedule/${testPost.id}`)
                .send({
                scheduledAt: newDate.toISOString(),
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(new Date(response.body.data.scheduledAt)).toEqual(newDate);
        });
        it('should allow unscheduling by setting null', async () => {
            const response = await agent
                .put(`/api/schedule/${testPost.id}`)
                .send({
                scheduledAt: null,
            });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.scheduledAt).toBeNull();
        });
        it('should reject invalid post ID', async () => {
            const response = await agent
                .put('/api/schedule/invalid')
                .send({
                scheduledAt: new Date().toISOString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_ID');
        });
        it('should reject past dates', async () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const response = await agent
                .put(`/api/schedule/${testPost.id}`)
                .send({
                scheduledAt: pastDate.toISOString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('PAST_DATE');
        });
        it('should require authentication', async () => {
            const response = await request(app)
                .put(`/api/schedule/${testPost.id}`)
                .send({
                scheduledAt: new Date().toISOString(),
            });
            expect(response.status).toBe(401);
        });
    });
    describe('DELETE /api/schedule/:id', () => {
        beforeEach(async () => {
            // Schedule the test post
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            await db.update(posts)
                .set({ scheduledAt: futureDate })
                .where(eq(posts.id, testPost.id));
        });
        it('should unschedule content', async () => {
            const response = await agent.delete(`/api/schedule/${testPost.id}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.scheduledAt).toBeNull();
        });
        it('should reject invalid post ID', async () => {
            const response = await agent.delete('/api/schedule/invalid');
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_ID');
        });
        it('should reject non-existent post', async () => {
            const response = await agent.delete('/api/schedule/99999');
            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe('POST_NOT_FOUND');
        });
        it('should require authentication', async () => {
            const response = await request(app).delete(`/api/schedule/${testPost.id}`);
            expect(response.status).toBe(401);
        });
    });
});
//# sourceMappingURL=schedule.routes.test.js.map