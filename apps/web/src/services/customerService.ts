/**
 * Customer Service - PostgreSQL Backend
 * 
 * This service handles all customer-related API calls.
 * Uses the new database types that match the PostgreSQL schema.
 */

import { API_CONFIG } from '@/config/api.config';
import type {
  Customer,
  Address,
  CustomerType,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  PaginatedResponse,
} from '@/types/database.types';

// Get tenant ID from environment
const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Transform API response to frontend Customer type
const transformCustomer = (apiCustomer: any): Customer => {
  const firstName = apiCustomer.firstName || apiCustomer.first_name || '';
  const lastName = apiCustomer.lastName || apiCustomer.last_name || '';
  const companyName = apiCustomer.companyName || apiCustomer.company_name || apiCustomer.company || '';
  const mobilePhone = apiCustomer.mobilePhone || apiCustomer.mobile_number || apiCustomer.phone || '';
  const homePhone = apiCustomer.homePhone || apiCustomer.home_number || '';
  const workPhone = apiCustomer.workPhone || apiCustomer.work_number || '';
  const displayName = apiCustomer.display_name || apiCustomer.displayName || companyName || `${firstName} ${lastName}`.trim() || 'Unknown';
  const createdAt = apiCustomer.createdAt || apiCustomer.created_at || new Date().toISOString();
  const updatedAt = apiCustomer.updatedAt || apiCustomer.updated_at || new Date().toISOString();
  const isArchived = apiCustomer.isArchived ?? apiCustomer.archived ?? false;
  
  return {
    id: apiCustomer.id || apiCustomer.customerId,
    tenantId: apiCustomer.tenantId,
    customerNumber: apiCustomer.customerNumber || apiCustomer.customer_number,
    type: (apiCustomer.type || 'RESIDENTIAL').toUpperCase() as CustomerType,
    firstName,
    lastName,
    companyName,
    displayName,
    email: apiCustomer.email || '',
    mobilePhone,
    homePhone,
    workPhone,
    preferredContactMethod: apiCustomer.preferredContactMethod || 'SMS',
    notificationsEnabled: apiCustomer.notificationsEnabled ?? true,
    doNotService: apiCustomer.doNotService ?? false,
    doNotServiceReason: apiCustomer.doNotServiceReason,
    leadSourceId: apiCustomer.leadSourceId,
    referredByCustomerId: apiCustomer.referredByCustomerId,
    lifetimeValue: apiCustomer.lifetimeValue || 0,
    totalJobs: apiCustomer.totalJobs || 0,
    notes: apiCustomer.notes || '',
    customFields: apiCustomer.customFields || {},
    isArchived,
    archivedAt: apiCustomer.archivedAt,
    createdById: apiCustomer.createdById,
    addresses: transformAddresses(apiCustomer.addresses || apiCustomer.address),
    tags: apiCustomer.tags || [],
    createdAt,
    updatedAt,
    verificationStatus: apiCustomer.verificationStatus || apiCustomer.verification_status || 'VERIFIED',
    createdSource: apiCustomer.createdSource || apiCustomer.created_source || 'WEB',
    // Snake_case aliases for backward compatibility
    display_name: displayName,
    first_name: firstName,
    last_name: lastName,
    mobile_number: mobilePhone,
    home_number: homePhone,
    work_number: workPhone,
    company: companyName,
    archived: isArchived,
    created_at: createdAt,
    updated_at: updatedAt,
    verification_status: apiCustomer.verificationStatus || apiCustomer.verification_status || 'VERIFIED',
    created_source: apiCustomer.createdSource || apiCustomer.created_source || 'WEB',
  };
};

// Transform addresses from various formats
const transformAddresses = (addressData: any): Address[] => {
  if (!addressData) return [];
  
  // If it's an array of addresses
  if (Array.isArray(addressData)) {
    return addressData.map((addr: any) => ({
      id: addr.id || `addr-${Date.now()}`,
      customerId: addr.customerId || '',
      type: addr.type || 'BOTH',
      name: addr.name,
      street: addr.street || addr.address || '',
      streetLine2: addr.streetLine2 || addr.street2 || addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || addr.zipCode || '',
      country: addr.country || 'US',
      latitude: addr.latitude,
      longitude: addr.longitude,
      timezone: addr.timezone,
      accessNotes: addr.accessNotes,
      gateCode: addr.gateCode,
      isPrimary: addr.isPrimary ?? true,
      isVerified: addr.isVerified ?? false,
      createdAt: addr.createdAt || new Date().toISOString(),
      updatedAt: addr.updatedAt || new Date().toISOString(),
    }));
  }
  
  // If it's a single address string (legacy format)
  if (typeof addressData === 'string') {
    return [{
      id: `addr-legacy-${Date.now()}`,
      customerId: '',
      type: 'BOTH',
      street: addressData,
      streetLine2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      isPrimary: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }];
  }
  
  // If it's a nested object with data array (old format)
  if (addressData.data && Array.isArray(addressData.data)) {
    return transformAddresses(addressData.data);
  }
  
  return [];
};

