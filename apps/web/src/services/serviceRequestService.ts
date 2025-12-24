/**
 * Service Request Service - Frontend API Client
 */

import { API_CONFIG } from '@/config/api.config';

const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';

export interface ServiceRequest {
  id: string;
  requestNumber: string | null;
  title: string;
  description: string;
  problemType: string;
  urgency: Urgency;
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdSource: 'WEB' | 'VOICE_AGENT' | 'API';
  voiceCallId: string | null;
  createdAt: string;
  updatedAt: string;
  isServiceAddressSameAsPrimary?: boolean;
  customer: {
    id: string;
    customerNumber: string;
    firstName: string;
    lastName: string;
    mobilePhone: string | null;
    email: string | null;
    verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  };
  serviceAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  assignedTo: {
    id: string;
    employeeNumber: string | null;
    jobTitle: string | null;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  } | null;
  voiceCallLog: {
    vapiCallId: string;
    callerNumber: string;
    duration: number;
    createdAt: string;
  } | null;
}

export interface CreateServiceRequestData {
  customerId: string;
  title: string;
  description: string;
  problemType: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdSource: 'WEB' | 'VOICE_AGENT' | 'API';
  serviceAddressId?: string;
  assignedToId?: string;
  notes?: string;
  isServiceAddressSameAsPrimary?: boolean;
}

export interface ServiceRequestsResponse {
  serviceRequests: ServiceRequest[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const serviceRequestService = {
  list: async (params?: {
    createdSource?: 'VOICE_AGENT' | 'WEB' | 'API';
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ServiceRequestsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.createdSource) queryParams.append('createdSource', params.createdSource);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${API_CONFIG.BASE_URL}/api/service-requests?${queryParams}`;
    console.log('[ServiceRequestService] Fetching:', url);
    console.log('[ServiceRequestService] Tenant ID:', getTenantId());
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        headers: { 
          'x-tenant-id': getTenantId(),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceRequestService] Error response:', response.status, errorText);
        throw new Error(`Failed to fetch service requests: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[ServiceRequestService] Success:', data);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ServiceRequestService] Request timeout');
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      console.error('[ServiceRequestService] Fetch error:', error);
      throw new Error(`Failed to fetch service requests: ${error.message}`);
    }
  },

  getById: async (id: string): Promise<ServiceRequest> => {
    const url = `${API_CONFIG.BASE_URL}/api/service-requests/${id}`;
    console.log('[ServiceRequestService] Fetching by ID:', url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        headers: { 
          'x-tenant-id': getTenantId(),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceRequestService] Error response:', response.status, errorText);
        throw new Error(`Failed to fetch service request: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[ServiceRequestService] Success:', data);
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ServiceRequestService] Request timeout');
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      console.error('[ServiceRequestService] Fetch error:', error);
      throw new Error(`Failed to fetch service request: ${error.message}`);
    }
  },

  create: async (data: CreateServiceRequestData): Promise<ServiceRequest> => {
    const url = `${API_CONFIG.BASE_URL}/api/service-requests`;
    console.log('[ServiceRequestService] Creating:', url, data);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'x-tenant-id': getTenantId(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceRequestService] Error response:', response.status, errorText);
        throw new Error(`Failed to create service request: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[ServiceRequestService] Created:', result);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ServiceRequestService] Request timeout');
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      console.error('[ServiceRequestService] Fetch error:', error);
      throw new Error(`Failed to create service request: ${error.message}`);
    }
  },

  update: async (id: string, data: Partial<ServiceRequest>): Promise<ServiceRequest> => {
    const url = `${API_CONFIG.BASE_URL}/api/service-requests/${id}`;
    console.log('[ServiceRequestService] Updating:', url, data);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 
          'x-tenant-id': getTenantId(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceRequestService] Error response:', response.status, errorText);
        throw new Error(`Failed to update service request: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[ServiceRequestService] Updated:', result);
      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ServiceRequestService] Request timeout');
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      console.error('[ServiceRequestService] Fetch error:', error);
      throw new Error(`Failed to update service request: ${error.message}`);
    }
  },

  delete: async (id: string): Promise<void> => {
    const url = `${API_CONFIG.BASE_URL}/api/service-requests/${id}`;
    console.log('[ServiceRequestService] Deleting:', url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 
          'x-tenant-id': getTenantId(),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ServiceRequestService] Error response:', response.status, errorText);
        throw new Error(`Failed to delete service request: ${response.status} ${errorText}`);
      }
      
      console.log('[ServiceRequestService] Deleted:', id);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ServiceRequestService] Request timeout');
        throw new Error('Request timed out. Please check if the backend server is running.');
      }
      console.error('[ServiceRequestService] Fetch error:', error);
      throw new Error(`Failed to delete service request: ${error.message}`);
    }
  },
};

