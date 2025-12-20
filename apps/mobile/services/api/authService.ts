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

    // Extract token (API returns 'token' but we need 'accessToken' for consistency)
    const accessToken = response.token || response.accessToken;
    const refreshToken = response.refreshToken || '';

    if (!accessToken) {
      throw new Error('No access token received from server');
    }

    // Store tokens (refreshToken is optional)
    await apiClient.setTokens(accessToken, refreshToken);

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
      // Call logout endpoint
      const response = await apiClient.post<LogoutResponse>('/auth/logout');

      // Clear tokens locally regardless of server response
      await apiClient.logout();

      return response;
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
    return apiClient.get('/auth/me');
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    return !!token;
  }
};