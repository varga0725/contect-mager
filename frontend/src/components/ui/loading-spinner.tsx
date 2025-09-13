import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function LoadingState({
  isLoading,
  error,
  children,
  loadingComponent,
  errorComponent,
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        {loadingComponent || <LoadingSpinner />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        {errorComponent || (
          <div className="text-center">
            <p className="text-red-600 mb-2">Something went wrong</p>
            <p className="text-sm text-gray-600">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded h-4 mb-2 last:mb-0',
            className
          )}
        />
      ))}
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-full h-32 bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-200 rounded" />
        <div className="w-3/4 h-4 bg-gray-200 rounded" />
      </div>
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 bg-gray-200 rounded" />
        <div className="w-16 h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4 animate-pulse">
      <div className="w-48 h-6 bg-gray-200 rounded" />
      <div className="w-full h-64 bg-gray-200 rounded" />
      <div className="flex justify-between">
        <div className="w-20 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}