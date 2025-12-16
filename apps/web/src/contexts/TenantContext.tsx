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

        // Get tenant ID from user or environment variable
        const tenantId = user.tenantId || process.env.NEXT_PUBLIC_TENANT_ID;
        
        if (!tenantId) {
          console.warn('[TenantContext] No tenant ID available');
          setIsLoading(false);
          return;
        }

        console.log('[TenantContext] Fetching tenant data for:', tenantId);

        // Get tenant based on the user's tenantId
        const response = await apiClient.get<{ tenant: Tenant } | Tenant>(`/api/tenants/${tenantId}`);
        
        // API returns { tenant: {...} } or just the tenant object
        let tenantData: Tenant;
        if ('tenant' in response && response.tenant) {
          tenantData = response.tenant;
        } else {
          tenantData = response as Tenant;
        }
        
        console.log('[TenantContext] Tenant data loaded:', tenantData?.name);
        setCurrentTenant(tenantData);
      } catch (err: any) {
        console.warn('[TenantContext] Tenant API not available, using mock tenant data', err);

        // If API is not available (404), create a mock tenant
        if (err?.response?.status === 404 || err?.code === 'ERR_NETWORK' || err?.message?.includes('Network')) {
          const tenantId = user.tenantId || process.env.NEXT_PUBLIC_TENANT_ID || 'default-tenant';
          const mockTenant: Tenant = {
            id: tenantId,
            name: 'InField Works Services',
            slug: 'infield-works',
            domain: 'infieldworks.com',
            industry: 'Field Service Management',
            size: 'Medium',
            createdAt: new Date().toISOString(),
            active: true
          };
          console.log('[TenantContext] Using mock tenant:', mockTenant.name);
          setCurrentTenant(mockTenant);
          setError(null); // Clear error since we're using mock data
        } else {
          console.error('[TenantContext] Error fetching tenant data:', err);
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
