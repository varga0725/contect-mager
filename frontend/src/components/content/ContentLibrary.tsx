import { useState, useEffect } from 'react';
import { contentApi } from '../../lib/api';
import type { GeneratedContent, ContentLibraryFilters } from '../../types';
import { ContentCard } from './ContentCard';
import { ContentFilters } from './ContentFilters';
import { Pagination } from './Pagination';

interface ContentLibraryProps {
  className?: string;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({ className = '' }) => {
  const [content, setContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentLibraryFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contentApi.getLibrary({
        page: pagination.page,
        limit: pagination.limit,
        platform: filters.platform || undefined,
        contentType: filters.contentType || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      setContent(response.data.content);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [filters, pagination.page]);

  const handleFilterChange = (newFilters: Partial<ContentLibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleDelete = async (id: number) => {
    try {
      await contentApi.deleteContent(id);
      // Refresh the content list
      await fetchContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  };

  if (loading && content.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your content library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Error Loading Content</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchContent}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Content Library</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {pagination.total} {pagination.total === 1 ? 'item' : 'items'} total
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <ContentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {content.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
          <p className="text-gray-600 mb-4">
            {filters.platform || filters.contentType 
              ? 'Try adjusting your filters to see more content.'
              : 'Start creating content to see it appear here.'
            }
          </p>
          {(filters.platform || filters.contentType) && (
            <button
              onClick={() => handleFilterChange({ platform: null, contentType: null })}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {content.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {loading && content.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};