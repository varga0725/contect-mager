import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { PlatformSelector } from './PlatformSelector';
import { ContentGenerationForm } from './ContentGenerationForm';
import { GeneratedContentPreview } from './GeneratedContentPreview';
import { UsageLimitDisplay } from './UsageLimitDisplay';
import type { Platform } from '../../types';
import { contentApi } from '../../lib/api';

export interface GeneratedContentData {
  id: number;
  caption?: string;
  imageUrl?: string;
  videoUrl?: string;
  hashtags?: string[];
  platform: Platform;
  contentType: 'caption' | 'image' | 'video';
  createdAt: Date;
}

export interface ContentGeneratorProps {
  className?: string;
}

export function ContentGenerator({ className }: ContentGeneratorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram');
  const [contentType, setContentType] = useState<'caption' | 'image' | 'video'>('caption');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const queryClient = useQueryClient();

  // Query for usage statistics
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => contentApi.getUsage(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutation for generating caption
  const generateCaptionMutation = useMutation({
    mutationFn: (params: { prompt: string; platform: Platform; tone?: string; includeHashtags?: boolean }) =>
      contentApi.generateCaption(params),
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent({
          id: data.data.id,
          caption: data.data.caption,
          hashtags: data.data.hashtags,
          platform: data.data.platform,
          contentType: 'caption',
          createdAt: new Date(data.data.createdAt),
        });
        // Invalidate usage query to update limits
        queryClient.invalidateQueries({ queryKey: ['usage'] });
        queryClient.invalidateQueries({ queryKey: ['contentLibrary'] });
      }
    },
  });

  // Mutation for generating image
  const generateImageMutation = useMutation({
    mutationFn: (params: { prompt: string; platform: Platform; style?: string; aspectRatio?: string }) =>
      contentApi.generateImage(params),
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent({
          id: data.data.id,
          imageUrl: data.data.imageUrl,
          platform: data.data.platform,
          contentType: 'image',
          createdAt: new Date(data.data.createdAt),
        });
        // Invalidate usage query to update limits
        queryClient.invalidateQueries({ queryKey: ['usage'] });
        queryClient.invalidateQueries({ queryKey: ['contentLibrary'] });
      }
    },
  });

  // Mutation for generating video
  const generateVideoMutation = useMutation({
    mutationFn: (params: { prompt: string; platform: Platform; duration?: number; style?: string }) =>
      contentApi.generateVideo(params),
    onSuccess: (data) => {
      if (data.success) {
        setGeneratedContent({
          id: data.data.id,
          videoUrl: data.data.videoUrl,
          platform: data.data.platform,
          contentType: 'video',
          createdAt: new Date(data.data.createdAt),
        });
        // Invalidate usage query to update limits
        queryClient.invalidateQueries({ queryKey: ['usage'] });
        queryClient.invalidateQueries({ queryKey: ['contentLibrary'] });
      }
    },
  });

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const baseParams = {
        prompt: formData.prompt,
        platform: selectedPlatform,
      };

      switch (contentType) {
        case 'caption':
          await generateCaptionMutation.mutateAsync({
            ...baseParams,
            tone: formData.tone,
            includeHashtags: formData.includeHashtags,
          });
          break;
        case 'image':
          await generateImageMutation.mutateAsync({
            ...baseParams,
            style: formData.style,
            aspectRatio: formData.aspectRatio,
          });
          break;
        case 'video':
          await generateVideoMutation.mutateAsync({
            ...baseParams,
            duration: formData.duration,
            style: formData.style,
          });
          break;
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewGeneration = () => {
    setGeneratedContent(null);
  };

  const isAtLimit = usageData?.data?.remainingPosts === 0;
  const canGenerate = !isAtLimit && !isGenerating;

  return (
    <div className={className}>
      <div className="space-y-4 sm:space-y-6">
        {/* Usage Display */}
        <UsageLimitDisplay 
          usage={usageData?.data} 
          isLoading={usageLoading} 
        />

        {/* Main Content Generation */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Generate AI Content</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Create engaging content for your social media platforms using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* Platform Selection */}
            <PlatformSelector
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
            />

            {/* Content Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {(['caption', 'image', 'video'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={contentType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setContentType(type)}
                    className="capitalize flex-1 sm:flex-none min-w-0"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Generation Form or Preview */}
            {!generatedContent ? (
              <ContentGenerationForm
                platform={selectedPlatform}
                contentType={contentType}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                canGenerate={canGenerate}
                isAtLimit={isAtLimit}
              />
            ) : (
              <div className="space-y-4">
                <GeneratedContentPreview
                  content={generatedContent}
                  platform={selectedPlatform}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleNewGeneration} variant="outline" className="w-full sm:w-auto">
                    Generate New Content
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}