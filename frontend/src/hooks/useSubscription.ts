import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3000/api';

export const SUBSCRIPTION_QUERY_KEYS = {
  all: ['subscription'] as const,
  status: () => ['subscription', 'status'] as const,
  usage: () => ['subscription', 'usage'] as const,
} as const;

// Subscription API functions
const subscriptionApi = {
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/subscription/status`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription status');
    }
    
    return response.json();
  },

  async getUsage() {
    const response = await fetch(`${API_BASE_URL}/subscription/usage`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch usage statistics');
    }
    
    return response.json();
  },

  async createCheckoutSession(tier: 'pro' | 'creator') {
    const successUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/subscription/cancel`;
    
    const response = await fetch(`${API_BASE_URL}/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        tier,
        successUrl,
        cancelUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }
    
    return response.json();
  },

  async cancelSubscription() {
    const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    
    return response.json();
  },
};

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.status(),
    queryFn: subscriptionApi.getStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

export function useSubscriptionUsage() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEYS.usage(),
    queryFn: subscriptionApi.getUsage,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

export function useUpgradeSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: subscriptionApi.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.data.url;
    },
    onError: (error) => {
      console.error('Subscription upgrade failed:', error);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: subscriptionApi.cancelSubscription,
    onSuccess: () => {
      // Invalidate subscription data to refetch updated status
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEYS.all });
    },
    onError: (error) => {
      console.error('Subscription cancellation failed:', error);
    },
  });
}