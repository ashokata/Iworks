import { apiClient } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success?: boolean;
  token?: string; // API returns 'token'
  accessToken?: string; // Some APIs use 'accessToken'
  refreshToken?: string; // Optional, API might not return this
  user: {
    id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
    tenantId: string;
    tenant?: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
  };
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Authentication Service
 * Handles login, logout, and user profile operations
 */
export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data);

    console.log('[Auth Service] Login response:', {
      success: response.success,
      hasToken: !!response.token,
      userId: response.user?.id,
      tenantId: response.user?.tenantId,
      tenantName: response.user?.tenant?.name,
    });

    // Extract token (API returns 'token' but we need 'accessToken' for consistency)
    const accessToken = response.token || response.accessToken;
    const refreshToken = response.refreshToken || '';
    const tenantId = response.user?.tenantId;

    if (!accessToken) {
      throw new Error('No access token received from server');
    }

    if (!tenantId) {
      throw new Error('No tenant ID received from server');
    }

    // Store tokens and tenant ID
    await apiClient.setTokens(accessToken, refreshToken, tenantId);

    console.log('[Auth Service] Stored credentials for tenant:', tenantId);

    // Return normalized response
    return {
      ...response,
      accessToken,
      refreshToken,
    };
  },

  /**
   * Logout user
   */
  async logout(): Promise<LogoutResponse> {
    try {
      // Call logout endpoint (endpoint doesn't exist yet, but clear tokens anyway)
      // const response = await apiClient.post<LogoutResponse>('/api/auth/logout');

      // Clear tokens locally
      await apiClient.logout();

      console.log('[Auth Service] Logged out successfully');

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Even if server logout fails, clear local tokens
      await apiClient.logout();

      return {
        success: true,
        message: 'Logged out locally'
      };
    }
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return apiClient.get('/api/auth/me');
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    return !!token;
  }
};