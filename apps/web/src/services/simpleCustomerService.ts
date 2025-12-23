// src/services/simpleCustomerService.ts
import { apiClient } from './apiClient';
import { transformCustomerFromApi, transformCustomerToApi } from '@/config/apiSchemas/customer.schema';
import { extractODataResponse } from '@/config/apiSchemas/utils';

// Import API configuration
import { API_CONFIG } from '@/config/api.config';

export interface CustomerAddress {
  id: string | number;  // Converted to integer from OData string
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Customer {
  object: string;
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  billable_email: string | null;
  billable_name: string;
  billable_phone_number: string | null;
  display_name: string;
  mobile_number: string | null;
  home_number: string | null;
  work_number: string | null;
  company: string | null;
  job_title: string | null;
  notes: string | null;
  notifications_enabled: boolean;
  archived: boolean;
  parent_customer_id: string | null;
  tags: {
    object: string;
    data: string[];
    url: string;
  };
  url: string;
  type: 'homeowner' | 'business';
  is_contractor: boolean;
  addresses: {
    object: string;
    data: CustomerAddress[];
    url: string;
  };
  has_improved_card_on_file: boolean;
  do_not_service: boolean;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name?: string;
  email?: string;
  billable_email?: string;
  billable_name?: string;
  billable_phone_number?: string;
  mobile_number?: string;
  home_number?: string;
  work_number?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  type?: 'homeowner' | 'business';
  is_contractor?: boolean;
  addresses?: Omit<CustomerAddress, 'id'>[];
}

// Transformation function to convert our Customer format to API format (for updates)
const transformCustomerToApiFormat = (customer: Partial<Customer>, includeId: boolean = false): any => {
  const data: any = {
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    billableEmail: customer.billable_email,
    billableName: customer.billable_name,
    billablePhoneNumber: customer.billable_phone_number,
    displayName: customer.display_name,
    mobileNumber: customer.mobile_number,
    homeNumber: customer.home_number,
    workNumber: customer.work_number,
    company: customer.company,
    jobTitle: customer.job_title,
    notes: customer.notes,
    notificationsEnabled: customer.notifications_enabled,
    archived: customer.archived,
    parentCustomerId: customer.parent_customer_id,
    tags: customer.tags?.data,
    type: customer.type,
    isContractor: customer.is_contractor,
    addresses: customer.addresses?.data?.map(addr => ({
      id: addr.id,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.zipCode
    })),
    hasImprovedCardOnFile: customer.has_improved_card_on_file,
    doNotService: customer.do_not_service
  };
  
  // Only include id for operations that need it (not for create/update)
  if (includeId && customer.id) {
    data.id = customer.id;
  }
  
  return data;
};

// Transformation function to convert OData API response to Customer interface
const transformApiCustomerToCustomer = (apiCustomer: any): Customer => {
  const baseCustomer = transformCustomerFromApi(apiCustomer);
  
  const addresses = baseCustomer.addresses?.map((addr: any) => ({
    id: addr.id,
    street: addr.street,
    city: addr.city,
    state: addr.state,
    zipCode: addr.zipCode
  })) || [];
  
  // Then, convert to Customer format
  return {
    object: "customer",
    id: baseCustomer.id || `cus_${Date.now()}`,
    created_at: baseCustomer.createdAt || new Date().toISOString(),
    updated_at: baseCustomer.updatedAt || new Date().toISOString(),
    first_name: baseCustomer.firstName || "",
    last_name: baseCustomer.lastName || null,
    email: baseCustomer.email || null,
    billable_email: baseCustomer.billableEmail || null,
    billable_name: baseCustomer.billableName || "",
    billable_phone_number: baseCustomer.billablePhoneNumber || null,
    display_name: baseCustomer.displayName || `${baseCustomer.firstName || ""} ${baseCustomer.lastName || ""}`.trim(),
    mobile_number: baseCustomer.mobileNumber || null,
    home_number: baseCustomer.homeNumber || null,
    work_number: baseCustomer.workNumber || null,
    company: baseCustomer.company || null,
    job_title: baseCustomer.jobTitle || null,
    notes: baseCustomer.notes || null,
    notifications_enabled: baseCustomer.notificationEnabled !== undefined ? baseCustomer.notificationEnabled : true,
    archived: baseCustomer.archived !== undefined ? baseCustomer.archived : false,
    parent_customer_id: null,
    tags: {
      object: "list",
      data: [],
      url: `/customer/${baseCustomer.id}/tags`
    },
    url: `/customers/${baseCustomer.id}`,
    type: baseCustomer.isContractor ? 'business' : 'homeowner',
    is_contractor: baseCustomer.isContractor !== undefined ? baseCustomer.isContractor : false,
    addresses: {
      object: "list",
      data: addresses,
      url: `/customers/${baseCustomer.id}/addresses`
    },
    has_improved_card_on_file: baseCustomer.hasImprovedCardOnFile !== undefined ? baseCustomer.hasImprovedCardOnFile : false,
    do_not_service: baseCustomer.doNotService !== undefined ? baseCustomer.doNotService : false
  };
};

// Export service interface with methods
export const simpleCustomerService = {
  // Get all customers
  getAllCustomers: async (): Promise<Customer[]> => {
    try {
      console.log(`[Customer Service] ========== FETCHING CUSTOMERS ==========`);
      console.log(`[Customer Service] Base URL:`, process.env.NEXT_PUBLIC_API_BASE_URL || 'not set');
      console.log(`[Customer Service] Full endpoint: /odata/iworks/v1/Customers?$filter=IsActive eq true&$expand=CustomerAddresses`);
      
      const response = await apiClient.get<any>(`/odata/iworks/v1/Customers?$filter=IsActive eq true&$expand=CustomerAddresses`);
      console.log('[Customer Service] ========== RAW RESPONSE ==========');
      console.log('[Customer Service] Raw response:', response);
      console.log('[Customer Service] Response type:', typeof response);
      console.log('[Customer Service] Is array:', Array.isArray(response));
      console.log('[Customer Service] Has @odata.context:', response?.['@odata.context'] !== undefined);
      console.log('[Customer Service] Has value property:', response?.value !== undefined);
      console.log('[Customer Service] Value is array:', Array.isArray(response?.value));
      console.log('[Customer Service] Value length:', Array.isArray(response?.value) ? response.value.length : 'N/A');
      
      if (response?.value && Array.isArray(response.value) && response.value.length > 0) {
        console.log('[Customer Service] First item in value array:', response.value[0]);
      }
      
      const extractedCustomers = extractODataResponse(response);
      console.log(`[Customer Service] ========== EXTRACTED CUSTOMERS ==========`);
      console.log(`[Customer Service] Extracted count:`, extractedCustomers.length);
      if (extractedCustomers.length > 0) {
        console.log(`[Customer Service] First extracted customer:`, extractedCustomers[0]);
      }
      
      const customers: Customer[] = extractedCustomers.map(transformApiCustomerToCustomer);
      console.log('[Customer Service] ========== TRANSFORMED CUSTOMERS ==========');
      console.log('[Customer Service] Transformed count:', customers.length);
      if (customers.length > 0) {
        console.log('[Customer Service] First transformed customer:', customers[0]);
      }
      
      return customers;
    } catch (error: any) {
      console.error('[Customer Service] ===== ERROR DETAILS =====');
      console.error('[Customer Service] Error fetching customers:', error);
      console.error('[Customer Service] Error message:', error?.message);
      throw error;
    }
  },
  
  // Get a customer by ID - Uses bulk data since single customer API doesn't exist yet
  getCustomerById: async (id: string): Promise<Customer | null> => {
    try {
      console.log(`[API Debug] Fetching customer with ID ${id} using OData API with addresses`);
      
      // Call the OData API with $expand to include addresses
      const response = await apiClient.get<any>(`/odata/iworks/v1/Customers?$filter=IsActive eq true&$expand=CustomerAddresses`);
      console.log(`[API Debug] Retrieved raw OData response for filtering by ID: ${id}`);
      
      let allCustomers: Customer[] = [];
      
      // Process the response same way as getAllCustomers
      if (response && response['@odata.context'] && Array.isArray(response.value)) {
        console.log(`[API Debug] OData format detected, processing ${response.value.length} customers`);
        allCustomers = response.value.map((apiCustomer: any) => transformApiCustomerToCustomer(apiCustomer));
      } else if (Array.isArray(response)) {
        allCustomers = response.map((apiCustomer: any) => transformApiCustomerToCustomer(apiCustomer));
      } else if (response && Array.isArray(response.data)) {
        allCustomers = response.data.map((apiCustomer: any) => transformApiCustomerToCustomer(apiCustomer));
      } else if (response && typeof response === 'object') {
        allCustomers = [transformApiCustomerToCustomer(response)];
      }
      
      console.log(`[API Debug] Processed ${allCustomers.length} customers, searching for ID: ${id}`);
      
      // Log all customer IDs for debugging
      console.log(`[API Debug] Available customer IDs:`, allCustomers.map(c => c.id));
      
      // Find the customer by ID - handle both string and number comparison
      const customer = allCustomers.find(c => {
        // Convert both to strings for comparison to handle type mismatches
        const customerId = String(c.id);
        const searchId = String(id);
        return customerId === searchId;
      });
      
      if (customer) {
        console.log(`[API Debug] Found customer: ${customer.display_name} (${customer.email})`);
        return customer;
      } else {
        console.warn(`[API Debug] Customer with ID ${id} not found`);
        console.warn(`[API Debug] Available IDs were:`, allCustomers.map(c => `${c.id} (${typeof c.id})`));
        return null;
      }
    } catch (error: any) {
      console.error(`[API Debug] Error fetching customer with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete (archive) a customer
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      console.log(`[API Debug] Attempting to delete customer with ID: ${id}`);
      console.log(`[API Debug] DELETE URL: /odata/iworks/v1/Customers('${id}')`);
      
      // Try HTTP Method Override workaround for OData servers that block DELETE
      try {
        await apiClient.post(`/odata/iworks/v1/Customers('${id}')`, null, {
          headers: {
            'X-HTTP-Method': 'DELETE',
            'X-HTTP-Method-Override': 'DELETE'
          }
        });
        console.log(`[API Debug] Customer deleted successfully using POST override`);
      } catch (overrideError: any) {
        console.log(`[API Debug] POST override failed, trying PATCH to archive`);
        
        // If DELETE is not allowed, use PATCH to mark as inactive (soft delete)
        try {
          await apiClient.put(`/odata/iworks/v1/Customers('${id}')`, {
            isActive: false,
            IsActive: false // Try both camelCase and PascalCase
          });
          console.log(`[API Debug] Customer archived successfully (set isActive=false)`);
        } catch (patchError: any) {
          // Last resort: try direct DELETE
          console.log(`[API Debug] PATCH failed, trying direct DELETE`);
          await apiClient.delete(`/odata/iworks/v1/Customers('${id}')`);
          console.log(`[API Debug] Customer deleted successfully using DELETE`);
        }
      }
    } catch (error: any) {
      console.error(`[API Debug] Error deleting customer with ID ${id}:`, error);
      
      if (error?.response) {
        console.error('[API Debug] Delete error response status:', error.response.status);
        console.error('[API Debug] Delete error response data:', error.response.data);
      } else if (error?.request) {
        console.error('[API Debug] No response received from DELETE request');
      } else {
        console.error('[API Debug] Delete error message:', error?.message);
      }
      
      throw error;
    }
  },
  
  // Update a customer
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      console.log(`[API Debug] Updating customer with ID: ${id}`);
      console.log(`[API Debug] Update data:`, customerData);
      
      // Transform Customer format to API format (without id in payload)
      const apiCustomerData = transformCustomerToApiFormat(customerData, false);
      
      console.log(`[API Debug] Transformed API data for update:`, JSON.stringify(apiCustomerData, null, 2));
      console.log(`[API Debug] PUT URL: /odata/iworks/v1/Customers('${id}')`);
      
      // Send update request to API
      const response = await apiClient.put<any>(`/odata/iworks/v1/Customers('${id}')`, apiCustomerData);
      
      console.log(`[API Debug] Update response:`, response.data);
      
      // Return the updated customer in our format
      return transformApiCustomerToCustomer(response.data);
    } catch (error: any) {
      console.error(`[API Debug] Error updating customer with ID ${id}:`, error);
      
      if (error?.response) {
        console.error('[API Debug] Update error response status:', error.response.status);
        console.error('[API Debug] Update error response data:', error.response.data);
      } else if (error?.request) {
        console.error('[API Debug] No response received from UPDATE request');
      } else {
        console.error('[API Debug] Update error message:', error?.message);
      }
      
      throw error;
    }
  },
  
  // Add an address to a customer
  addCustomerAddress: async (id: string, address: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> => {
    try {
      // Send address to API
      const response = await apiClient.post<any>(`/odata/iworks/v1/Customers('${id}')/addresses`, address);
      
      // Return the new address with ID from API
      return {
        id: response.data.id || `addr_${Date.now()}`,
        street: response.data.street || address.street,
        city: response.data.city || address.city,
        state: response.data.state || address.state,
        zipCode: response.data.zipCode || response.data.postalCode || address.zipCode
      };
    } catch (error) {
      console.error(`Error adding address to customer with ID ${id} in API:`, error);
      throw error;
    }
  },
  
  // Create a new customer
  createCustomer: async (customerData: CreateCustomerRequest): Promise<Customer> => {
    try {
      // Transform customer data to API format
      const apiCustomerData = {
        firstName: customerData.first_name,
        lastName: customerData.last_name || null,
        email: customerData.email || null,
        billableEmail: customerData.billable_email || customerData.email || null,
        billableName: customerData.billable_name || `${customerData.first_name} ${customerData.last_name || ''}`.trim(),
        billablePhoneNumber: customerData.billable_phone_number || customerData.mobile_number || null,
        displayName: `${customerData.first_name} ${customerData.last_name || ''}`.trim(),
        mobileNumber: customerData.mobile_number || null,
        homeNumber: customerData.home_number || null,
        workNumber: customerData.work_number || null,
        company: customerData.company || null,
        jobTitle: customerData.job_title || null,
        notes: customerData.notes || null,
        notificationsEnabled: true,
        archived: false,
        type: customerData.type || 'homeowner',
        isContractor: customerData.is_contractor || false,
        addresses: customerData.addresses?.map(addr => ({
          street: addr.street,
          city: addr.city,
          state: addr.state,
          postalCode: addr.zipCode
        })) || [],
        tags: [],
        hasImprovedCardOnFile: false,
        doNotService: false
      };
      
      console.log(`[API Debug] Creating new customer with data:`, JSON.stringify(apiCustomerData, null, 2));
      console.log(`[API Debug] POST URL: /odata/iworks/v1/Customers`);
      
      // Send create request to API
      const response = await apiClient.post<any>(`/odata/iworks/v1/Customers`, apiCustomerData);
      
      console.log(`[API Debug] Create response:`, JSON.stringify(response.data, null, 2));
      
      // Return the new customer in our format
      const newCustomer = transformApiCustomerToCustomer(response.data);
      console.log(`[API Debug] Transformed new customer:`, JSON.stringify(newCustomer, null, 2));
      
      return newCustomer;
    } catch (error: any) {
      console.error('[API Debug] Error creating customer:', error);
      
      if (error?.response) {
        console.error('[API Debug] Create error response status:', error.response.status);
        console.error('[API Debug] Create error response data:', error.response.data);
        console.error('[API Debug] Create error response headers:', error.response.headers);
      } else if (error?.request) {
        console.error('[API Debug] No response received from CREATE request');
        console.error('[API Debug] Request that was sent:', error.request);
      } else {
        console.error('[API Debug] Create error message:', error?.message || 'Unknown error');
      }
      
      throw error;
    }
  },
  
  // Update an address for a customer
  updateCustomerAddress: async (customerId: string, addressId: string, addressData: Partial<CustomerAddress>): Promise<CustomerAddress> => {
    try {
      const apiFormatData = {
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.zipCode
      };
      
      const response = await apiClient.put<any>(
        `/odata/iworks/v1/Customers('${customerId}')/addresses/${addressId}`, 
        apiFormatData
      );
      
      return {
        id: response.data.id || addressId,
        street: response.data.street || addressData.street || '',
        city: response.data.city || addressData.city || '',
        state: response.data.state || addressData.state || '',
        zipCode: response.data.zipCode || response.data.postalCode || addressData.zipCode || ''
      };
    } catch (error) {
      console.error('Error updating customer address in API:', error);
      throw error;
    }
  },
  
  // Delete an address for a customer
  deleteCustomerAddress: async (customerId: string, addressId: string): Promise<void> => {
    try {
      await apiClient.delete(`/odata/iworks/v1/Customers('${customerId}')/addresses/${addressId}`);
    } catch (error) {
      console.error('Error deleting customer address in API:', error);
      throw error;
    }
  },
  
  // Add a tag to a customer
  addCustomerTag: async (id: string, tag: string): Promise<void> => {
    try {
      await apiClient.post(`/odata/iworks/v1/Customers('${id}')/tags`, { tag });
    } catch (error) {
      console.error(`Error adding tag to customer with ID ${id} in API:`, error);
      throw error;
    }
  },
  
  // Remove a tag from a customer
  removeCustomerTag: async (id: string, tag: string): Promise<void> => {
    try {
      await apiClient.delete(`/odata/iworks/v1/Customers('${id}')/tags/${tag}`);
    } catch (error) {
      console.error(`Error removing tag from customer with ID ${id} in API:`, error);
      throw error;
    }
  }
};
