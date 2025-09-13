import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ContentGenerator } from '../components/content/ContentGenerator';
import { ContentLibrary } from '../components/content/ContentLibrary';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { SubscriptionManager } from '../components/subscription/SubscriptionManager';

expect.extend(toHaveNoViolations);

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Accessibility Tests', () => {
  describe('Authentication Components', () => {
    it('LoginForm should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('RegisterForm should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Content Components', () => {
    it('ContentGenerator should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <ContentGenerator />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('ContentLibrary should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <ContentLibrary />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Analytics Components', () => {
    it('AnalyticsDashboard should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Subscription Components', () => {
    it('SubscriptionManager should be accessible', async () => {
      const { container } = render(
        <TestWrapper>
          <SubscriptionManager />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in forms', async () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/password/i);

      // Check that inputs are focusable
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      
      // Check tabindex attributes
      expect(emailInput).not.toHaveAttribute('tabindex', '-1');
      expect(passwordInput).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on interactive elements', async () => {
      const { container } = render(
        <TestWrapper>
          <ContentGenerator />
        </TestWrapper>
      );

      // Check for buttons with proper labels
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const hasLabel = 
          button.getAttribute('aria-label') ||
          button.getAttribute('aria-labelledby') ||
          button.textContent?.trim();
        
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should have proper form labels', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      // Check that all inputs have labels
      const inputs = container.querySelectorAll('input');
      inputs.forEach(input => {
        const hasLabel = 
          input.getAttribute('aria-label') ||
          input.getAttribute('aria-labelledby') ||
          container.querySelector(`label[for="${input.id}"]`);
        
        expect(hasLabel).toBeTruthy();
      });
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color for information', async () => {
      const { container } = render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // This is a basic check - in real tests you'd use more sophisticated tools
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});