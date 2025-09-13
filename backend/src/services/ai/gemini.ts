import { genAI, modelConfigs } from '../../config/ai.js';
import { GenerateContentResult } from '@google/generative-ai';

export interface GeminiGenerationOptions {
  prompt: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  contentType?: 'caption' | 'hashtags' | 'description';
  maxLength?: number;
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: modelConfigs.gemini.model,
      generationConfig: modelConfigs.gemini.generationConfig,
      safetySettings: modelConfigs.gemini.safetySettings,
    });
  }

  /**
   * Generate platform-specific social media content
   */
  async generateContent(options: GeminiGenerationOptions): Promise<GeminiResponse> {
    try {
      const platformPrompt = this.buildPlatformPrompt(options);
      
      const result: GenerateContentResult = await this.model.generateContent(platformPrompt);
      const response = await result.response;
      
      if (!response) {
        return {
          success: false,
          error: 'No response received from Gemini API',
        };
      }

      const text = response.text();
      
      if (!text) {
        return {
          success: false,
          error: 'Empty response from Gemini API',
        };
      }

      // Extract usage information if available
      const usage = response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0,
      } : undefined;

      return {
        success: true,
        content: text.trim(),
        usage,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Build platform-specific prompts for content generation
   */
  private buildPlatformPrompt(options: GeminiGenerationOptions): string {
    const { prompt, platform, contentType = 'caption', maxLength } = options;
    
    const platformSpecs = {
      instagram: {
        maxLength: maxLength || 2200,
        style: 'engaging and visual-focused',
        hashtags: 'Use 5-10 relevant hashtags',
        tone: 'casual and authentic',
      },
      tiktok: {
        maxLength: maxLength || 150,
        style: 'trendy and energetic',
        hashtags: 'Use 3-5 trending hashtags',
        tone: 'fun and youthful',
      },
      youtube: {
        maxLength: maxLength || 5000,
        style: 'informative and engaging',
        hashtags: 'Use 3-5 relevant hashtags',
        tone: 'conversational and helpful',
      },
      linkedin: {
        maxLength: maxLength || 3000,
        style: 'professional and insightful',
        hashtags: 'Use 3-5 professional hashtags',
        tone: 'professional and thought-provoking',
      },
      twitter: {
        maxLength: maxLength || 280,
        style: 'concise and impactful',
        hashtags: 'Use 1-3 relevant hashtags',
        tone: 'witty and engaging',
      },
    };

    const spec = platformSpecs[platform];
    
    return `Create a ${contentType} for ${platform} based on this topic: "${prompt}"

Platform Requirements:
- Maximum length: ${spec.maxLength} characters
- Style: ${spec.style}
- Tone: ${spec.tone}
- Hashtags: ${spec.hashtags}

Guidelines:
- Make it engaging and authentic
- Include relevant emojis where appropriate
- Ensure content is appropriate and safe
- Focus on value and engagement
- Adapt language to the platform's audience

Generate only the ${contentType} content, no additional explanations.`;
  }

  /**
   * Generate hashtags for existing content
   */
  async generateHashtags(content: string, platform: string): Promise<GeminiResponse> {
    const prompt = `Generate relevant hashtags for this ${platform} content: "${content}"

Requirements:
- Generate 5-10 hashtags for Instagram
- Generate 3-5 hashtags for TikTok
- Generate 3-5 hashtags for YouTube
- Generate 3-5 hashtags for LinkedIn
- Generate 1-3 hashtags for Twitter

Return only the hashtags separated by spaces, starting with #.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hashtags',
      };
    }
  }
}