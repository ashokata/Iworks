// src/services/customerService.ts
import { apiClient } from './apiClient';
import { 
  transformCustomerFromApi, 
  transformCustomerToApi,
  transformCustomerAddressFromApi,
  transformCustomerAddressToApi 
} from '@/config/apiSchemas/customer.schema';
import { extractODataResponse } from '@/config/apiSchemas/utils';

// Import API configuration
import { API_CONFIG } from '@/config/api.config';

export interface CustomerAddress {
  id: string | number;  // Converted to integer from OData string
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
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

// Export service interface with methods
export const customerService = {
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
      
      const customers: Customer[] = extractedCustomers.map(transformCustomerFromApi);
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
        allCustomers = response.value.map((apiCustomer: any) => transformCustomerFromApi(apiCustomer));
      } else if (Array.isArray(response)) {
        allCustomers = response.map((apiCustomer: any) => transformCustomerFromApi(apiCustomer));
      } else if (response && Array.isArray(response.data)) {
        allCustomers = response.data.map((apiCustomer: any) => transformCustomerFromApi(apiCustomer));
      } else if (response && typeof response === 'object') {
        allCustomers = [transformCustomerFromApi(response)];
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
  
  /**
   * Delete a customer (backend handles cascading address deletes)
   * Endpoint: DELETE /odata/iworks/v1/Customers('{CustomerID}')
   * 
   * @param id - Customer ID to delete
   */
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      console.log(`[Customer Service] Deleting customer ${id}`);
      
      // Delete the customer - backend should handle cascading address deletes
      await apiClient.delete(`/odata/iworks/v1/Customers('${id}')`);
      console.log('[Customer Service] Customer deleted successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error deleting customer ${id}:`, error);
      console.error('[Customer Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },
  
  // Update a customer
  updateCustomer: async (id: string, customerData: any): Promise<Customer> => {
    try {
      console.log(`[Customer Service] Updating customer ${id} via OData API`);
      console.log('[Customer Service] Input update data:', JSON.stringify(customerData, null, 2));
      
      // Transform to API format
      const apiData = transformCustomerToApi(customerData);
      console.log('[Customer Service] Transformed API update data:', JSON.stringify(apiData, null, 2));
      
      // Use PATCH for partial updates with string ID
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Customers('${id}')`, apiData);
      console.log('[Customer Service] Update response:', JSON.stringify(response, null, 2));
      
      // Transform response back to frontend format
      const customer = transformCustomerFromApi(response);
      return customer;
    } catch (error: any) {
      console.error(`[Customer Service] Error updating customer ${id}:`, error);
      console.error('[Customer Service] Update error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  },
  
  // Add an address to a customer
  /**
   * Add a new address to a customer
   * Endpoint: POST /odata/iworks/v1/CustomerAddresses
   * 
   * @param id - Customer ID to associate the address with
   * @param address - Address data (without ID)
   */
  addCustomerAddress: async (id: string, address: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> => {
    try {
      console.log(`[Customer Service] Adding address to customer ${id}`);
      
      // Transform address to API format
      const apiAddressData = transformCustomerAddressToApi(address);
      
      // Add Customer binding for OData relationship
      const payload = {
        "Customer@odata.bind": `Customers('${id}')`,
        ...apiAddressData
      };
      
      console.log('[Customer Service] Address payload:', JSON.stringify(payload, null, 2));
      
      const response = await apiClient.post<any>('/odata/iworks/v1/CustomerAddresses', payload);
      console.log('[Customer Service] Address created successfully:', response.AddressID);
      
      // Transform response back to frontend format
      return transformCustomerAddressFromApi(response);
    } catch (error: any) {
      console.error(`[Customer Service] Error adding address to customer ${id}:`, error);
      console.error('[Customer Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Add multiple addresses to a customer
   * Endpoint: POST /odata/iworks/v1/CustomerAddresses (called multiple times)
   * 
   * @param id - Customer ID to associate the addresses with
   * @param addresses - Array of address data (without IDs)
   * @returns Array of created addresses with their IDs
   */
  addCustomerAddresses: async (id: string, addresses: Omit<CustomerAddress, 'id'>[]): Promise<CustomerAddress[]> => {
    try {
      console.log(`[Customer Service] Adding ${addresses.length} addresses to customer ${id}`);
      
      const createdAddresses: CustomerAddress[] = [];
      const errors: Array<{ index: number; error: any }> = [];

      // Process each address sequentially to maintain order and handle errors
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        try {
          console.log(`[Customer Service] Creating address ${i + 1}/${addresses.length}`);
          
          // Transform address to API format
          const apiAddressData = transformCustomerAddressToApi(address);
          
          // Add Customer binding for OData relationship
          const payload = {
            "Customer@odata.bind": `Customers('${id}')`,
            ...apiAddressData
          };
          
          const response = await apiClient.post<any>('/odata/iworks/v1/CustomerAddresses', payload);
          console.log(`[Customer Service] Address ${i + 1} created successfully:`, response.AddressID);
          
          // Transform response back to frontend format
          createdAddresses.push(transformCustomerAddressFromApi(response));
        } catch (addressError: any) {
          console.error(`[Customer Service] Failed to create address ${i + 1}:`, addressError);
          errors.push({ index: i, error: addressError });
          // Continue creating other addresses even if one fails
        }
      }

      console.log(`[Customer Service] Batch address creation complete: ${createdAddresses.length}/${addresses.length} successful`);
      
      if (errors.length > 0) {
        console.warn(`[Customer Service] ${errors.length} address(es) failed to create:`, errors);
      }

      return createdAddresses;
    } catch (error: any) {
      console.error(`[Customer Service] Error in batch address creation for customer ${id}:`, error);
      console.error('[Customer Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },
  
  // Create a new customer
  createCustomer: async (customerData: CreateCustomerRequest): Promise<Customer> => {
    let apiData: any;
    try {
      console.log('[Customer Service] Creating new customer via OData API');
      console.log('[Customer Service] Input data:', JSON.stringify(customerData, null, 2));
      
      // Transform to API format using centralized schema transformation (isCreate = true excludes CustomerID)
      apiData = transformCustomerToApi(customerData as any, true);
      console.log('[Customer Service] Transformed API data:', JSON.stringify(apiData, null, 2));
      
      const response = await apiClient.post<any>('/odata/iworks/v1/Customers', apiData);
      console.log('[Customer Service] Customer created successfully:', response.CustomerID);
      
      // Transform response back to frontend format
      const customer = transformCustomerFromApi(response);
      return customer;
    } catch (error: any) {
      console.error('[Customer Service] Error creating customer:', error);
      console.error('[Customer Service] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        requestData: apiData,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  },
  
  /**
   * Update an existing customer address
   * Endpoint: PATCH /odata/iworks/v1/CustomerAddresses('{AddressID}')
   * 
   * @param customerId - Customer ID (not used in endpoint, but kept for backward compatibility)
   * @param addressId - Address ID to update
   * @param addressData - Partial address data to update
   */
  updateCustomerAddress: async (customerId: string, addressId: string, addressData: Partial<CustomerAddress>): Promise<CustomerAddress> => {
    try {
      console.log(`[Customer Service] Updating address ${addressId} for customer ${customerId}`);
      
      // Transform address data to API format using centralized schema transformation
      const apiAddressData = transformCustomerAddressToApi(addressData);
      console.log('[Customer Service] Update payload:', JSON.stringify(apiAddressData, null, 2));
      
      const response = await apiClient.patch<any>(
        `/odata/iworks/v1/CustomerAddresses('${addressId}')`,
        apiAddressData
      );
      console.log('[Customer Service] Address updated successfully');
      
      // If response is 204 No Content, return the updated data
      if (!response || Object.keys(response).length === 0) {
        console.log('[Customer Service] 204 response, using request data');
        return {
          id: addressId,
          ...addressData
        } as CustomerAddress;
      }
      
      // Transform response back to frontend format
      return transformCustomerAddressFromApi(response);
    } catch (error: any) {
      console.error(`[Customer Service] Error updating address ${addressId}:`, error);
      console.error('[Customer Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },
  
  /**
   * Delete a customer address
   * Endpoint: DELETE /odata/iworks/v1/CustomerAddresses('{AddressID}')
   * 
   * @param customerId - Customer ID (not used in endpoint, but kept for backward compatibility)
   * @param addressId - Address ID to delete
   */
  deleteCustomerAddress: async (customerId: string, addressId: string): Promise<void> => {
    try {
      console.log(`[Customer Service] Deleting address ${addressId} for customer ${customerId}`);
      
      await apiClient.delete(`/odata/iworks/v1/CustomerAddresses('${addressId}')`);
      console.log('[Customer Service] Address deleted successfully');
    } catch (error: any) {
      console.error(`[Customer Service] Error deleting address ${addressId}:`, error);
      console.error('[Customer Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
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
