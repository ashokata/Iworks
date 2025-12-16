'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types';
import { MOCK_USERS } from '@/lib/mockData';

interface AuthContextType extends AuthState {
  login: (username: string, password: string, tenantSlug?: string) => Promise<boolean>;
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

  const login = async (username: string, password: string, tenantSlug?: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // If tenantSlug is provided, use real API authentication
      if (tenantSlug) {
        const { apiClient } = await import('@/services/apiClient');

        const response = await apiClient.post('/api/auth/login', {
          email: username,
          password,
          tenantSlug,
        });

        if (response.success) {
          const token = response.token;
          const user = response.user;

          // Set tenant ID in API client
          apiClient.setTenantId(user.tenantId);

          // Save to localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('authUser', JSON.stringify(user));

          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token,
          });

          return true;
        }
      } else {
        // Fallback to mock authentication for development
        await new Promise(resolve => setTimeout(resolve, 1000));

        const matchedCredential = MOCK_CREDENTIALS.find(
          cred => cred.username === username && cred.password === password
        );

        if (matchedCredential) {
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
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('Login error:', error);
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
