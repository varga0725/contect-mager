import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../services/ai/index.js';
// Mock the individual AI services
vi.mock('../services/ai/gemini.js', () => ({
    GeminiService: vi.fn(() => ({
        generateContent: vi.fn(),
        generateHashtags: vi.fn(),
    })),
}));
vi.mock('../services/ai/imagen.js', () => ({
    ImagenService: vi.fn(() => ({
        generateImage: vi.fn(),
        isConfigured: vi.fn(() => true),
    })),
}));
vi.mock('../services/ai/veo.js', () => ({
    VeoService: vi.fn(() => ({
        generateVideo: vi.fn(),
        isConfigured: vi.fn(() => true),
    })),
}));
describe('AIService', () => {
    let aiService;
    let mockGeminiService;
    let mockImagenService;
    let mockVeoService;
    beforeEach(async () => {
        vi.clearAllMocks();
        // Get the mocked constructors
        const { GeminiService } = await import('../services/ai/gemini.js');
        const { ImagenService } = await import('../services/ai/imagen.js');
        const { VeoService } = await import('../services/ai/veo.js');
        // Create mock instances
        mockGeminiService = {
            generateContent: vi.fn(),
            generateHashtags: vi.fn(),
        };
        mockImagenService = {
            generateImage: vi.fn(),
            isConfigured: vi.fn(() => true),
        };
        mockVeoService = {
            generateVideo: vi.fn(),
            isConfigured: vi.fn(() => true),
        };
        // Mock the constructors to return our mock instances
        GeminiService.mockImplementation(() => mockGeminiService);
        ImagenService.mockImplementation(() => mockImagenService);
        VeoService.mockImplementation(() => mockVeoService);
        aiService = new AIService();
    });
    describe('generateText', () => {
        it('should call GeminiService.generateContent with correct options', async () => {
            const mockResponse = { success: true, content: 'Generated text' };
            mockGeminiService.generateContent.mockResolvedValue(mockResponse);
            const options = {
                prompt: 'test prompt',
                platform: 'instagram',
            };
            const result = await aiService.generateText(options);
            expect(mockGeminiService.generateContent).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockResponse);
        });
        it('should retry on failure', async () => {
            const mockError = new Error('API Error');
            const mockSuccess = { success: true, content: 'Generated text' };
            mockGeminiService.generateContent
                .mockRejectedValueOnce(mockError)
                .mockRejectedValueOnce(mockError)
                .mockResolvedValue(mockSuccess);
            const options = {
                prompt: 'test prompt',
                platform: 'instagram',
            };
            const result = await aiService.generateText(options);
            expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(3);
            expect(result).toEqual(mockSuccess);
        });
        it('should fail after maximum retry attempts', async () => {
            const mockError = new Error('Persistent API Error');
            mockGeminiService.generateContent.mockRejectedValue(mockError);
            const aiServiceWithRetries = new AIService({ retryAttempts: 2, retryDelay: 10 });
            const options = {
                prompt: 'test prompt',
                platform: 'instagram',
            };
            await expect(aiServiceWithRetries.generateText(options)).rejects.toThrow('Persistent API Error');
            expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(2);
        });
        it('should timeout long-running operations', async () => {
            mockGeminiService.generateContent.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 2000)));
            const aiServiceWithTimeout = new AIService({ timeout: 100 });
            const options = {
                prompt: 'test prompt',
                platform: 'instagram',
            };
            await expect(aiServiceWithTimeout.generateText(options)).rejects.toThrow('Operation timeout');
        });
    });
    describe('generateHashtags', () => {
        it('should call GeminiService.generateHashtags with correct parameters', async () => {
            const mockResponse = { success: true, content: '#test #hashtags' };
            mockGeminiService.generateHashtags.mockResolvedValue(mockResponse);
            const result = await aiService.generateHashtags('test content', 'instagram');
            expect(mockGeminiService.generateHashtags).toHaveBeenCalledWith('test content', 'instagram');
            expect(result).toEqual(mockResponse);
        });
    });
    describe('generateImage', () => {
        it('should call ImagenService.generateImage with correct options', async () => {
            const mockResponse = { success: true, imageUrl: 'https://example.com/image.jpg' };
            mockImagenService.generateImage.mockResolvedValue(mockResponse);
            const options = {
                prompt: 'test image',
                platform: 'instagram',
            };
            const result = await aiService.generateImage(options);
            expect(mockImagenService.generateImage).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockResponse);
        });
    });
    describe('generateVideo', () => {
        it('should call VeoService.generateVideo with correct options', async () => {
            const mockResponse = { success: true, videoUrl: 'https://example.com/video.mp4' };
            mockVeoService.generateVideo.mockResolvedValue(mockResponse);
            const options = {
                prompt: 'test video',
                platform: 'tiktok',
            };
            const result = await aiService.generateVideo(options);
            expect(mockVeoService.generateVideo).toHaveBeenCalledWith(options);
            expect(result).toEqual(mockResponse);
        });
    });
    describe('getServiceStatus', () => {
        it('should return status of all AI services', () => {
            mockImagenService.isConfigured.mockReturnValue(true);
            mockVeoService.isConfigured.mockReturnValue(false);
            const status = aiService.getServiceStatus();
            expect(status).toEqual({
                gemini: {
                    configured: true,
                    available: true,
                },
                imagen: {
                    configured: true,
                    available: false,
                },
                veo: {
                    configured: false,
                    available: false,
                },
            });
        });
    });
    describe('validateContent', () => {
        it('should validate safe content', async () => {
            mockGeminiService.generateContent.mockResolvedValue({
                success: true,
                content: 'SAFE',
            });
            const result = await aiService.validateContent('This is safe content');
            expect(result).toEqual({ safe: true });
            expect(mockGeminiService.generateContent).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('This is safe content'),
            }));
        });
        it('should validate unsafe content', async () => {
            mockGeminiService.generateContent.mockResolvedValue({
                success: true,
                content: 'UNSAFE: Contains inappropriate language',
            });
            const result = await aiService.validateContent('This is unsafe content');
            expect(result).toEqual({
                safe: false,
                reason: 'CONTAINS INAPPROPRIATE LANGUAGE',
            });
        });
        it('should default to safe when validation fails', async () => {
            mockGeminiService.generateContent.mockRejectedValue(new Error('Validation error'));
            const result = await aiService.validateContent('Some content');
            expect(result).toEqual({ safe: true });
        });
        it('should default to safe when response is unclear', async () => {
            mockGeminiService.generateContent.mockResolvedValue({
                success: true,
                content: 'UNCLEAR RESPONSE',
            });
            const result = await aiService.validateContent('Some content');
            expect(result).toEqual({ safe: true });
        });
        it('should default to safe when API call fails', async () => {
            mockGeminiService.generateContent.mockResolvedValue({
                success: false,
                error: 'API Error',
            });
            const result = await aiService.validateContent('Some content');
            expect(result).toEqual({ safe: true });
        });
    });
    describe('retry mechanism', () => {
        it('should use custom retry configuration', async () => {
            const customConfig = {
                retryAttempts: 5,
                retryDelay: 50,
                timeout: 5000,
            };
            const customAIService = new AIService(customConfig);
            const mockError = new Error('Retry test');
            mockGeminiService.generateContent.mockRejectedValue(mockError);
            const options = {
                prompt: 'test',
                platform: 'instagram',
            };
            await expect(customAIService.generateText(options)).rejects.toThrow('Retry test');
            expect(mockGeminiService.generateContent).toHaveBeenCalledTimes(5);
        });
        it('should apply exponential backoff in retry delays', async () => {
            const mockError = new Error('Retry test');
            mockGeminiService.generateContent.mockRejectedValue(mockError);
            const aiServiceWithRetries = new AIService({ retryAttempts: 3, retryDelay: 10 });
            const startTime = Date.now();
            try {
                await aiServiceWithRetries.generateText({
                    prompt: 'test',
                    platform: 'instagram',
                });
            }
            catch (error) {
                // Expected to fail
            }
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // Should have delays of 10ms * 1 + 10ms * 2 = 30ms minimum
            expect(totalTime).toBeGreaterThanOrEqual(25); // Allow some margin
        });
    });
    describe('error handling', () => {
        it('should handle non-Error objects in retry mechanism', async () => {
            mockGeminiService.generateContent.mockRejectedValue('String error');
            const options = {
                prompt: 'test',
                platform: 'instagram',
            };
            await expect(aiService.generateText(options)).rejects.toThrow('Unknown error');
        });
    });
});
//# sourceMappingURL=ai.service.test.js.map