# AI Services

This directory contains the AI service integrations for ContentMagic, providing text, image, and video generation capabilities using Google's AI services.

## Overview

The AI services are organized into several components:

- **GeminiService**: Text generation using Google Gemini 1.5 Pro
- **ImagenService**: Image generation using Google Imagen 3 (mock implementation)
- **VeoService**: Video generation using Google Veo (mock implementation)
- **AIService**: Main orchestrator that provides unified access to all AI services

## Configuration

### Environment Variables

```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Safety Settings

All AI services implement Google's safety settings to filter inappropriate content:

- Harassment: BLOCK_MEDIUM_AND_ABOVE
- Hate Speech: BLOCK_MEDIUM_AND_ABOVE
- Sexually Explicit: BLOCK_MEDIUM_AND_ABOVE
- Dangerous Content: BLOCK_MEDIUM_AND_ABOVE

## Usage

### Basic Usage

```typescript
import { aiService } from './services/ai/index.js';

// Generate text content
const textResult = await aiService.generateText({
  prompt: 'Create an engaging post about technology',
  platform: 'instagram',
  contentType: 'caption',
});

// Generate image
const imageResult = await aiService.generateImage({
  prompt: 'A beautiful landscape',
  platform: 'instagram',
  aspectRatio: 'square',
});

// Generate video
const videoResult = await aiService.generateVideo({
  prompt: 'Dynamic tech showcase',
  platform: 'tiktok',
  duration: 15,
});
```

### Platform Support

The services support the following platforms with optimized content:

- **Instagram**: Square (1080x1080), Portrait (1080x1350), Landscape (1080x608)
- **TikTok**: Portrait (1080x1920), Square (1080x1080)
- **YouTube**: Landscape (1920x1080), Portrait (1080x1920)
- **LinkedIn**: Landscape (1200x627), Professional tone
- **Twitter/X**: Landscape (1200x675), Concise format

### Content Types

#### Text Generation
- Captions
- Hashtags
- Descriptions
- Platform-specific optimization

#### Image Generation (Mock)
- Multiple aspect ratios
- Style options: photographic, digital-art, illustration, anime
- Platform-optimized dimensions

#### Video Generation (Mock)
- Duration limits per platform
- Style options: realistic, animated, cinematic, documentary
- Platform-specific specifications

## Error Handling

The services implement comprehensive error handling:

- **Retry Logic**: Automatic retries with exponential backoff
- **Timeout Protection**: Configurable timeouts for long-running operations
- **Validation**: Input validation for all parameters
- **Safety Filtering**: Content safety validation

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
}
```

## Testing

The AI services include comprehensive test coverage:

- Unit tests for individual services
- Integration tests for service orchestration
- Mock implementations for development/testing
- Error scenario testing

Run tests:
```bash
npm test -- ai
```

## Service Status

Check the configuration and availability of AI services:

```typescript
const status = aiService.getServiceStatus();
console.log(status);
// {
//   gemini: { configured: true, available: true },
//   imagen: { configured: true, available: false },
//   veo: { configured: true, available: false }
// }
```

## Implementation Notes

### Gemini Service
- **Status**: ✅ Fully implemented
- **Features**: Text generation, hashtag generation, content validation
- **API**: Google Generative AI SDK

### Imagen Service
- **Status**: 🚧 Mock implementation
- **Features**: Platform-specific image dimensions, style options
- **Note**: Ready for Imagen 3 API integration when available

### Veo Service
- **Status**: 🚧 Mock implementation
- **Features**: Platform-specific video specs, duration limits
- **Note**: Ready for Veo API integration when available

## Future Enhancements

1. **Real API Integration**: Replace mock implementations with actual Imagen 3 and Veo APIs
2. **Caching**: Implement response caching for improved performance
3. **Rate Limiting**: Add intelligent rate limiting for API calls
4. **Analytics**: Track usage patterns and performance metrics
5. **Custom Models**: Support for fine-tuned models

## Security Considerations

- API keys are stored securely in environment variables
- Content safety filtering is enabled by default
- Input validation prevents malicious prompts
- Rate limiting protects against abuse

## Performance

- Retry mechanisms with exponential backoff
- Configurable timeouts
- Efficient error handling
- Mock implementations for development speed

## Contributing

When adding new AI services or features:

1. Follow the existing service pattern
2. Include comprehensive tests
3. Add proper error handling
4. Update documentation
5. Consider platform-specific optimizations