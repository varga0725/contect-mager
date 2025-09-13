import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService } from '../services/ai/gemini.js';
// Mock the Google Generative AI module
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn(() => ({
        getGenerativeModel: vi.fn(() => ({
            generateContent: vi.fn(),
        })),
    })),
    HarmCategory: {
        HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
        HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
        HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
    HarmBlockThreshold: {
        BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
    },
}));
describe('GeminiService', () => {
    let geminiService;
    let mockGenerateContent;
    let mockModel;
    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();
        // Create mock for generateContent
        mockGenerateContent = vi.fn();
        // Mock the model instance
        mockModel = {
            generateContent: mockGenerateContent,
        };
        // Mock the GoogleGenerativeAI constructor and getGenerativeModel
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: vi.fn(() => mockModel),
        }));
        geminiService = new GeminiService();
        // Override the model property to use our mock
        geminiService.model = mockModel;
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('generateContent', () => {
        it('should generate content successfully for Instagram', async () => {
            // Mock successful response
            const mockResponse = {
                text: () => 'Amazing sunset at the beach! 🌅 #sunset #beach #nature #photography #beautiful',
                usageMetadata: {
                    promptTokenCount: 50,
                    candidatesTokenCount: 25,
                    totalTokenCount: 75,
                },
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            const options = {
                prompt: 'sunset at the beach',
                platform: 'instagram',
                contentType: 'caption',
            };
            const result = await geminiService.generateContent(options);
            expect(result.success).toBe(true);
            expect(result.content).toBe('Amazing sunset at the beach! 🌅 #sunset #beach #nature #photography #beautiful');
            expect(result.usage).toEqual({
                promptTokens: 50,
                completionTokens: 25,
                totalTokens: 75,
            });
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('sunset at the beach'));
        });
        it('should generate content for different platforms with appropriate prompts', async () => {
            const mockResponse = {
                text: () => 'Platform-specific content',
                usageMetadata: null,
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            // Test TikTok
            await geminiService.generateContent({
                prompt: 'dance video',
                platform: 'tiktok',
            });
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('tiktok'));
            // Test LinkedIn
            await geminiService.generateContent({
                prompt: 'business insights',
                platform: 'linkedin',
            });
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('linkedin'));
        });
        it('should handle API errors gracefully', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API rate limit exceeded'));
            const options = {
                prompt: 'test content',
                platform: 'instagram',
            };
            const result = await geminiService.generateContent(options);
            expect(result.success).toBe(false);
            expect(result.error).toBe('API rate limit exceeded');
            expect(result.content).toBeUndefined();
        });
        it('should handle empty response', async () => {
            const mockResponse = {
                text: () => '',
                usageMetadata: null,
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            const options = {
                prompt: 'test content',
                platform: 'instagram',
            };
            const result = await geminiService.generateContent(options);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Empty response from Gemini API');
        });
        it('should handle null response', async () => {
            mockGenerateContent.mockResolvedValue({
                response: null,
            });
            const options = {
                prompt: 'test content',
                platform: 'instagram',
            };
            const result = await geminiService.generateContent(options);
            expect(result.success).toBe(false);
            expect(result.error).toBe('No response received from Gemini API');
        });
        it('should respect maxLength parameter', async () => {
            const mockResponse = {
                text: () => 'Short content',
                usageMetadata: null,
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            const options = {
                prompt: 'test content',
                platform: 'twitter',
                maxLength: 100,
            };
            await geminiService.generateContent(options);
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('100 characters'));
        });
    });
    describe('generateHashtags', () => {
        it('should generate hashtags for content', async () => {
            const mockResponse = {
                text: () => '#sunset #beach #nature #photography #beautiful',
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            const result = await geminiService.generateHashtags('Beautiful sunset at the beach', 'instagram');
            expect(result.success).toBe(true);
            expect(result.content).toBe('#sunset #beach #nature #photography #beautiful');
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('Beautiful sunset at the beach'));
        });
        it('should handle hashtag generation errors', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Network error'));
            const result = await geminiService.generateHashtags('Test content', 'instagram');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
        });
    });
    describe('platform-specific prompts', () => {
        it('should include platform-specific requirements in prompts', async () => {
            const mockResponse = {
                text: () => 'Generated content',
                usageMetadata: null,
            };
            mockGenerateContent.mockResolvedValue({
                response: mockResponse,
            });
            // Test each platform
            const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
            for (const platform of platforms) {
                await geminiService.generateContent({
                    prompt: 'test',
                    platform,
                });
                const lastCall = mockGenerateContent.mock.calls[mockGenerateContent.mock.calls.length - 1];
                const prompt = lastCall[0];
                expect(prompt).toContain(platform);
                // Check for platform-specific characteristics
                switch (platform) {
                    case 'instagram':
                        expect(prompt).toContain('2200 characters');
                        expect(prompt).toContain('5-10 relevant hashtags');
                        break;
                    case 'tiktok':
                        expect(prompt).toContain('150 characters');
                        expect(prompt).toContain('trendy and energetic');
                        break;
                    case 'twitter':
                        expect(prompt).toContain('280 characters');
                        expect(prompt).toContain('1-3 relevant hashtags');
                        break;
                    case 'linkedin':
                        expect(prompt).toContain('professional');
                        break;
                    case 'youtube':
                        expect(prompt).toContain('5000 characters');
                        break;
                }
            }
        });
    });
});
//# sourceMappingURL=ai.gemini.test.js.map