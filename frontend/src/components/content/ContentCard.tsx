import { useState } from 'react';
import type { GeneratedContent } from '../../types';
import { ResponsiveImage } from '../ui/responsive-image';

interface ContentCardProps {
  content: GeneratedContent;
  onDelete: (id: number) => Promise<void>;
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(content.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      instagram: '📷',
      tiktok: '🎵',
      youtube: '📺',
      linkedin: '💼',
      twitter: '🐦',
    };
    return icons[platform as keyof typeof icons] || '📱';
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      caption: '📝',
      image: '🖼️',
      video: '🎬',
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderContentPreview = () => {
    switch (content.contentType) {
      case 'caption':
        return (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {content.contentData.text}
            </p>
            {content.contentData.hashtags && content.contentData.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {content.contentData.hashtags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
                {content.contentData.hashtags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{content.contentData.hashtags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        );
      
      case 'image':
        return content.contentData.imageUrl ? (
          <ResponsiveImage
            src={content.contentData.imageUrl}
            alt="Generated image"
            aspectRatio="square"
            loading="lazy"
          />
        ) : (
          <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
            <svg className="w-8 h-8 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      
      case 'video':
        return (
          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
            {content.contentData.videoUrl ? (
              <video
                src={content.contentData.videoUrl}
                className="w-full h-full object-cover"
                controls={false}
                muted
                preload="metadata"
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="p-3 bg-gray-50 rounded-md text-center text-gray-500">
            Unknown content type
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="text-base sm:text-lg">{getPlatformIcon(content.platform)}</span>
            <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize truncate">
              {content.platform}
            </span>
            <span className="text-base sm:text-lg">{getContentTypeIcon(content.contentType)}</span>
          </div>
          
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="p-2 sm:p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 touch-manipulation"
              title="Delete content"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Delete Content</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Are you sure you want to delete this content? This action cannot be undone.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors touch-manipulation"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-3 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 touch-manipulation"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Preview */}
        {renderContentPreview()}

        {/* Footer */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <span className="truncate">Created {formatDate(content.createdAt)}</span>
          {content.scheduledAt && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center sm:text-left flex-shrink-0">
              Scheduled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};