import { apiClient } from './client';

export interface Customer {
  id: string;
  customerNumber?: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  workPhone?: string;
  notes?: string;
  addresses?: Address[];
  createdAt?: string;
}

export interface Address {
  id: string;
  type: 'SERVICE' | 'BILLING' | 'PRIMARY';
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  isPrimary?: boolean;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
}

export const customerService = {
  /**
   * Get all customers for tenant
   */
  async getCustomers(params?: { 
    search?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const query = queryParams.toString();
    const url = `/customers${query ? `?${query}` : ''}`;
    
    const response = await apiClient.get<any>(url);
    // API returns array directly, wrap it
    if (Array.isArray(response)) {
      return { customers: response, total: response.length };
    }
    return response;
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  /**
   * Create new customer
   */
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return apiClient.post<Customer>('/customers', data);
  },

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiClient.put<Customer>(`/customers/${id}`, data);
  },

  /**
   * Get customer display name
   */
  getDisplayName(customer: Customer): string {
    if (customer.companyName) return customer.companyName;
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  },
};
