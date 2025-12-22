/**
 * Customer Service - PostgreSQL Backend
 * 
 * This service handles all customer-related API calls.
 * Uses the new database types that match the PostgreSQL schema.
 */

import type {
  Customer,
  Address,
  CustomerType,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerFilters,
  PaginatedResponse,
} from '@/types/database.types';

// Import API client to use tenant ID from user session
import { apiClient } from './apiClient';

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
      type: addr.type || 'PRIMARY',
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
      type: 'PRIMARY',
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
  const isContractor = data.isContractor ?? data.is_contractor;
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
  
  // Map fields to ONLY camelCase for backend (PostgreSQL API)
  if (firstName !== undefined && firstName !== '') body.firstName = firstName;
  if (lastName !== undefined && lastName !== '') body.lastName = lastName;
  if (companyName !== undefined && companyName !== '') body.companyName = companyName;
  if (data.email !== undefined && data.email !== '') body.email = data.email;
  if (mobilePhone !== undefined && mobilePhone !== '') body.mobilePhone = mobilePhone;
  if (homePhone !== undefined && homePhone !== '') body.homePhone = homePhone;
  if (workPhone !== undefined && workPhone !== '') body.workPhone = workPhone;
  if (jobTitle !== undefined && jobTitle !== '') body.jobTitle = jobTitle;
  if (isContractor !== undefined) body.isContractor = isContractor;
  if (data.type !== undefined) body.type = data.type?.toUpperCase?.() || data.type;
  if (data.notes !== undefined && data.notes !== '') body.notes = data.notes;
  if (data.preferredContactMethod !== undefined) body.preferredContactMethod = data.preferredContactMethod;
  if (notificationsEnabled !== undefined) body.notificationsEnabled = notificationsEnabled;
  
  // Handle update-specific fields
  if ('doNotService' in data && data.doNotService !== undefined) {
    body.doNotService = data.doNotService;
  }
  if ('doNotServiceReason' in data && data.doNotServiceReason !== undefined) {
    body.doNotServiceReason = data.doNotServiceReason;
  }
  if ('verificationStatus' in data) {
    body.verificationStatus = data.verificationStatus || data.verification_status;
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
  
  // Handle addresses array (for create with multiple addresses)
  if ('addresses' in data && Array.isArray(data.addresses) && data.addresses.length > 0) {
    body.addresses = data.addresses.map((addr: any) => ({
      type: mapAddressTypeToDb(addr.type || addr.addressType),
      name: addr.name,
      street: addr.street,
      streetLine2: addr.streetLine2 || addr.street2,
      city: addr.city,
      state: addr.state,
      zip: addr.zip || addr.zipCode,
      country: addr.country || 'US',
      accessNotes: addr.accessNotes,
      gateCode: addr.gateCode,
      isPrimary: addr.isPrimary
    }));
  }
  
  return body;
};

// Map frontend address type to database type
const mapAddressTypeToDb = (addressType: string | undefined): 'SERVICE' | 'BILLING' | 'PRIMARY' => {
  const typeMap: Record<string, 'SERVICE' | 'BILLING' | 'PRIMARY'> = {
    'Primary': 'PRIMARY',
    'Service': 'SERVICE',
    'Billing': 'BILLING',
    'PRIMARY': 'PRIMARY',
    'SERVICE': 'SERVICE',
    'BILLING': 'BILLING',
  };
  return typeMap[addressType || ''] || 'SERVICE';
};

