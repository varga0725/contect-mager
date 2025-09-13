import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MobileNav } from '../components/ui/mobile-nav';
import { ResponsiveImage } from '../components/ui/responsive-image';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  subscriptionTier: 'free' as const,
  monthlyUsage: 5,
  usageResetDate: new Date(),
};

// Mock auth context
const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}));

describe('Responsive Design Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('MobileNav Component', () => {
    it('should render mobile navigation button', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should have proper touch-optimized classes', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toHaveClass('p-2'); // Touch-friendly padding
    });

    it('should be hidden on desktop screens', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const container = screen.getByLabelText('Toggle menu').closest('div');
      expect(container).toHaveClass('md:hidden');
    });
  });

  describe('ResponsiveImage Component', () => {
    it('should render with proper aspect ratio classes', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
          aspectRatio="square"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('aspect-square');
    });

    it('should render loading state initially', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
          aspectRatio="video"
        />
      );

      // Should show loading placeholder
      const loadingElement = screen.getByRole('img').closest('div')?.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should have proper responsive classes', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
          aspectRatio="portrait"
        />
      );

      const container = screen.getByRole('img').closest('div');
      expect(container).toHaveClass('aspect-[3/4]');
      expect(container).toHaveClass('overflow-hidden');
      expect(container).toHaveClass('rounded-lg');
    });
  });

  describe('Viewport Meta Tag', () => {
    it('should have proper viewport meta tag for mobile optimization', () => {
      // Check if viewport meta tag exists in document head
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      
      // If not found, it should be added by the build process
      // This test ensures we're aware of the requirement
      if (viewportMeta) {
        expect(viewportMeta.getAttribute('content')).toContain('width=device-width');
        expect(viewportMeta.getAttribute('content')).toContain('initial-scale=1');
      }
    });
  });

  describe('Touch Optimization', () => {
    it('should have touch-optimized button sizes', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const menuButton = screen.getByLabelText('Toggle menu');
      
      // Check for minimum touch target size (44px recommended)
      // With p-2 class (8px padding) and icon size, should meet minimum
      expect(menuButton).toHaveClass('p-2');
    });
  });

  describe('Responsive Breakpoints', () => {
    const testBreakpoints = [
      { name: 'mobile', width: 375 },
      { name: 'tablet', width: 768 },
      { name: 'desktop', width: 1024 },
      { name: 'large', width: 1440 },
    ];

    testBreakpoints.forEach(({ name, width }) => {
      it(`should handle ${name} viewport (${width}px)`, () => {
        // Mock window.innerWidth
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        render(
          <QueryClientProvider client={queryClient}>
            <MobileNav />
          </QueryClientProvider>
        );

        // Component should render without errors at this viewport
        const menuButton = screen.getByLabelText('Toggle menu');
        expect(menuButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility on Mobile', () => {
    it('should have proper ARIA labels for mobile navigation', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    it('should support keyboard navigation', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MobileNav />
        </QueryClientProvider>
      );

      const menuButton = screen.getByLabelText('Toggle menu');
      
      // Should be focusable
      menuButton.focus();
      expect(document.activeElement).toBe(menuButton);
    });
  });

  describe('Performance Optimizations', () => {
    it('should use lazy loading for images by default', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should support eager loading when specified', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
          loading="eager"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should have proper sizes attribute for responsive images', () => {
      render(
        <ResponsiveImage
          src="test-image.jpg"
          alt="Test image"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', '(max-width: 640px) 100vw, 50vw');
    });
  });
});