/**
 * API Client - PostgreSQL Backend
 * 
 * Centralized HTTP client for all API calls.
 * Updated to work with the new PostgreSQL backend.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';

class ApiClient {
  private client: AxiosInstance;
  private currentTenantId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: this.getBaseURL(),
      timeout: API_CONFIG.TIMEOUT || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      transformResponse: [function (data) {
        // Custom transform to ensure JSON is properly parsed
        if (typeof data === 'string') {
          const trimmedData = data.trim();

          if (!trimmedData) {
            console.warn('[API Client] Empty response received');
            return null;
          }

          try {
            // Find the last closing brace or bracket to extract valid JSON
            let jsonEndIndex = -1;
            let braceCount = 0;
            let bracketCount = 0;

            for (let i = 0; i < trimmedData.length; i++) {
              if (trimmedData[i] === '{') braceCount++;
              if (trimmedData[i] === '}') braceCount--;
              if (trimmedData[i] === '[') bracketCount++;
              if (trimmedData[i] === ']') bracketCount--;

              if (braceCount === 0 && bracketCount === 0 && (trimmedData[i] === '}' || trimmedData[i] === ']')) {
                jsonEndIndex = i + 1;
                break;
              }
            }

            const validJson = jsonEndIndex > 0 ? trimmedData.substring(0, jsonEndIndex) : trimmedData;
            return JSON.parse(validJson);
          } catch (e) {
            console.warn('[API Client] Failed to parse JSON, returning null');
            console.debug('[API Client] Parse error:', e);
            return null;
          }
        }
        return data;
      }],
    });

    // Request interceptor to add auth token and tenant ID
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant ID - CRITICAL for multi-tenancy
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
          config.headers['x-tenant-id'] = tenantId;
          console.log(`[API Client] 🔐 Sending request to ${config.url} with Tenant ID: ${tenantId}`);
        } else {
          console.warn(`[API Client] ⚠️ No tenant ID available for request to ${config.url}`);
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getBaseURL(): string {
    // Use the configured API base URL or empty string for relative URLs
    return API_CONFIG.BASE_URL || '';
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  
  private getCurrentTenantId(): string | null {
    // PRIORITY 1: Check user data in localStorage first (most authoritative)
    // This ensures we always use the tenant ID from the logged-in user
    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('authUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.tenantId) {
            // Update in-memory cache if different
            if (this.currentTenantId !== user.tenantId) {
              this.currentTenantId = user.tenantId;
              console.log('[API Client] 🔄 Updated tenant ID from user session:', user.tenantId);
            }
            return user.tenantId;
          }
        } catch (error) {
          console.error('[API Client] Error parsing user data:', error);
        }
      }
    }

    // PRIORITY 2: If we've already set the tenant ID in memory, use that
    if (this.currentTenantId) {
      return this.currentTenantId;
    }

    // PRIORITY 3: Try localStorage (set by setTenantId) - but only if no user session
    if (typeof window !== 'undefined') {
      const savedTenantId = localStorage.getItem('currentTenantId');
      if (savedTenantId) {
        this.currentTenantId = savedTenantId;
        return savedTenantId;
      }
    }

    // PRIORITY 4: Try environment variable
    if (process.env.NEXT_PUBLIC_TENANT_ID) {
      return process.env.NEXT_PUBLIC_TENANT_ID;
    }

    // NO DEFAULT FALLBACK - return null to force proper authentication
    console.warn('[API Client] ⚠️ No tenant ID found - user needs to login');
    return null;
  }
  
  setTenantId(tenantId: string | null): void {
    console.log(`[API Client] 🔐 Setting Tenant ID: ${tenantId}`);
    this.currentTenantId = tenantId;

    // Also save to localStorage for persistence
    if (typeof window !== 'undefined' && tenantId) {
      localStorage.setItem('currentTenantId', tenantId);
    }
  }

  private resolveUrl(url: string): string {
    // AI endpoints use Next.js API routes
    if (url.startsWith('/api/ai/')) {
      return url;
    }

    // All other endpoints go to the API
    const baseUrl = API_CONFIG.BASE_URL || '';
    
    // If the URL already includes the base URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Ensure proper URL construction
    if (baseUrl && !url.startsWith('/')) {
      return `${baseUrl}/${url}`;
    }
    
    return baseUrl ? `${baseUrl}${url}` : url;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] GET ${finalUrl}`);
    
    try {
      const response = await this.client.get<T>(finalUrl, config);
      console.log(`[API Client] Response: ${response.status}`);
      return response.data;
    } catch (error: any) {
      // Log expected failures as warnings
      const isExpectedFailure = error?.response?.status === 404;
      if (isExpectedFailure) {
        console.warn(`[API Client] Endpoint not found: ${finalUrl}`);
      } else {
        console.error(`[API Client] GET error: ${finalUrl}`, error?.message);
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] POST ${finalUrl}`);
    console.debug('[API Client] Payload:', JSON.stringify(data, null, 2));

    try {
      const response = await this.client.post<T>(finalUrl, data, config);
      console.log(`[API Client] Response: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] POST error: ${finalUrl}`, error?.message);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] PUT ${finalUrl}`);
    console.debug('[API Client] Payload:', JSON.stringify(data, null, 2));

    try {
      const response = await this.client.put<T>(finalUrl, data, config);
      console.log(`[API Client] Response: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] PUT error: ${finalUrl}`, error?.message);
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] PATCH ${finalUrl}`);
    console.debug('[API Client] Payload:', JSON.stringify(data, null, 2));

    try {
      const response = await this.client.patch<T>(finalUrl, data, config);
      console.log(`[API Client] Response: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] PATCH error: ${finalUrl}`, error?.message);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] DELETE ${finalUrl}`);

    try {
      const response = await this.client.delete<T>(finalUrl, config);
      console.log(`[API Client] Response: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] DELETE error: ${finalUrl}`, error?.message);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
