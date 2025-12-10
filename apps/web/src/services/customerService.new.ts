// src/services/customerService.ts - NEW LAMBDA API VERSION
import { API_CONFIG } from '@/config/api.config';

export interface CustomerAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

// Get tenant ID from environment
const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Export service interface with methods
export const customerService = {
  // Get all customers
  getAllCustomers: async (): Promise<Customer[]> => {
    try {
      console.log(`[Customer Service] Fetching customers from Lambda API`);
      console.log(`[Customer Service] API URL:`, API_CONFIG.BASE_URL);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Received customers:', data);
      
      // API returns { customers: [...], pagination: {...} }
      return data.customers || [];
    } catch (error: any) {
      console.error('[Customer Service] Error fetching customers:', error);
      throw error;
    }
  },
  
  // Get a customer by ID
  getCustomerById: async (id: string): Promise<Customer | null> => {
    try {
      console.log(`[Customer Service] Fetching customer ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      return customer;
    } catch (error: any) {
      console.error(`[Customer Service] Error fetching customer ${id}:`, error);
      throw error;
    }
  },
  
  // Search customers
  searchCustomers: async (query: string): Promise<Customer[]> => {
    try {
      console.log(`[Customer Service] Searching customers: "${query}"`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.customers || [];
    } catch (error: any) {
      console.error('[Customer Service] Error searching customers:', error);
      throw error;
    }
  },
  
  // Create a new customer
  createCustomer: async (customerData: CreateCustomerRequest): Promise<Customer> => {
    try {
      console.log('[Customer Service] Creating customer:', customerData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      console.log('[Customer Service] Customer created:', customer);
      return customer;
    } catch (error: any) {
      console.error('[Customer Service] Error creating customer:', error);
      throw error;
    }
  },
  
  // Update a customer
  updateCustomer: async (id: string, customerData: Partial<CreateCustomerRequest>): Promise<Customer> => {
    try {
      console.log(`[Customer Service] Updating customer ${id}:`, customerData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      console.log('[Customer Service] Customer updated:', customer);
      return customer;
    } catch (error: any) {
      console.error(`[Customer Service] Error updating customer ${id}:`, error);
      throw error;
    }
  },
  
  // Delete a customer
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      console.log(`[Customer Service] Deleting customer ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      console.log('[Customer Service] Customer deleted successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error deleting customer ${id}:`, error);
      throw error;
    }
  },
};
