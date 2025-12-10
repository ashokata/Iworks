import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Job, CreateJobRequest, Tenant } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private currentTenantId: string | null = null;
  private useMockData: boolean = false;

  constructor() {
    this.client = axios.create({
      baseURL: this.getBaseURL(),
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      transformResponse: [function (data) {
        // Custom transform to ensure JSON is properly parsed
        if (typeof data === 'string') {
          // Trim any whitespace
          const trimmedData = data.trim();

          // If data is empty, return null
          if (!trimmedData) {
            console.warn('[Axios Transform] Empty response received');
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

              // When all braces and brackets are closed, we found the JSON end
              if (braceCount === 0 && bracketCount === 0 && (trimmedData[i] === '}' || trimmedData[i] === ']')) {
                jsonEndIndex = i + 1;
                break;
              }
            }

            // Extract only the valid JSON portion
            const validJson = jsonEndIndex > 0 ? trimmedData.substring(0, jsonEndIndex) : trimmedData;

            return JSON.parse(validJson);
          } catch (e) {
            console.warn('[Axios Transform] Failed to parse JSON, returning null');
            console.debug('[Axios Transform] Error:', e);
            console.debug('[Axios Transform] Raw data:', data);
            // Return null for invalid JSON to prevent downstream errors
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
        
        // Add tenant ID
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
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
    // For AI and tenant endpoints, use Next.js API routes directly
    // For other endpoints (Mendix), use the proxy
    return '';  // Empty string means relative URLs from current origin
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
  
  private getCurrentTenantId(): string | null {
    // If we've already set the tenant ID, use that
    if (this.currentTenantId) return this.currentTenantId;
    
    // Otherwise, try to get it from the user data in localStorage
    if (typeof window === 'undefined') return null;
    
    const userJson = localStorage.getItem('authUser');
    if (!userJson) return null;
    
    try {
      const user = JSON.parse(userJson);
      return user.tenantId || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  setTenantId(tenantId: string | null): void {
    this.currentTenantId = tenantId;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);
    console.log(`[API Client] Making API call to: ${finalUrl}`);
    try {
      const response = await this.client.get<T>(finalUrl, config);
      console.log(`[API Client] Response received with status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      // Log 404s as warnings since they're often expected (missing backend endpoints)
      if (error?.response?.status === 404) {
        console.warn(`[API Client] Endpoint not found: ${finalUrl}`);
      } else {
        console.error(`[API Client] Error making GET request to ${finalUrl}:`, error?.message);
      }
      throw error;
    }
  }

  private resolveUrl(url: string): string {
    // AI and tenant endpoints use Next.js API routes directly
    if (url.startsWith('/api/ai/') || url.startsWith('/api/tenants/')) {
      return url;
    }

    // Mendix/OData endpoints use the proxy
    if (url.includes('/Customer') || url.includes('/Job') || url.includes('/Employee') || url.includes('/odata/')) {
      const proxyBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy';
      return `${proxyBase}${url}`;
    }

    // Default: use the URL as-is
    return url;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const finalUrl = this.resolveUrl(url);

    // Special case for Customer API - always use real API
    if (url.includes('/Customer')) {
      console.log(`[API Client] Making real API POST call to: ${finalUrl}`);
      console.log(`[API Client] Request payload:`, JSON.stringify(data, null, 2));
      const response = await this.client.post<T>(finalUrl, data, config);
      console.log(`[API Client] Response:`, JSON.stringify(response.data, null, 2));
      return response.data;
    }
    
    if (this.useMockData) {
      // Handle mock POST operations
      if (url === '/api/jobs' && data) {
        const tenantId = this.getCurrentTenantId() || 'tenant1'; // Default to tenant1 if not set
        
        const newJob: Job = {
          id: Date.now(),
          tenantId,
          title: (data as CreateJobRequest).title,
          status: 'Scheduled',
          assignedTo: (data as CreateJobRequest).assignedTo,
          date: (data as CreateJobRequest).scheduledDate || new Date().toISOString(),
          description: (data as CreateJobRequest).description,
          location: (data as CreateJobRequest).location,
          priority: (data as CreateJobRequest).priority,
          estimatedDuration: (data as CreateJobRequest).estimatedDuration,
        };
        
        // Add a small delay to simulate network
        await new Promise(resolve => setTimeout(resolve, 300));
        return newJob as unknown as T;
      }
      
      // Handle tenant registration
      if (url === '/api/tenants/register' && data) {
        // Generate a unique tenant ID
        const tenantId = `tenant-${Date.now()}`;
        
        const newTenant: Tenant = {
          id: tenantId,
          name: data.company.name,
          slug: data.company.name.toLowerCase().replace(/\s+/g, '-'),
          domain: data.company.domain || `${data.company.name.toLowerCase().replace(/\s+/g, '-')}.windsurf.com`,
          industry: data.company.industry,
          size: data.company.size,
          createdAt: new Date().toISOString(),
          active: true
        };
        
        // In a real app, we would also create an admin user for this tenant
        // and establish proper authentication
        
        // Add a delay to simulate network
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { 
          tenant: newTenant,
          success: true,
          message: 'Tenant successfully registered'
        } as unknown as T;
      }
    }
    
    // Log all POST requests for debugging
    console.log('[API Client] POST request:', {
      url: finalUrl,
      data: JSON.stringify(data, null, 2),
      headers: config?.headers
    });

    const response = await this.client.post<T>(finalUrl, data, config);
    console.log('[API Client] POST response:', response.status, response.data);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Special case for Customer API - always use real API
    if (url.includes('/Customer')) {
      console.log(`[API Client] Making real API PUT call to: ${url}`);
      console.log(`[API Client] Request payload:`, JSON.stringify(data, null, 2));
      const response = await this.client.put<T>(url, data, config);
      console.log(`[API Client] Response:`, JSON.stringify(response.data, null, 2));
      return response.data;
    }
    
    if (this.useMockData) {
      // Handle mock PUT operations
      if (url.startsWith('/api/jobs/') && data) {
        // Add a small delay to simulate network
        await new Promise(resolve => setTimeout(resolve, 300));
        return data as T;
      }
    }
    
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log(`[API Client] Making PATCH request to: ${url}`);
    console.log(`[API Client] PATCH payload:`, JSON.stringify(data, null, 2));
    
    try {
      const response = await this.client.patch<T>(url, data, config);
      console.log('[API Client] PATCH response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[API Client] Error making PATCH request to ${url}:`, error?.message);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // Special case for Customer API - always use real API
    if (url.includes('/Customer')) {
      console.log(`[API Client] Making real API DELETE call to: ${url}`);
      const response = await this.client.delete<T>(url, config);
      console.log(`[API Client] Delete operation completed with status: ${response.status}`);
      return response.data;
    }
    
    if (this.useMockData) {
      // Handle mock DELETE operations
      if (url.startsWith('/api/jobs/')) {
        // Add a small delay to simulate network
        await new Promise(resolve => setTimeout(resolve, 300));
        return { success: true } as unknown as T;
      }
    }
    
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
