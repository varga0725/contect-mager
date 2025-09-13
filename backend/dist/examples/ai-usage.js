/**
 * Example usage of AI services
 * This file demonstrates how to use the AI services in the application
 */
import { aiService } from '../services/ai/index.js';
async function exampleUsage() {
    console.log('🤖 AI Services Example Usage\n');
    // Example 1: Generate text content for Instagram
    console.log('📝 Generating Instagram caption...');
    try {
        const textResult = await aiService.generateText({
            prompt: 'A beautiful sunset at the beach with friends',
            platform: 'instagram',
            contentType: 'caption',
        });
        if (textResult.success) {
            console.log('✅ Generated caption:', textResult.content);
            console.log('📊 Usage:', textResult.usage);
        }
        else {
            console.log('❌ Error:', textResult.error);
        }
    }
    catch (error) {
        console.log('❌ Exception:', error);
    }
    console.log('\n---\n');
    // Example 2: Generate hashtags
    console.log('🏷️ Generating hashtags...');
    try {
        const hashtagResult = await aiService.generateHashtags('Amazing sunset at the beach with friends enjoying the golden hour', 'instagram');
        if (hashtagResult.success) {
            console.log('✅ Generated hashtags:', hashtagResult.content);
        }
        else {
            console.log('❌ Error:', hashtagResult.error);
        }
    }
    catch (error) {
        console.log('❌ Exception:', error);
    }
    console.log('\n---\n');
    // Example 3: Generate image (mock)
    console.log('🖼️ Generating image...');
    try {
        const imageResult = await aiService.generateImage({
            prompt: 'A serene beach sunset with palm trees',
            platform: 'instagram',
            aspectRatio: 'square',
            style: 'photographic',
        });
        if (imageResult.success) {
            console.log('✅ Generated image URL:', imageResult.imageUrl);
            console.log('📏 Image metadata:', imageResult.metadata);
        }
        else {
            console.log('❌ Error:', imageResult.error);
        }
    }
    catch (error) {
        console.log('❌ Exception:', error);
    }
    console.log('\n---\n');
    // Example 4: Generate video (mock)
    console.log('🎥 Generating video...');
    try {
        const videoResult = await aiService.generateVideo({
            prompt: 'Time-lapse of a beautiful sunset',
            platform: 'tiktok',
            aspectRatio: 'portrait',
            duration: 15,
            style: 'cinematic',
        });
        if (videoResult.success) {
            console.log('✅ Generated video URL:', videoResult.videoUrl);
            console.log('🖼️ Thumbnail URL:', videoResult.thumbnailUrl);
            console.log('📏 Video metadata:', videoResult.metadata);
        }
        else {
            console.log('❌ Error:', videoResult.error);
        }
    }
    catch (error) {
        console.log('❌ Exception:', error);
    }
    console.log('\n---\n');
    // Example 5: Check service status
    console.log('🔍 Checking service status...');
    const status = aiService.getServiceStatus();
    console.log('📊 Service status:', JSON.stringify(status, null, 2));
    console.log('\n---\n');
    // Example 6: Validate content
    console.log('🛡️ Validating content...');
    try {
        const validationResult = await aiService.validateContent('This is a family-friendly post about nature and photography');
        console.log('✅ Content validation:', validationResult);
    }
    catch (error) {
        console.log('❌ Exception:', error);
    }
}
// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    exampleUsage().catch(console.error);
}
export { exampleUsage };
//# sourceMappingURL=ai-usage.js.map