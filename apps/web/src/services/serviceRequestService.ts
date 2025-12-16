/**
 * Service Request Service - Frontend API Client
 */

import { API_CONFIG } from '@/config/api.config';

const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

export interface ServiceRequest {
  id: string;
  requestNumber: string | null;
  title: string;
  description: string;
  problemType: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdSource: 'WEB' | 'VOICE_AGENT' | 'API';
  voiceCallId: string | null;
  createdAt: string;
  updatedAt: string;
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
};