// Export service interface with methods
export const customerService = {
  /**
   * Get all customers with optional filters
   */
  getAllCustomers: async (filters?: CustomerFilters): Promise<Customer[]> => {
    try {
      console.log('[Customer Service] Fetching customers from PostgreSQL API');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const queryString = params.toString();
      const url = `/customers${queryString ? `?${queryString}` : ''}`;
      
      console.log('[Customer Service] Request URL:', url);
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.get<{ customers: any[]; total: number }>(url);
      console.log('[Customer Service] Received customers:', data.customers?.length || 0);
      
      // Check if we got an error response
      if (!data.customers && (data as any).error) {
        console.error('[Customer Service] API returned error:', (data as any).error);
        throw new Error((data as any).error || 'Failed to fetch customers');
      }
      
      // Transform each customer
      const customers = (data.customers || []).map(transformCustomer);
      console.log('[Customer Service] Transformed customers:', customers.length);
      return customers;
    } catch (error: any) {
      console.error('[Customer Service] Error fetching customers:', error);
      
      // Add more context to the error
      if (error?.response?.status === 400 && error?.response?.data?.error?.includes('Tenant ID')) {
        throw new Error('Session expired or invalid. Please log in again.');
      }
      
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
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const url = `/customers?${params.toString()}`;
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.get<{ customers: any[]; total: number }>(url);
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
      
      // Use API client which automatically includes tenant ID from user session
      try {
        const data = await apiClient.get<{ customer: any } | any>(`/customers/${id}`);
        // Handle { customer: ... } wrapper
        const customerData = (data as any).customer || data;
        return transformCustomer(customerData);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log('[Customer Service] Customer not found');
          return null;
        }
        throw error;
      }
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
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.get<{ customers: any[] }>(`/customers?${params.toString()}`);
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
      console.log('[Customer Service] Input data:', JSON.stringify(customerData, null, 2));
      
      const body = buildRequestBody(customerData);
      console.log('[Customer Service] Request body after buildRequestBody:', JSON.stringify(body, null, 2));
      console.log('[Customer Service] Addresses in body:', body.addresses);
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.post<{ customer: any } | any>('/customers', body);
      console.log('[Customer Service] Customer created successfully');
      
      // Handle { customer: ... } wrapper
      const customerResponse = (data as any).customer || data;
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
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.put<{ customer: any } | any>(`/customers/${id}`, body);
      console.log('[Customer Service] Customer updated successfully');
      
      // Handle { customer: ... } wrapper
      const customerResponse = (data as any).customer || data;
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
      
      // Use API client which automatically includes tenant ID from user session
      await apiClient.delete(`/customers/${id}`);
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
      
      // Map address type to database format
      const addressData = {
        ...address,
        type: mapAddressTypeToDb((address as any).addressType || address.type),
      };
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.post<{ address: any } | any>(`/customers/${customerId}/addresses`, addressData);
      console.log('[Customer Service] Address added successfully');
      return (data as any).address || data;
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
        type: mapAddressTypeToDb(address.addressType || address.type),
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
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.post<{ address: any } | any>(`/customers/${customerId}/addresses`, addressData);
      console.log('[Customer Service] Address added successfully:', data);
      return (data as any).address || data;
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
        type: mapAddressTypeToDb(address.addressType || address.type),
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
      
      // Use API client which automatically includes tenant ID from user session
      const data = await apiClient.put<{ address: any } | any>(`/customers/${customerId}/addresses/${addressId}`, addressData);
      console.log('[Customer Service] Address updated successfully:', data);
      return (data as any).address || data;
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
      
      // Use API client which automatically includes tenant ID from user session
      await apiClient.delete(`/customers/${customerId}/addresses/${addressId}`);
      console.log('[Customer Service] Address deleted successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error deleting address ${addressId}:`, error);
      throw error;
    }
  },
  
  /**
   * Check if email already exists for the tenant
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    try {
      console.log(`[Customer Service] Checking if email exists: ${email}`);
      
      // Use API client which automatically includes tenant ID from user session
      const response = await apiClient.get<{ exists: boolean }>(`/customers/check-email?email=${encodeURIComponent(email)}`);
      console.log(`[Customer Service] Email exists check result:`, response.exists);
      return response.exists;
    } catch (error: any) {
      console.error(`[Customer Service] Error checking email existence:`, error);
      // In case of error, return false to not block the user (backend will catch it anyway)
      return false;
    }
  },
};

// Re-export types for convenience
export type { Customer, Address, CustomerType, CreateCustomerRequest, UpdateCustomerRequest };
