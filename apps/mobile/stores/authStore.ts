import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

// Storage keys
const USER_KEY = 'user_data';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenant?: Tenant;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading to check existing session
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Make login API call
      const response = await authService.login({ email, password });

      console.log('[Auth Store] Processing login response for tenant:', response.user.tenant?.name);

      // Map API response to User interface
      const nameParts = response.user.name?.split(' ') || [];
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        firstName: response.user.firstName || nameParts[0] || '',
        lastName: response.user.lastName || nameParts.slice(1).join(' ') || '',
        role: response.user.role,
        tenantId: response.user.tenantId,
        tenant: response.user.tenant,
      };

      // Store user data with tenant information
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      console.log('[Auth Store] Login successful:', {
        userId: user.id,
        email: user.email,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
      });

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[Auth Store] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Login failed. Please check your credentials.';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      // Clear tokens via auth service
      await authService.logout();

      // Clear user data
      await SecureStore.deleteItemAsync(USER_KEY);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      // Check if authenticated
      const isAuthenticated = await authService.isAuthenticated();

      if (!isAuthenticated) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Try to get stored user data
      const userData = await SecureStore.getItemAsync(USER_KEY);

      if (userData) {
        const user = JSON.parse(userData);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token exists but no user data - fetch from API
        try {
          const profileData: any = await authService.getProfile();
          const nameParts = profileData.name?.split(' ') || [];
          const user: User = {
            id: profileData.id,
            email: profileData.email,
            firstName: profileData.firstName || nameParts[0] || '',
            lastName: profileData.lastName || nameParts.slice(1).join(' ') || '',
            role: profileData.role,
            tenantId: profileData.tenantId,
            avatarUrl: profileData.avatarUrl,
          };
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token invalid - clear auth
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

