import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Platform } from '../../types';
import type { GeneratedContentData } from './ContentGenerator';

export interface GeneratedContentPreviewProps {
  content: GeneratedContentData;
  platform: Platform;
  className?: string;
}

export function GeneratedContentPreview({ 
  content, 
  platform, 
  className 
}: GeneratedContentPreviewProps) {
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="capitalize">{content.contentType}</span>
          <span className="text-sm font-normal text-muted-foreground">
            for {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Display */}
        {content.contentType === 'caption' && content.caption && (
          <CaptionPreview 
            caption={content.caption}
            hashtags={content.hashtags}
            platform={platform}
            onCopy={handleCopyToClipboard}
          />
        )}

        {content.contentType === 'image' && content.imageUrl && (
          <ImagePreview 
            imageUrl={content.imageUrl}
            platform={platform}
            onDownload={handleDownload}
          />
        )}

        {content.contentType === 'video' && content.videoUrl && (
          <VideoPreview 
            videoUrl={content.videoUrl}
            platform={platform}
            onDownload={handleDownload}
          />
        )}

        {/* Platform-specific optimization info */}
        <PlatformOptimizationInfo 
          contentType={content.contentType}
          platform={platform}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            Schedule Post
          </Button>
          <Button variant="outline" size="sm">
            Save to Library
          </Button>
          <Button variant="outline" size="sm">
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CaptionPreview({ 
  caption, 
  hashtags, 
  platform, 
  onCopy 
}: { 
  caption: string; 
  hashtags?: string[]; 
  platform: Platform; 
  onCopy: (text: string) => void;
}) {
  const fullText = hashtags && hashtags.length > 0 
    ? `${caption}\n\n${hashtags.join(' ')}`
    : caption;

  const characterCount = fullText.length;
  const characterLimit = getCharacterLimit(platform);
  const isOverLimit = characterCount > characterLimit;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="p-4 bg-muted rounded-lg border">
          <div className="whitespace-pre-wrap text-sm">
            {caption}
          </div>
          {hashtags && hashtags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1">
                {hashtags.map((hashtag, index) => (
                  <span 
                    key={index}
                    className="text-blue-600 text-sm"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => onCopy(fullText)}
        >
          Copy
        </Button>
      </div>

      {/* Character count */}
      <div className="flex justify-between text-xs">
        <span className={isOverLimit ? 'text-destructive' : 'text-muted-foreground'}>
          {characterCount} / {characterLimit} characters
        </span>
        {isOverLimit && (
          <span className="text-destructive font-medium">
            Over limit by {characterCount - characterLimit}
          </span>
        )}
      </div>
    </div>
  );
}

function ImagePreview({ 
  imageUrl, 
  platform, 
  onDownload 
}: { 
  imageUrl: string; 
  platform: Platform; 
  onDownload: (url: string, filename: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Generated content"
          className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
          style={{ aspectRatio: getAspectRatio(platform) }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDownload(imageUrl, `${platform}-image-${Date.now()}.jpg`)}
          >
            Download
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Optimized for {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </div>
    </div>
  );
}

function VideoPreview({ 
  videoUrl, 
  platform, 
  onDownload 
}: { 
  videoUrl: string; 
  platform: Platform; 
  onDownload: (url: string, filename: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative group">
        <video
          src={videoUrl}
          controls
          className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
          style={{ aspectRatio: getVideoAspectRatio(platform) }}
          data-testid="generated-video"
        >
          Your browser does not support the video tag.
        </video>
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => onDownload(videoUrl, `${platform}-video-${Date.now()}.mp4`)}
        >
          Download
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Optimized for {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </div>
    </div>
  );
}

function PlatformOptimizationInfo({ 
  contentType, 
  platform 
}: { 
  contentType: string; 
  platform: Platform;
}) {
  const optimizations = getOptimizationTips(contentType, platform);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 className="text-sm font-medium text-blue-900 mb-2">
        Platform Optimization Tips
      </h4>
      <ul className="text-xs text-blue-800 space-y-1">
        {optimizations.map((tip, index) => (
          <li key={index} className="flex items-start gap-1">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper functions
function getCharacterLimit(platform: Platform): number {
  const limits = {
    instagram: 2200,
    tiktok: 4000,
    youtube: 5000,
    linkedin: 3000,
    twitter: 280,
  };
  return limits[platform];
}

function getAspectRatio(platform: Platform): string {
  const ratios = {
    instagram: '1 / 1', // Square
    tiktok: '9 / 16', // Vertical
    youtube: '16 / 9', // Horizontal
    linkedin: '16 / 9', // Horizontal
    twitter: '16 / 9', // Horizontal
  };
  return ratios[platform];
}

function getVideoAspectRatio(platform: Platform): string {
  const ratios = {
    instagram: '9 / 16', // Vertical for Reels
    tiktok: '9 / 16', // Vertical
    youtube: '9 / 16', // Vertical for Shorts
    linkedin: '16 / 9', // Horizontal
    twitter: '16 / 9', // Horizontal
  };
  return ratios[platform];
}

function getOptimizationTips(contentType: string, platform: Platform): string[] {
  const tips: Record<string, Record<Platform, string[]>> = {
    caption: {
      instagram: [
        'Use 3-5 relevant hashtags for better reach',
        'Include a call-to-action to boost engagement',
        'Keep the first line engaging as it appears in feeds',
      ],
      tiktok: [
        'Use trending hashtags and sounds',
        'Keep captions short and punchy',
        'Include questions to encourage comments',
      ],
      youtube: [
        'Include keywords for better discoverability',
        'Add timestamps for longer content',
        'Use relevant hashtags in the description',
      ],
      linkedin: [
        'Start with a hook in the first line',
        'Use professional language and industry terms',
        'Include relevant hashtags (3-5 max)',
      ],
      twitter: [
        'Keep it concise and impactful',
        'Use 1-2 relevant hashtags',
        'Include mentions to increase visibility',
      ],
    },
    image: {
      instagram: [
        'Use bright, high-contrast colors',
        'Ensure text is readable on mobile',
        'Consider the square crop for feed posts',
      ],
      tiktok: [
        'Use vertical orientation (9:16)',
        'Include eye-catching visuals',
        'Ensure good lighting and clarity',
      ],
      youtube: [
        'Create compelling thumbnails',
        'Use consistent branding',
        'Include text overlays for context',
      ],
      linkedin: [
        'Use professional, clean designs',
        'Include your company branding',
        'Ensure high resolution for clarity',
      ],
      twitter: [
        'Use horizontal format for best display',
        'Keep text minimal and readable',
        'Use consistent brand colors',
      ],
    },
    video: {
      instagram: [
        'Use vertical format for Reels',
        'Add captions for accessibility',
        'Keep the first 3 seconds engaging',
      ],
      tiktok: [
        'Hook viewers in the first second',
        'Use trending sounds and effects',
        'Keep videos under 60 seconds for best performance',
      ],
      youtube: [
        'Create engaging thumbnails',
        'Use vertical format for Shorts',
        'Include clear audio and good lighting',
      ],
      linkedin: [
        'Keep videos professional and informative',
        'Add captions for silent viewing',
        'Include your company branding',
      ],
      twitter: [
        'Keep videos short and engaging',
        'Use horizontal format',
        'Include captions for accessibility',
      ],
    },
  };

  return tips[contentType]?.[platform] || [];
}