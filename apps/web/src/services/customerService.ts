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
  display_name: string;  // Computed from firstName + lastName
  email: string;
  phone: string;
  mobile_number?: string;  // Alias for phone
  home_number?: string | null;
  work_number?: string | null;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  type?: 'homeowner' | 'business';
  is_contractor?: boolean;
  company?: string | null;
  job_title?: string | null;
  tags?: any;
  addresses?: any;
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
      const tenantIdUsed = getTenantId();
      console.log(`[Customer Service] Fetching customers from Lambda API`);
      console.log(`[Customer Service] API URL:`, API_CONFIG.BASE_URL);
      console.log(`[Customer Service] Tenant ID:`, tenantIdUsed);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getAllCustomers',message:'Fetching customers',data:{url:`${API_CONFIG.BASE_URL}/customers`,tenantId:tenantIdUsed},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'LIST1'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantIdUsed,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Received customers:', data);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getAllCustomers',message:'Customers received',data:{count:data.customers?.length,customers:data.customers?.map((c:any)=>({id:c.customerId,firstName:c.firstName,lastName:c.lastName}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'LIST2'})}).catch(()=>{});
      // #endregion
      
      // API returns { customers: [...], count: ... }
      const customers = data.customers || [];
      
      // Add display_name and other computed fields, map customerId to id
      return customers.map((c: any) => ({
        ...c,
        id: c.customerId || c.id,  // Map customerId to id for frontend
        first_name: c.firstName,   // Add snake_case alias for filters
        last_name: c.lastName,     // Add snake_case alias for filters
        display_name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        mobile_number: c.phone,  // Map phone to mobile_number
        type: 'homeowner' as const,
        is_contractor: false,
        tags: { data: [], object: 'list', url: '' },
        addresses: c.address ? {
          data: [{
            id: 1,
            street: c.address,
            city: c.city || '',
            state: c.state || '',
            zipCode: c.zipCode || '',
            isPrimary: true
          }],
          object: 'list',
          url: ''
        } : { data: [], object: 'list', url: '' }
      }));
    } catch (error: any) {
      console.error('[Customer Service] Error fetching customers:', error);
      throw error;
    }
  },
  
  // Get a customer by ID
  getCustomerById: async (id: string): Promise<Customer | null> => {
    try {
      // #region agent log
      console.log(`[DEBUG-GET0] Fetching customer with ID: ${id}`);
      console.log(`[DEBUG-GET0] Full URL: ${API_CONFIG.BASE_URL}/customers/${id}`);
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getCustomerById',message:'Fetching customer',data:{id,url:`${API_CONFIG.BASE_URL}/customers/${id}`},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'GET0'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      // #region agent log
      console.log(`[DEBUG-GET1] Response status: ${response.status}`);
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getCustomerById',message:'Response status',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'GET1'})}).catch(()=>{});
      // #endregion

      if (response.status === 404) {
        console.log('[DEBUG-GET2] Customer not found (404)');
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[DEBUG-GET2] Error response: ${errorText}`);
        fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getCustomerById',message:'Error response',data:{status:response.status,errorText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'GET2'})}).catch(()=>{});
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // #region agent log
      console.log('[DEBUG-GET3] Raw response data:', JSON.stringify(data));
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:getCustomerById',message:'Raw response',data:{rawData:data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'GET3'})}).catch(()=>{});
      // #endregion
      
      // Handle both { customer: ... } wrapper and direct customer object
      const customer = data.customer || data;
      
      // Map customerId to id for frontend compatibility
      const customerId = customer.customerId || customer.id;
      
      // Add display_name and other computed fields
      return {
        ...customer,
        id: customerId,  // Ensure id is set for frontend
        first_name: customer.firstName,   // Add snake_case alias
        last_name: customer.lastName,     // Add snake_case alias
        display_name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        mobile_number: customer.phone,  // Map phone to mobile_number
        type: 'homeowner' as const,
        is_contractor: false,
        tags: { data: [], object: 'list', url: '' },
        addresses: customer.address ? {
          data: [{
            id: 1,
            street: customer.address,
            city: customer.city || '',
            state: customer.state || '',
            zipCode: customer.zipCode || '',
            isPrimary: true
          }],
          object: 'list',
          url: ''
        } : { data: [], object: 'list', url: '' }
      };
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
  createCustomer: async (customerData: CreateCustomerRequest | any): Promise<Customer> => {
    try {
      // #region agent log
      console.log('[DEBUG-FE1] Raw customerData received:', JSON.stringify(customerData));
      console.log('[DEBUG-FE1] API URL:', `${API_CONFIG.BASE_URL}/customers`);
      console.log('[DEBUG-FE1] Tenant ID:', getTenantId());
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:createCustomer',message:'Raw customerData',data:{customerData,apiUrl:`${API_CONFIG.BASE_URL}/customers`,tenantId:getTenantId()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FE1'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(customerData),
      });

      // #region agent log
      console.log('[DEBUG-FE2] Response status:', response.status);
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:createCustomer',message:'Response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FE2'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // #region agent log
        console.log('[DEBUG-FE3] Error response data:', JSON.stringify(errorData));
        fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:createCustomer',message:'Error response',data:{errorData,status:response.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'FE3'})}).catch(()=>{});
        // #endregion
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Customer Service] Customer created:', data);
      
      // Handle { customer: ... } wrapper and map customerId to id
      const customer = data.customer || data;
      return {
        ...customer,
        id: customer.customerId || customer.id,
        display_name: `${customer.firstName} ${customer.lastName}`.trim(),
        mobile_number: customer.phone,
      };
    } catch (error: any) {
      console.error('[Customer Service] Error creating customer:', error);
      throw error;
    }
  },
  
  // Update a customer
  updateCustomer: async (id: string, customerData: Partial<CreateCustomerRequest>): Promise<Customer> => {
    try {
      // #region agent log
      const updateUrl = `${API_CONFIG.BASE_URL}/customers/${id}`;
      const tenantIdUsed = getTenantId();
      console.log(`[DEBUG-UPD1] Updating customer at URL: ${updateUrl}`);
      console.log(`[DEBUG-UPD1] Customer ID: ${id}`);
      console.log(`[DEBUG-UPD1] Tenant ID: ${tenantIdUsed}`);
      console.log(`[DEBUG-UPD1] Data:`, JSON.stringify(customerData));
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:updateCustomer',message:'Update request',data:{id,url:updateUrl,tenantId:tenantIdUsed,customerData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'UPD1'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(customerData),
      });

      // #region agent log
      console.log(`[DEBUG-UPD2] Response status: ${response.status}`);
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:updateCustomer',message:'Response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'UPD2'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // #region agent log
        console.log(`[DEBUG-UPD3] Error data:`, JSON.stringify(errorData));
        fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:updateCustomer',message:'Error response',data:{errorData,status:response.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'UPD3'})}).catch(()=>{});
        // #endregion
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const customer = await response.json();
      console.log('[Customer Service] Customer updated:', customer);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:updateCustomer',message:'Update response data',data:{customer},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'UPD4'})}).catch(()=>{});
      // #endregion
      return customer;
    } catch (error: any) {
      // #region agent log
      console.error(`[DEBUG-UPD-ERR] Error updating customer ${id}:`, error.message);
      console.error(`[DEBUG-UPD-ERR] Error stack:`, error.stack);
      console.error(`[DEBUG-UPD-ERR] Error type:`, error.constructor.name);
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'customerService.ts:updateCustomer',message:'Exception caught',data:{id,errorMessage:error.message,errorName:error.name,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'UPD-ERR'})}).catch(()=>{});
      // #endregion
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
