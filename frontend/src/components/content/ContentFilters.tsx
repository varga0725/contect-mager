import type { ContentLibraryFilters, Platform } from '../../types';

interface ContentFiltersProps {
  filters: ContentLibraryFilters;
  onFilterChange: (filters: Partial<ContentLibraryFilters>) => void;
}

export const ContentFilters: React.FC<ContentFiltersProps> = ({ filters, onFilterChange }) => {
  const platforms: { value: Platform; label: string; icon: string }[] = [
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'youtube', label: 'YouTube', icon: '📺' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
  ];

  const contentTypes: { value: 'caption' | 'image' | 'video'; label: string; icon: string }[] = [
    { value: 'caption', label: 'Caption', icon: '📝' },
    { value: 'image', label: 'Image', icon: '🖼️' },
    { value: 'video', label: 'Video', icon: '🎬' },
  ];

  const sortOptions: { value: 'createdAt' | 'platform' | 'contentType'; label: string }[] = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'platform', label: 'Platform' },
    { value: 'contentType', label: 'Content Type' },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
      {/* Platform Filter */}
      <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
        <select
          value={filters.platform || ''}
          onChange={(e) => onFilterChange({ platform: e.target.value as Platform || null })}
          className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
        >
          <option value="">All Platforms</option>
          {platforms.map((platform) => (
            <option key={platform.value} value={platform.value}>
              {platform.icon} {platform.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content Type Filter */}
      <div className="relative flex-1 sm:flex-none sm:min-w-[120px]">
        <select
          value={filters.contentType || ''}
          onChange={(e) => onFilterChange({ contentType: e.target.value as 'caption' | 'image' | 'video' || null })}
          className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
        >
          <option value="">All Types</option>
          {contentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 flex-1 sm:flex-none">
        <div className="relative flex-1 sm:min-w-[160px]">
          <select
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as 'createdAt' | 'platform' | 'contentType' })}
            className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                Sort by {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button
          onClick={() => onFilterChange({ 
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
          })}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation flex-shrink-0"
          title={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {filters.sortOrder === 'asc' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
        </button>
      </div>

      {/* Clear Filters */}
      {(filters.platform || filters.contentType) && (
        <button
          onClick={() => onFilterChange({ platform: null, contentType: null })}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline touch-manipulation flex-shrink-0 sm:self-center"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};