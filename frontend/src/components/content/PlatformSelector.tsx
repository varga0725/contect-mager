import React from 'react';
import { Button } from '../ui/button';
import type { Platform } from '../../types';

const PLATFORMS: { value: Platform; label: string; icon: string; color: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-black' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-red-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { value: 'twitter', label: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
];

export interface PlatformSelectorProps {
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  className?: string;
}

export function PlatformSelector({ 
  selectedPlatform, 
  onPlatformChange, 
  className 
}: PlatformSelectorProps) {
  return (
    <div className={className}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Platform</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PLATFORMS.map((platform) => (
            <Button
              key={platform.value}
              variant={selectedPlatform === platform.value ? 'default' : 'outline'}
              className={`h-auto p-3 flex flex-col items-center gap-2 ${
                selectedPlatform === platform.value 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : ''
              }`}
              onClick={() => onPlatformChange(platform.value)}
            >
              <span className="text-lg">{platform.icon}</span>
              <span className="text-xs font-medium">{platform.label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Platform-specific info */}
      <div className="mt-3 p-3 bg-muted rounded-lg">
        <PlatformInfo platform={selectedPlatform} />
      </div>
    </div>
  );
}

function PlatformInfo({ platform }: { platform: Platform }) {
  const platformSpecs = {
    instagram: {
      caption: 'Up to 2,200 characters',
      image: 'Square (1080x1080) or vertical (1080x1920)',
      video: 'Up to 60 seconds, vertical format preferred',
      hashtags: 'Up to 30 hashtags recommended',
    },
    tiktok: {
      caption: 'Up to 4,000 characters',
      image: 'Vertical (1080x1920)',
      video: 'Up to 3 minutes, vertical format',
      hashtags: 'Up to 100 characters in hashtags',
    },
    youtube: {
      caption: 'Up to 5,000 characters',
      image: 'Horizontal (1280x720) or square',
      video: 'Up to 60 seconds for Shorts, vertical format',
      hashtags: 'Up to 15 hashtags in description',
    },
    linkedin: {
      caption: 'Up to 3,000 characters',
      image: 'Horizontal (1200x627) recommended',
      video: 'Up to 10 minutes, horizontal format',
      hashtags: 'Up to 3-5 hashtags recommended',
    },
    twitter: {
      caption: 'Up to 280 characters',
      image: 'Horizontal (1200x675) or square',
      video: 'Up to 2 minutes 20 seconds',
      hashtags: 'Up to 2-3 hashtags recommended',
    },
  };

  const specs = platformSpecs[platform];

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm capitalize">{platform} Specifications</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-medium">Caption:</span> {specs.caption}
        </div>
        <div>
          <span className="font-medium">Image:</span> {specs.image}
        </div>
        <div>
          <span className="font-medium">Video:</span> {specs.video}
        </div>
        <div>
          <span className="font-medium">Hashtags:</span> {specs.hashtags}
        </div>
      </div>
    </div>
  );
}