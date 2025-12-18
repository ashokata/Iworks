'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { MOCK_USERS } from '@/lib/mockData';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert mock users to credentials format
const MOCK_CREDENTIALS = MOCK_USERS ? MOCK_USERS.map(user => ({
  username: user.username,
  password: user.password,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as User['role'],
    tenantId: user.tenantId,
    avatar: undefined,
  }
})) : [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    // Check for existing session on mount - only in browser
    if (typeof window === 'undefined') {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);

        // Restore tenant ID in API client
        if (user.tenantId) {
          import('@/services/apiClient').then(({ apiClient }) => {
            apiClient.setTenantId(user.tenantId);
          });
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          token: savedToken,
        });
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('[Auth] Starting login process for:', username);
      
      // Use real API authentication - tenant will be automatically identified from user credentials
      const { apiClient } = await import('@/services/apiClient');

      console.log('[Auth] Calling API /api/auth/login');
      const response = await apiClient.post<{ success: boolean; token: string; user: any }>('/api/auth/login', {
        email: username,
        password,
      });

      console.log('[Auth] API response received:', { success: response.success, hasUser: !!response.user });

      if (response.success) {
        const token = response.token;
        const user = response.user;

        console.log('[Auth] Login successful, user:', { id: user.id, email: user.email, tenantId: user.tenantId });

        // Set tenant ID in API client (automatically identified from user credentials)
        if (user.tenantId) {
          apiClient.setTenantId(user.tenantId);
          console.log('[Auth] Set tenant ID from user credentials:', user.tenantId);
        } else {
          console.warn('[Auth] Warning: User has no tenantId!', user);
        }

        // Save to localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(user));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          token,
        });

        console.log('[Auth] Auth state updated, isAuthenticated:', true);
        return true;
      }

      console.log('[Auth] Login failed: response.success is false');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      console.error('[Auth] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      
      // Fallback to mock authentication for development if API fails
      if (error?.response?.status === 404 || error?.message?.includes('Network') || error?.code === 'ECONNREFUSED') {
        console.log('[Auth] API unavailable, falling back to mock authentication');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const matchedCredential = MOCK_CREDENTIALS.find(
          cred => cred.username === username && cred.password === password
        );

        if (matchedCredential) {
          console.log('[Auth] Mock authentication successful');
          const token = `mock-jwt-token-${Date.now()}`;
          const user = matchedCredential.user;

          // Set tenant ID in API client - CRITICAL for tenant isolation
          const { apiClient } = await import('@/services/apiClient');
          if (user.tenantId) {
            apiClient.setTenantId(user.tenantId);
            console.log('[Auth] Set tenant ID from mock user:', user.tenantId);
          }

          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(user));

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token,
          });

          return true;
        } else {
          console.log('[Auth] Mock authentication failed: no matching credentials');
        }
      }
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
