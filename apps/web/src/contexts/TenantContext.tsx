'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant } from '@/types';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

interface TenantContextType {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only fetch tenant data if user is authenticated
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    const fetchTenantData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get tenant based on the user's tenantId
        const tenantData = await apiClient.get<Tenant>(`/api/tenants/${user.tenantId}`);
        setCurrentTenant(tenantData);
      } catch (err: any) {
        console.warn('Tenant API not available, using mock tenant data');

        // If API is not available (404), create a mock tenant
        if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK') {
          const mockTenant: Tenant = {
            id: user.tenantId,
            name: 'InField Works Services',
            slug: 'infield-works',
            domain: 'infieldworks.com',
            industry: 'Field Service Management',
            size: 'Medium',
            createdAt: new Date().toISOString(),
            active: true
          };
          setCurrentTenant(mockTenant);
          setError(null); // Clear error since we're using mock data
        } else {
          console.error('Error fetching tenant data:', err);
          setError('Failed to load tenant data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [isAuthenticated, user]);

  const value = {
    currentTenant,
    isLoading,
    error,
    setCurrentTenant,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};
