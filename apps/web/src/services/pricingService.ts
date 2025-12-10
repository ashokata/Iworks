// src/services/pricingService.ts
import { apiClient } from './apiClient';
import { Pricing, CreatePricingRequest } from '@/types';
import { 
  transformPricingFromApi, 
  transformCreatePricingToApi,
  transformUpdatePricingToApi,
  extractODataResponse 
} from '@/config/apiSchemas';

/**
 * Pricing Service
 * OData Endpoint: /odata/iworks/v1/Pricing
 * 
 * Available Operations:
 * - GET /Pricing - List all pricing records
 * - GET /Pricing('{PricingID}') - Get single pricing record
 * - POST /Pricing - Create new pricing record
 * - PATCH /Pricing('{PricingID}') - Update pricing record
 * - DELETE /Pricing('{PricingID}') - Delete pricing record
 * 
 * Expandable Relations:
 * - Job (via JobID foreign key)
 */
export const pricingService = {
  /**
   * Get all pricing records
   * Endpoint: GET /odata/iworks/v1/Pricing
   * 
   * Query Options:
   * - $filter: Filter pricing (e.g., Total gt 1000)
   * - $orderby: Sort pricing (e.g., createdDate desc)
   * - $expand: Expand relations (Job)
   * - $select: Select specific fields
   * - $top/$skip: Pagination
   */
  getAllPricing: async (): Promise<Pricing[]> => {
    try {
      console.log('[Pricing Service] Fetching all pricing from: /odata/iworks/v1/Pricing');
      console.log('[Pricing Service] Full URL: http://localhost:8090/odata/iworks/v1/Pricing?$expand=Job');
      
      // Expand Job to get job details
      const response = await apiClient.get<any>('/odata/iworks/v1/Pricing?$expand=Job');
      console.log('[Pricing Service] API response received:', response);
      
      // Extract OData response (handles 'value' array)
      const pricingData = extractODataResponse(response);
      console.log(`[Pricing Service] Processing ${pricingData.length} pricing records from OData response`);
      
      // Transform API data to Pricing interface using centralized schema
      const transformedPricing = pricingData.map((apiPricing: any) => transformPricingFromApi(apiPricing));
      console.log('[Pricing Service] Pricing transformed:', transformedPricing.length);
      
      return transformedPricing;
    } catch (error: any) {
      console.error('[Pricing Service] Error fetching pricing:', error);
      console.error('[Pricing Service] Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Get a pricing record by ID
   * Endpoint: GET /odata/iworks/v1/Pricing('{PricingID}')
   * 
   * @param id - PricingID (integer)
   */
  getPricingById: async (id: number): Promise<Pricing | null> => {
    try {
      console.log(`[Pricing Service] Fetching pricing with ID: ${id}`);
      console.log(`[Pricing Service] Full URL: /odata/iworks/v1/Pricing(${id})?$expand=Job`);
      
      // Expand Job to get job details
      const response = await apiClient.get<any>(`/odata/iworks/v1/Pricing(${id})?$expand=Job`);
      console.log('[Pricing Service] Pricing retrieved successfully:', response);
      
      if (response) {
        const transformedPricing = transformPricingFromApi(response);
        console.log('[Pricing Service] Transformed pricing:', transformedPricing);
        return transformedPricing;
      }
      
      console.warn('[Pricing Service] No response data received');
      return null;
    } catch (error: any) {
      console.error(`[Pricing Service] ❌ Error fetching pricing ${id}:`, error);
      console.error('[Pricing Service] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Get pricing by Job ID
   * Endpoint: GET /odata/iworks/v1/Pricing?$filter=JobID eq {jobId}&$expand=Job
   * 
   * @param jobId - JobID (integer)
   */
  getPricingByJobId: async (jobId: number): Promise<Pricing[]> => {
    try {
      console.log(`[Pricing Service] Fetching pricing for Job ID: ${jobId}`);
      
      const filter = `JobID eq ${jobId}`;
      const response = await apiClient.get<any>(`/odata/iworks/v1/Pricing?$filter=${encodeURIComponent(filter)}&$expand=Job`);
      
      const pricingData = extractODataResponse(response);
      console.log(`[Pricing Service] Found ${pricingData.length} pricing records for Job ${jobId}`);
      
      const transformedPricing = pricingData.map((apiPricing: any) => transformPricingFromApi(apiPricing));
      
      return transformedPricing;
    } catch (error: any) {
      console.error(`[Pricing Service] Error fetching pricing for Job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new pricing record
   * Endpoint: POST /odata/iworks/v1/Pricing
   * 
   * Schema: PricingCREATE
   * - Required: SubTotal
   * - Returns: 201 Created with Pricing object
   * 
   * @param pricingData - Pricing creation data
   */
  createPricing: async (pricingData: CreatePricingRequest): Promise<Pricing> => {
    try {
      const apiPricingData = transformCreatePricingToApi(pricingData);
      
      console.log('[Pricing Service] ========== POSTING TO API ==========');
      console.log('[Pricing Service] Endpoint: POST /odata/iworks/v1/Pricing');
      console.log('[Pricing Service] Final Payload to send:', JSON.stringify(apiPricingData, null, 2));
      console.log('[Pricing Service] Payload matches expected format:', {
        hasSubTotal: apiPricingData.hasOwnProperty('SubTotal'),
        hasDiscount: apiPricingData.hasOwnProperty('Discount'),
        hasTaxRate: apiPricingData.hasOwnProperty('TaxRate'),
        hasTaxAmount: apiPricingData.hasOwnProperty('TaxAmount'),
        hasTotal: apiPricingData.hasOwnProperty('Total'),
        hasCounty: apiPricingData.hasOwnProperty('County'),
        hasJobBinding: apiPricingData.hasOwnProperty('Job@odata.bind'),
      });
      
      const response = await apiClient.post<any>('/odata/iworks/v1/Pricing', apiPricingData);
      console.log('[Pricing Service] Pricing created successfully:', response.PricingID);
      
      return transformPricingFromApi(response);
    } catch (error: any) {
      console.error('[Pricing Service] Error creating pricing:', error);
      console.error('[Pricing Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Update an existing pricing record
   * Endpoint: PATCH /odata/iworks/v1/Pricing('{PricingID}')
   * 
   * Schema: PricingUPDATE
   * - PricingID is in URL path, not in body
   * - Only include fields being updated
   * - Returns: 201 Created or 204 No Content
   * 
   * @param id - PricingID (integer)
   * @param pricingData - Partial pricing data to update
   */
  updatePricing: async (id: number, pricingData: Partial<Pricing>): Promise<Pricing> => {
    try {
      const apiPricingData = transformUpdatePricingToApi(pricingData);
      
      console.log(`[Pricing Service] Updating pricing ${id}`);
      console.log('[Pricing Service] Update payload:', JSON.stringify(apiPricingData, null, 2));
      
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Pricing(${id})`, apiPricingData);
      console.log('[Pricing Service] Pricing updated successfully');
      
      // If response is 204 No Content, fetch the updated pricing
      if (!response || Object.keys(response).length === 0) {
        console.log('[Pricing Service] 204 response, fetching updated pricing');
        const updatedPricing = await pricingService.getPricingById(id);
        if (!updatedPricing) {
          throw new Error('Failed to fetch updated pricing');
        }
        return updatedPricing;
      }
      
      return transformPricingFromApi(response);
    } catch (error: any) {
      console.error(`[Pricing Service] Error updating pricing ${id}:`, error);
      console.error('[Pricing Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Delete a pricing record
   * Endpoint: DELETE /odata/iworks/v1/Pricing('{PricingID}')
   * 
   * Returns: 204 No Content
   * 
   * @param id - PricingID (integer)
   */
  deletePricing: async (id: number): Promise<void> => {
    try {
      console.log(`[Pricing Service] Deleting pricing ${id}`);
      
      await apiClient.delete(`/odata/iworks/v1/Pricing(${id})`);
      console.log('[Pricing Service] Pricing deleted successfully');
    } catch (error: any) {
      console.error(`[Pricing Service] Error deleting pricing ${id}:`, error);
      console.error('[Pricing Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Get pricing count
   * Endpoint: GET /odata/iworks/v1/Pricing/$count
   * 
   * Optional filters can be applied
   */
  getPricingCount: async (filter?: string): Promise<number> => {
    try {
      const url = filter 
        ? `/odata/iworks/v1/Pricing/$count?$filter=${encodeURIComponent(filter)}`
        : '/odata/iworks/v1/Pricing/$count';
      
      console.log(`[Pricing Service] Fetching pricing count: ${url}`);
      const count = await apiClient.get<number>(url);
      
      return count;
    } catch (error: any) {
      console.error('[Pricing Service] Error fetching pricing count:', error);
      throw error;
    }
  },

  /**
   * Calculate pricing totals
   * Helper function to calculate tax and total amounts
   * 
   * @param subTotal - Subtotal amount
   * @param discount - Discount amount (default 0)
   * @param taxRate - Tax rate as percentage (default 0)
   * @returns Calculated pricing object
   */
  calculatePricing: (subTotal: number, discount: number = 0, taxRate: number = 0) => {
    const discountedSubtotal = subTotal - discount;
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + taxAmount;

    return {
      subTotal,
      discount,
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  },
};
