import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/ui/offline-indicator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Don't retry on 4xx client errors (except 408, 429)
        if (error?.status >= 400 && error?.status < 500 && 
            error?.status !== 408 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus by default
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts if data is stale
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Only retry on 5xx server errors and network errors
        if (error?.status >= 500 || error?.status === 0) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <Switch>
        <Route path="/auth">
          {isAuthenticated ? <DashboardPage /> : <AuthPage />}
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute fallback={<AuthPage />}>
            <DashboardPage />
          </ProtectedRoute>
        </Route>
        <Route>
          {isAuthenticated ? <DashboardPage /> : <AuthPage />}
        </Route>
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="min-h-screen bg-background text-foreground scroll-smooth">
              <OfflineIndicator />
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;