// Build request body for create/update
// Accepts both camelCase and snake_case input for flexibility
const buildRequestBody = (data: any): Record<string, any> => {
  const body: Record<string, any> = {};
  
  // Extract values from either camelCase or snake_case input
  let firstName = data.firstName || data.first_name;
  let lastName = data.lastName || data.last_name;
  const displayName = data.displayName || data.display_name;
  const companyName = data.companyName || data.company_name || data.company;
  const mobilePhone = data.mobilePhone || data.mobile_number || data.phone;
  const homePhone = data.homePhone || data.home_number;
  const workPhone = data.workPhone || data.work_number;
  const jobTitle = data.jobTitle || data.job_title;
  const isContractor = data.isContractor || data.is_contractor;
  const notificationsEnabled = data.notificationsEnabled ?? data.notifications_enabled;
  
  // If display_name is provided but firstName/lastName are not, split display_name
  if (displayName && !firstName && !lastName) {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = displayName;
    }
  }
  
  // Map fields to both camelCase and snake_case for backend compatibility
  if (firstName !== undefined) {
    body.firstName = firstName;
    body.first_name = firstName;
  }
  if (lastName !== undefined) {
    body.lastName = lastName;
    body.last_name = lastName;
  }
  if (displayName !== undefined) {
    body.display_name = displayName;
    body.displayName = displayName;
  }
  if (companyName !== undefined) {
    body.companyName = companyName;
    body.company_name = companyName;
    body.company = companyName;
  }
  if (data.email !== undefined) body.email = data.email;
  if (mobilePhone !== undefined) {
    body.mobilePhone = mobilePhone;
    body.mobile_number = mobilePhone;
    body.phone = mobilePhone;
  }
  if (homePhone !== undefined) {
    body.homePhone = homePhone;
    body.home_number = homePhone;
  }
  if (workPhone !== undefined) {
    body.workPhone = workPhone;
    body.work_number = workPhone;
  }
  if (jobTitle !== undefined) body.jobTitle = jobTitle;
  if (isContractor !== undefined) body.isContractor = isContractor;
  if (data.type !== undefined) body.type = data.type?.toUpperCase?.() || data.type;
  if (data.notes !== undefined) body.notes = data.notes;
  if (data.preferredContactMethod !== undefined) body.preferredContactMethod = data.preferredContactMethod;
  if (notificationsEnabled !== undefined) {
    body.notificationsEnabled = notificationsEnabled;
    body.notifications_enabled = notificationsEnabled;
  }
  
  // Handle update-specific fields
  if ('doNotService' in data && data.doNotService !== undefined) {
    body.doNotService = data.doNotService;
  }
  if ('doNotServiceReason' in data && data.doNotServiceReason !== undefined) {
    body.doNotServiceReason = data.doNotServiceReason;
  }
  if ('verificationStatus' in data && data.verificationStatus !== undefined) {
    body.verificationStatus = data.verificationStatus;
    body.verification_status = data.verificationStatus;
  }
  
  // Handle address fields (for create)
  if ('street' in data && data.street) {
    body.street = data.street;
    body.address = data.street;
  }
  if ('streetLine2' in data) body.streetLine2 = data.streetLine2;
  if ('city' in data) body.city = data.city;
  if ('state' in data) body.state = data.state;
  if ('zip' in data) {
    body.zip = data.zip;
    body.zipCode = data.zip;
  }
  if ('country' in data) body.country = data.country;
  
  return body;
};

