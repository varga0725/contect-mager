import type { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetails;
  timestamp: string;
  requestId?: string;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;
  public requestId?: string;
  
  constructor(status: number, message: string, code?: string, details?: any, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.name = 'ApiError';
  }

  static fromResponse(status: number, errorResponse: ApiErrorResponse): ApiError {
    return new ApiError(
      status,
      errorResponse.error.message,
      errorResponse.error.code,
      errorResponse.error.details,
      errorResponse.requestId
    );
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData: ApiErrorResponse | null = null;
      
      try {
        errorData = await response.json();
      } catch {
        // If we can't parse the error response, create a generic one
        throw new ApiError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      if (errorData && errorData.error) {
        throw ApiError.fromResponse(response.status, errorData);
      } else {
        throw new ApiError(
          response.status,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(0, 'Network error: Unable to connect to server', 'NETWORK_ERROR');
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new ApiError(0, 'Request timeout', 'TIMEOUT_ERROR');
    }
    
    // Generic error fallback
    throw new ApiError(0, error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

// Enhanced API request with timeout and retry logic
async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 0,
  timeout: number = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const result = await apiRequest<T>(endpoint, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      // Retry on 5xx errors or network errors
      if (retries > 0 && (error.status >= 500 || error.status === 0)) {
        const delay = Math.min(1000 * (3 - retries), 3000); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiRequestWithRetry(endpoint, options, retries - 1, timeout);
      }
    }
    
    throw error;
  }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { confirmPassword, ...registerData } = credentials;
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
  },

  async logout(): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  async getCurrentUser(): Promise<{ user: User | null }> {
    return apiRequest<{ user: User | null }>('/auth/me');
  },
};

export const contentApi = {
  async getLibrary(params: {
    page?: number;
    limit?: number;
    platform?: string;
    contentType?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<import('../types').ContentLibraryResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/content/library${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<import('../types').ContentLibraryResponse>(endpoint);
  },

  async deleteContent(id: number): Promise<{ success: boolean; data: { message: string; deletedId: number } }> {
    return apiRequest<{ success: boolean; data: { message: string; deletedId: number } }>(`/content/${id}`, {
      method: 'DELETE',
    });
  },

  async generateCaption(params: {
    prompt: string;
    platform: string;
    tone?: string;
    includeHashtags?: boolean;
  }): Promise<{
    success: boolean;
    data: {
      id: number;
      caption: string;
      hashtags: string[];
      platform: string;
      contentType: string;
      createdAt: string;
    };
  }> {
    return apiRequest('/content/generate-caption', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateImage(params: {
    prompt: string;
    platform: string;
    style?: string;
    aspectRatio?: string;
  }): Promise<{
    success: boolean;
    data: {
      id: number;
      imageUrl: string;
      description: string;
      platform: string;
      contentType: string;
      dimensions: { width: number; height: number };
      createdAt: string;
    };
  }> {
    return apiRequest('/content/generate-image', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateVideo(params: {
    prompt: string;
    platform: string;
    duration?: number;
    style?: string;
  }): Promise<{
    success: boolean;
    data: {
      id: number;
      videoUrl: string;
      description: string;
      platform: string;
      contentType: string;
      duration: number;
      aspectRatio: string;
      createdAt: string;
    };
  }> {
    return apiRequest('/content/generate-video', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getUsage(): Promise<{
    success: boolean;
    data: {
      currentUsage: number;
      monthlyLimit: number;
      tier: 'free' | 'pro' | 'creator';
      resetDate: string;
      remainingPosts: number;
    };
  }> {
    return apiRequest('/content/usage');
  },
};

export const scheduleApi = {
  async scheduleContent(postId: number, scheduledAt: string): Promise<{
    success: boolean;
    data: import('../types').GeneratedContent;
  }> {
    return apiRequest('/schedule', {
      method: 'POST',
      body: JSON.stringify({ postId, scheduledAt }),
    });
  },

  async getScheduledContent(params: {
    startDate?: string;
    endDate?: string;
    platform?: string;
  } = {}): Promise<{
    success: boolean;
    data: import('../types').GeneratedContent[];
  }> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/schedule${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      success: boolean;
      data: import('../types').GeneratedContent[];
    }>(endpoint);
  },

  async updateScheduledContent(postId: number, scheduledAt: string | null): Promise<{
    success: boolean;
    data: import('../types').GeneratedContent;
  }> {
    return apiRequest(`/schedule/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ scheduledAt }),
    });
  },

  async unscheduleContent(postId: number): Promise<{
    success: boolean;
    data: import('../types').GeneratedContent;
  }> {
    return apiRequest(`/schedule/${postId}`, {
      method: 'DELETE',
    });
  },
};

