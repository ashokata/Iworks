import { apiClient } from './client';

// Types - these should eventually come from @fieldsmartpro/shared
export interface Customer {
  id: string;
  tenantId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  altPhone?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  addresses?: CustomerAddress[];
}

export type CustomerType = 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: 'SERVICE' | 'BILLING' | 'BOTH';
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName?: string;
  companyName?: string;
  displayName?: string;
  type?: CustomerType;
  email?: string;
  phone?: string;
  altPhone?: string;
  notes?: string;
  tags?: string[];
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    type?: 'SERVICE' | 'BILLING' | 'BOTH';
  };
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  displayName?: string;
  type?: CustomerType;
  email?: string;
  phone?: string;
  altPhone?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Customer Service - handles all customer-related API calls
 */
export const customerService = {
  /**
   * Get all customers (with optional search)
   */
  async getAllCustomers(search?: string): Promise<Customer[]> {
    const url = search ? `/customers?search=${encodeURIComponent(search)}` : '/customers';
    const response = await apiClient.get<{ customers: Customer[] }>(url);
    return response.customers;
  },

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    const response = await apiClient.get<{ customer: Customer }>(`/customers/${id}`);
    return response.customer;
  },

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<{ customer: Customer }>('/customers', data);
    return response.customer;
  },

  /**
   * Update a customer
   */
  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.put<{ customer: Customer }>(`/customers/${id}`, data);
    return response.customer;
  },

  /**
   * Delete (archive) a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },

  /**
   * Search customers by name, email, or phone
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get<{ customers: Customer[] }>(
      `/customers/search?q=${encodeURIComponent(query)}`
    );
    return response.customers;
  },

  /**
   * Add an address to a customer
   */
  async addAddress(customerId: string, address: Omit<CustomerAddress, 'id' | 'customerId'>): Promise<CustomerAddress> {
    const response = await apiClient.post<{ address: CustomerAddress }>(
      `/customers/${customerId}/addresses`,
      address
    );
    return response.address;
  },

  /**
   * Update a customer address
   */
  async updateAddress(
    customerId: string, 
    addressId: string, 
    address: Partial<CustomerAddress>
  ): Promise<CustomerAddress> {
    const response = await apiClient.put<{ address: CustomerAddress }>(
      `/customers/${customerId}/addresses/${addressId}`,
      address
    );
    return response.address;
  },

  /**
   * Delete a customer address
   */
  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    await apiClient.delete(`/customers/${customerId}/addresses/${addressId}`);
  },

  /**
   * Get customer's job history
   */
  async getCustomerJobs(customerId: string): Promise<any[]> {
    const response = await apiClient.get<{ jobs: any[] }>(`/customers/${customerId}/jobs`);
    return response.jobs;
  },

  /**
   * Get customer's invoices
   */
  async getCustomerInvoices(customerId: string): Promise<any[]> {
    const response = await apiClient.get<{ invoices: any[] }>(`/customers/${customerId}/invoices`);
    return response.invoices;
  },
};

