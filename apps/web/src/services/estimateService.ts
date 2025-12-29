/**
 * Estimate Service - Frontend API Client
 */

import { API_CONFIG } from '@/config/api.config';

const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

export interface EstimateLineItem {
  id: string;
  type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OTHER';
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isTaxable: boolean;
  isOptional: boolean;
  isSelected: boolean;
  sortOrder: number;
}

export interface EstimateOption {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isRecommended: boolean;
  subtotal: number;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  sortOrder: number;
  lineItems: EstimateLineItem[];
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
  title: string | null;
  message: string | null;
  termsAndConditions: string | null;
  validUntil: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  approvedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
    mobilePhone: string | null;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  options: EstimateOption[];
}

export interface CreateEstimateData {
  customerId: string;
  addressId: string;
  title?: string;
  message?: string;
  termsAndConditions?: string;
  validUntil?: string;
  status?: 'DRAFT' | 'SENT';
  taxRate?: number;
  options: Array<{
    name: string;
    description?: string;
    isRecommended?: boolean;
    discountType?: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    sortOrder: number;
    lineItems: Array<{
      type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OTHER';
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
      isTaxable?: boolean;
      isOptional?: boolean;
      isSelected?: boolean;
      sortOrder: number;
    }>;
  }>;
}

export interface UpdateEstimateData {
  title?: string;
  message?: string;
  termsAndConditions?: string;
  validUntil?: string;
  status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'DECLINED' | 'EXPIRED';
  options?: Array<{
    id?: string;
    name: string;
    description?: string;
    isRecommended?: boolean;
    discountType?: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue?: number;
    sortOrder: number;
    lineItems: Array<{
      id?: string;
      type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OTHER';
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      unitCost?: number;
      isTaxable?: boolean;
      isOptional?: boolean;
      isSelected?: boolean;
      sortOrder: number;
    }>;
  }>;
}

export const estimateService = {
  list: async (): Promise<Estimate[]> => {
    const url = `${API_CONFIG.BASE_URL}/api/estimates`;
    console.log('[EstimateService] Fetching list:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch estimates' }));
      throw new Error(error.error || `Failed to fetch estimates: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EstimateService] Received:', data.length, 'estimates');
    return data;
  },

  getById: async (id: string): Promise<Estimate> => {
    const url = `${API_CONFIG.BASE_URL}/api/estimates/${id}`;
    console.log('[EstimateService] Fetching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch estimate' }));
      throw new Error(error.error || `Failed to fetch estimate: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[EstimateService] Received:', data);
    return data;
  },

  create: async (data: CreateEstimateData): Promise<Estimate> => {
    const url = `${API_CONFIG.BASE_URL}/api/estimates`;
    console.log('[EstimateService] Creating estimate with URL:', url);
    console.log('[EstimateService] API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
    console.log('[EstimateService] Data:', JSON.stringify(data, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('[EstimateService] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EstimateService] Error response:', errorText);
      
      let errorMessage = 'Failed to create estimate';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || `${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[EstimateService] Created:', result);
    return result;
  },

  update: async (id: string, data: UpdateEstimateData): Promise<Estimate> => {
    const url = `${API_CONFIG.BASE_URL}/api/estimates/${id}`;
    console.log('[EstimateService] Updating estimate:', id, data);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('[EstimateService] Update response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EstimateService] Update error response:', errorText);
      
      let errorMessage = 'Failed to update estimate';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || `${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('[EstimateService] Updated:', result);
    return result;
  },

  delete: async (id: string): Promise<void> => {
    const url = `${API_CONFIG.BASE_URL}/api/estimates/${id}`;
    console.log('[EstimateService] Deleting estimate:', id);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete estimate' }));
      throw new Error(error.error || `Failed to delete estimate: ${response.statusText}`);
    }

    console.log('[EstimateService] Deleted:', id);
  },

  send: async (id: string): Promise<Estimate> => {
    return estimateService.update(id, { status: 'SENT' });
  },

  approve: async (id: string): Promise<Estimate> => {
    return estimateService.update(id, { status: 'APPROVED' });
  },

  decline: async (id: string): Promise<Estimate> => {
    return estimateService.update(id, { status: 'DECLINED' });
  },
};
