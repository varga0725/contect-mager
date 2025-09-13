import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Platform } from '../../types';

export interface ContentGenerationFormProps {
  platform: Platform;
  contentType: 'caption' | 'image' | 'video';
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  isAtLimit: boolean;
}

export function ContentGenerationForm({
  platform,
  contentType,
  onGenerate,
  isGenerating,
  canGenerate,
  isAtLimit,
}: ContentGenerationFormProps) {
  const [formData, setFormData] = useState({
    prompt: '',
    tone: 'engaging',
    style: 'photographic',
    aspectRatio: 'square',
    duration: 30,
    includeHashtags: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prompt.trim() || !canGenerate) return;
    onGenerate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isAtLimit) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-lg font-medium text-destructive">
          Monthly Limit Reached
        </div>
        <p className="text-muted-foreground">
          You've reached your monthly content generation limit. 
          Upgrade your subscription to generate more content.
        </p>
        <Button variant="default" className="mt-4">
          Upgrade Subscription
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt">
          Content Prompt *
        </Label>
        <textarea
          id="prompt"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={getPromptPlaceholder(contentType, platform)}
          value={formData.prompt}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          {getPromptHint(contentType, platform)}
        </p>
      </div>

      {/* Content Type Specific Options */}
      {contentType === 'caption' && (
        <CaptionOptions 
          formData={formData} 
          onChange={handleInputChange}
          platform={platform}
        />
      )}

      {contentType === 'image' && (
        <ImageOptions 
          formData={formData} 
          onChange={handleInputChange}
          platform={platform}
        />
      )}

      {contentType === 'video' && (
        <VideoOptions 
          formData={formData} 
          onChange={handleInputChange}
          platform={platform}
        />
      )}

      {/* Generate Button */}
      <Button
        type="submit"
        disabled={!formData.prompt.trim() || !canGenerate || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Generating {contentType}...
          </>
        ) : (
          `Generate ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`
        )}
      </Button>
    </form>
  );
}

function CaptionOptions({ 
  formData, 
  onChange, 
  platform 
}: { 
  formData: any; 
  onChange: (field: string, value: any) => void;
  platform: Platform;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="tone">Tone</Label>
        <select
          id="tone"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formData.tone}
          onChange={(e) => onChange('tone', e.target.value)}
        >
          <option value="engaging">Engaging</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="humorous">Humorous</option>
          <option value="inspirational">Inspirational</option>
          <option value="educational">Educational</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="includeHashtags"
          checked={formData.includeHashtags}
          onChange={(e) => onChange('includeHashtags', e.target.checked)}
          className="rounded border-input"
        />
        <Label htmlFor="includeHashtags">Include hashtags</Label>
      </div>
    </div>
  );
}

function ImageOptions({ 
  formData, 
  onChange, 
  platform 
}: { 
  formData: any; 
  onChange: (field: string, value: any) => void;
  platform: Platform;
}) {
  const aspectRatioOptions = getAspectRatioOptions(platform);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <select
          id="style"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formData.style}
          onChange={(e) => onChange('style', e.target.value)}
        >
          <option value="photographic">Photographic</option>
          <option value="digital-art">Digital Art</option>
          <option value="illustration">Illustration</option>
          <option value="anime">Anime</option>
          <option value="3d-render">3D Render</option>
          <option value="minimalist">Minimalist</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aspectRatio">Aspect Ratio</Label>
        <select
          id="aspectRatio"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formData.aspectRatio}
          onChange={(e) => onChange('aspectRatio', e.target.value)}
        >
          {aspectRatioOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function VideoOptions({ 
  formData, 
  onChange, 
  platform 
}: { 
  formData: any; 
  onChange: (field: string, value: any) => void;
  platform: Platform;
}) {
  const maxDuration = getMaxDuration(platform);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <select
          id="style"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={formData.style}
          onChange={(e) => onChange('style', e.target.value)}
        >
          <option value="cinematic">Cinematic</option>
          <option value="documentary">Documentary</option>
          <option value="animation">Animation</option>
          <option value="time-lapse">Time-lapse</option>
          <option value="slow-motion">Slow Motion</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration (seconds)</Label>
        <Input
          type="number"
          id="duration"
          min="5"
          max={maxDuration}
          value={formData.duration}
          onChange={(e) => onChange('duration', parseInt(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Max: {maxDuration} seconds for {platform}
        </p>
      </div>
    </div>
  );
}

// Helper functions
function getPromptPlaceholder(contentType: string, platform: Platform): string {
  const placeholders = {
    caption: `Write a ${platform} caption about...`,
    image: `Create an image showing...`,
    video: `Generate a video of...`,
  };
  return placeholders[contentType as keyof typeof placeholders] || 'Describe what you want to create...';
}

function getPromptHint(contentType: string, platform: Platform): string {
  const hints = {
    caption: 'Be specific about the topic, audience, and desired tone',
    image: 'Describe the scene, style, colors, and mood you want',
    video: 'Describe the action, setting, and visual style',
  };
  return hints[contentType as keyof typeof hints] || '';
}

function getAspectRatioOptions(platform: Platform) {
  const baseOptions = [
    { value: 'square', label: 'Square (1:1)' },
    { value: 'vertical', label: 'Vertical (9:16)' },
    { value: 'horizontal', label: 'Horizontal (16:9)' },
  ];

  // Platform-specific recommendations
  if (platform === 'instagram' || platform === 'tiktok') {
    return [
      { value: 'square', label: 'Square (1:1) - Recommended' },
      { value: 'vertical', label: 'Vertical (9:16)' },
      { value: 'horizontal', label: 'Horizontal (16:9)' },
    ];
  }

  return baseOptions;
}

function getMaxDuration(platform: Platform): number {
  const maxDurations = {
    instagram: 60,
    tiktok: 180,
    youtube: 60,
    linkedin: 600,
    twitter: 140,
  };
  return maxDurations[platform];
}