// Export service interface with methods
export const customerService = {
  /**
   * Get all customers with optional filters
   */
  getAllCustomers: async (filters?: CustomerFilters): Promise<Customer[]> => {
    try {
      const tenantId = getTenantId();
      console.log('[Customer Service] Fetching customers from PostgreSQL API');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/customers${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Received customers:', data.customers?.length || 0);
      
      // Transform each customer
      const customers = (data.customers || []).map(transformCustomer);
      return customers;
    } catch (error: any) {
      console.error('[Customer Service] Error fetching customers:', error);
      throw error;
    }
  },
  
  /**
   * Get paginated customers
   */
  getCustomersPaginated: async (
    limit: number = 50,
    offset: number = 0,
    filters?: CustomerFilters
  ): Promise<PaginatedResponse<Customer>> => {
    try {
      const tenantId = getTenantId();
      
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const url = `${API_CONFIG.BASE_URL}/customers?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const customers = (data.customers || []).map(transformCustomer);
      
      return {
        data: customers,
        total: data.total || customers.length,
        limit,
        offset,
        hasMore: offset + customers.length < (data.total || customers.length),
      };
    } catch (error: any) {
      console.error('[Customer Service] Error fetching paginated customers:', error);
      throw error;
    }
  },
  
  /**
   * Get a customer by ID
   */
  getCustomerById: async (id: string): Promise<Customer | null> => {
    try {
      console.log(`[Customer Service] Fetching customer: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (response.status === 404) {
        console.log('[Customer Service] Customer not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle { customer: ... } wrapper
      const customerData = data.customer || data;
      return transformCustomer(customerData);
    } catch (error: any) {
      console.error(`[Customer Service] Error fetching customer ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Search customers by query
   */
  searchCustomers: async (query: string, limit: number = 20): Promise<Customer[]> => {
    try {
      console.log(`[Customer Service] Searching customers: "${query}"`);
      
      const params = new URLSearchParams();
      params.append('search', query);
      params.append('limit', limit.toString());
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers?${params.toString()}`, {
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
      return (data.customers || []).map(transformCustomer);
    } catch (error: any) {
      console.error('[Customer Service] Error searching customers:', error);
      throw error;
    }
  },
  
  /**
   * Create a new customer
   */
  createCustomer: async (customerData: CreateCustomerRequest): Promise<Customer> => {
    try {
      console.log('[Customer Service] Creating customer');
      
      const body = buildRequestBody(customerData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Customer created successfully');
      
      // Handle { customer: ... } wrapper
      const customerResponse = data.customer || data;
      return transformCustomer(customerResponse);
    } catch (error: any) {
      console.error('[Customer Service] Error creating customer:', error);
      throw error;
    }
  },
  
  /**
   * Update a customer
   */
  updateCustomer: async (id: string, customerData: UpdateCustomerRequest): Promise<Customer> => {
    try {
      console.log(`[Customer Service] Updating customer: ${id}`, customerData);
      
      const body = buildRequestBody(customerData);
      console.log(`[Customer Service] Request body:`, body);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Customer updated successfully');
      
      // Handle { customer: ... } wrapper
      const customerResponse = data.customer || data;
      return transformCustomer(customerResponse);
    } catch (error: any) {
      console.error(`[Customer Service] Error updating customer ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete (archive) a customer
   */
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      console.log(`[Customer Service] Archiving customer: ${id}`);
      
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

      console.log('[Customer Service] Customer archived successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error archiving customer ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add an address to a customer
   */
  addAddress: async (customerId: string, address: Partial<Address>): Promise<Address> => {
    try {
      console.log(`[Customer Service] Adding address to customer: ${customerId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Address added successfully');
      return data.address || data;
    } catch (error: any) {
      console.error(`[Customer Service] Error adding address:`, error);
      throw error;
    }
  },
  
  /**
   * Add an address to a customer (alias for edit page compatibility)
   */
  addCustomerAddress: async (customerId: string, address: any): Promise<Address> => {
    try {
      console.log(`[Customer Service] Adding address to customer: ${customerId}`, address);
      
      // Map frontend address format to backend
      const addressData = {
        type: address.addressType || address.type || 'SERVICE',
        name: address.name,
        street: address.street,
        streetLine2: address.streetLine2 || address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip || address.zipCode,
        country: address.country || 'US',
        accessNotes: address.accessNotes,
        gateCode: address.gateCode,
        isPrimary: address.isPrimary ?? false,
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Address added successfully:', data);
      return data.address || data;
    } catch (error: any) {
      console.error(`[Customer Service] Error adding address:`, error);
      throw error;
    }
  },
  
  /**
   * Update an address for a customer
   */
  updateCustomerAddress: async (customerId: string, addressId: string, address: any): Promise<Address> => {
    try {
      console.log(`[Customer Service] Updating address ${addressId} for customer: ${customerId}`, address);
      
      // Map frontend address format to backend
      const addressData = {
        type: address.addressType || address.type,
        name: address.name,
        street: address.street,
        streetLine2: address.streetLine2 || address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip || address.zipCode,
        country: address.country,
        accessNotes: address.accessNotes,
        gateCode: address.gateCode,
        isPrimary: address.isPrimary,
      };
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${customerId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(addressData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Address updated successfully:', data);
      return data.address || data;
    } catch (error: any) {
      console.error(`[Customer Service] Error updating address ${addressId}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete an address from a customer
   */
  deleteCustomerAddress: async (customerId: string, addressId: string): Promise<void> => {
    try {
      console.log(`[Customer Service] Deleting address ${addressId} for customer: ${customerId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${customerId}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      console.log('[Customer Service] Address deleted successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error deleting address ${addressId}:`, error);
      throw error;
    }
  },
};

// Re-export types for convenience
export type { Customer, Address, CustomerType, CreateCustomerRequest, UpdateCustomerRequest };
