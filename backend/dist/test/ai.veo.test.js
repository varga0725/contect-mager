import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VeoService } from '../services/ai/veo.js';
describe('VeoService', () => {
    let veoService;
    beforeEach(() => {
        // Mock environment variable
        vi.stubEnv('GOOGLE_AI_API_KEY', 'test-api-key');
        veoService = new VeoService();
    });
    describe('generateVideo', () => {
        it('should generate video with correct platform specifications', async () => {
            const options = {
                prompt: 'dancing in the park',
                platform: 'tiktok',
                aspectRatio: 'portrait',
                duration: 15,
            };
            const result = await veoService.generateVideo(options);
            expect(result.success).toBe(true);
            expect(result.videoUrl).toBeDefined();
            expect(result.thumbnailUrl).toBeDefined();
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.width).toBe(1080);
            expect(result.metadata?.height).toBe(1920);
            expect(result.metadata?.duration).toBe(15);
        });
        it('should handle different platforms with correct specifications', async () => {
            // Test Instagram
            const instagramResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'instagram',
                aspectRatio: 'square',
                duration: 30,
            });
            expect(instagramResult.metadata?.width).toBe(1080);
            expect(instagramResult.metadata?.height).toBe(1080);
            expect(instagramResult.metadata?.duration).toBe(30);
            // Test YouTube
            const youtubeResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'youtube',
                aspectRatio: 'landscape',
                duration: 120,
            });
            expect(youtubeResult.metadata?.width).toBe(1920);
            expect(youtubeResult.metadata?.height).toBe(1080);
            expect(youtubeResult.metadata?.duration).toBe(120);
        });
        it('should respect platform maximum duration limits', async () => {
            // Test TikTok with duration exceeding limit
            const tiktokResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'tiktok',
                duration: 120, // Exceeds TikTok's 60s limit
            });
            expect(tiktokResult.metadata?.duration).toBe(60); // Should be capped at platform limit
            // Test Twitter with duration exceeding limit
            const twitterResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'twitter',
                duration: 200, // Exceeds Twitter's 140s limit
            });
            expect(twitterResult.metadata?.duration).toBe(140); // Should be capped at platform limit
        });
        it('should default to 15 seconds when duration is not specified', async () => {
            const result = await veoService.generateVideo({
                prompt: 'test',
                platform: 'instagram',
            });
            expect(result.metadata?.duration).toBe(15);
        });
        it('should validate prompt requirements', async () => {
            // Test empty prompt
            const emptyPromptResult = await veoService.generateVideo({
                prompt: '',
                platform: 'instagram',
            });
            expect(emptyPromptResult.success).toBe(false);
            expect(emptyPromptResult.error).toBe('Prompt is required');
            // Test prompt too long
            const longPrompt = 'a'.repeat(501);
            const longPromptResult = await veoService.generateVideo({
                prompt: longPrompt,
                platform: 'instagram',
            });
            expect(longPromptResult.success).toBe(false);
            expect(longPromptResult.error).toBe('Prompt is too long (max 500 characters)');
        });
        it('should validate platform requirements', async () => {
            const result = await veoService.generateVideo({
                prompt: 'test',
                platform: 'invalid-platform',
            });
            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid platform specified');
        });
        it('should validate duration requirements', async () => {
            // Test duration too short
            const shortDurationResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'instagram',
                duration: 0,
            });
            expect(shortDurationResult.success).toBe(false);
            expect(shortDurationResult.error).toBe('Duration must be between 1 and 300 seconds');
            // Test duration too long
            const longDurationResult = await veoService.generateVideo({
                prompt: 'test',
                platform: 'instagram',
                duration: 400,
            });
            expect(longDurationResult.success).toBe(false);
            expect(longDurationResult.error).toBe('Duration must be between 1 and 300 seconds');
        });
        it('should handle different video styles', async () => {
            const styles = ['realistic', 'animated', 'cinematic', 'documentary'];
            for (const style of styles) {
                const result = await veoService.generateVideo({
                    prompt: 'test',
                    platform: 'instagram',
                    style,
                });
                expect(result.success).toBe(true);
            }
        });
        it('should return proper metadata structure', async () => {
            const result = await veoService.generateVideo({
                prompt: 'test video',
                platform: 'instagram',
                duration: 20,
            });
            expect(result).toMatchObject({
                success: true,
                videoUrl: expect.any(String),
                thumbnailUrl: expect.any(String),
                metadata: {
                    duration: 20,
                    width: expect.any(Number),
                    height: expect.any(Number),
                    format: 'mp4',
                    size: expect.any(Number),
                    fps: expect.any(Number),
                },
            });
        });
        it('should simulate processing time for videos', async () => {
            const startTime = Date.now();
            await veoService.generateVideo({
                prompt: 'test',
                platform: 'instagram',
            });
            const endTime = Date.now();
            const duration = endTime - startTime;
            // Should take at least 100ms (mock delay for video processing)
            expect(duration).toBeGreaterThanOrEqual(90); // Allow some margin
        });
    });
    describe('getGenerationStatus', () => {
        it('should return completed status for mock implementation', async () => {
            const status = await veoService.getGenerationStatus('test-job-id');
            expect(status).toEqual({
                status: 'completed',
                progress: 100,
            });
        });
    });
    describe('isConfigured', () => {
        it('should return true when API key is configured', () => {
            expect(veoService.isConfigured()).toBe(true);
        });
        it('should return false when API key is not configured', () => {
            vi.stubEnv('GOOGLE_AI_API_KEY', '');
            const unconfiguredService = new VeoService();
            expect(unconfiguredService.isConfigured()).toBe(false);
        });
    });
    describe('platform video specifications', () => {
        it('should return correct specifications for all platforms', async () => {
            const testCases = [
                {
                    platform: 'instagram',
                    aspectRatio: 'square',
                    expected: { width: 1080, height: 1080, maxDuration: 60 }
                },
                {
                    platform: 'tiktok',
                    aspectRatio: 'portrait',
                    expected: { width: 1080, height: 1920, maxDuration: 60 }
                },
                {
                    platform: 'youtube',
                    aspectRatio: 'landscape',
                    expected: { width: 1920, height: 1080, maxDuration: 300 }
                },
                {
                    platform: 'linkedin',
                    aspectRatio: 'landscape',
                    expected: { width: 1920, height: 1080, maxDuration: 180 }
                },
                {
                    platform: 'twitter',
                    aspectRatio: 'landscape',
                    expected: { width: 1280, height: 720, maxDuration: 140 }
                },
            ];
            for (const testCase of testCases) {
                const { platform, aspectRatio, expected } = testCase;
                const result = await veoService.generateVideo({
                    prompt: 'test',
                    platform: platform,
                    aspectRatio: aspectRatio,
                    duration: expected.maxDuration + 10, // Test duration capping
                });
                expect(result.metadata?.width).toBe(expected.width);
                expect(result.metadata?.height).toBe(expected.height);
                expect(result.metadata?.duration).toBe(expected.maxDuration);
            }
        });
    });
    describe('aspect ratio handling', () => {
        it('should default to landscape when aspect ratio is not specified', async () => {
            const result = await veoService.generateVideo({
                prompt: 'test',
                platform: 'youtube',
            });
            expect(result.metadata?.width).toBe(1920);
            expect(result.metadata?.height).toBe(1080);
        });
        it('should handle all aspect ratios for each platform', async () => {
            const aspectRatios = ['square', 'portrait', 'landscape'];
            for (const aspectRatio of aspectRatios) {
                const result = await veoService.generateVideo({
                    prompt: 'test',
                    platform: 'instagram',
                    aspectRatio,
                });
                expect(result.success).toBe(true);
                expect(result.metadata?.width).toBeGreaterThan(0);
                expect(result.metadata?.height).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=ai.veo.test.js.map