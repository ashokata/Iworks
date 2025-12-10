import { apiClient } from './apiClient';
import { Invoice } from '@/types/enhancedTypes';
import { transformInvoiceFromApi, transformInvoiceToApi } from '@/config/apiSchemas/invoice.schema';
import { extractODataResponse } from '@/config/apiSchemas/utils';

/**
 * Service to handle invoice operations using OData API
 * Endpoint: /odata/iworks/v1/Invoices
 */
export const invoiceService = {
  /**
   * Generate an invoice from a job
   */
  generateFromJob: async (jobId: string): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Generating invoice for job ${jobId}`);
      
      // Using OData action for generating invoice from job
      const response = await apiClient.post<any>(`/odata/iworks/v1/Jobs('${jobId}')/GenerateInvoice`, {});
      
      console.log('[Invoice Service] Generated invoice response:', response);
      
      // Transform to frontend format
      const invoice = transformInvoiceFromApi(response);
      console.log('[Invoice Service] Transformed generated invoice:', invoice);
      
      return invoice;
    } catch (error) {
      console.error(`[Invoice Service] Error generating invoice for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get all invoices for the current tenant
   */
  getAllInvoices: async (): Promise<Invoice[]> => {
    try {
      console.log('[Invoice Service] Fetching all invoices from OData API');
      const response = await apiClient.get<any>('/odata/iworks/v1/Invoices');
      
      console.log('[Invoice Service] Raw OData response:', response);
      
      // Extract OData response (handles 'value' array)
      const invoicesData = extractODataResponse(response);
      console.log('[Invoice Service] Extracted invoices count:', invoicesData.length);
      
      // Transform to frontend format
      const invoices: Invoice[] = invoicesData.map(transformInvoiceFromApi);
      console.log('[Invoice Service] Transformed invoices:', invoices.length);
      
      return invoices;
    } catch (error) {
      console.error('[Invoice Service] Error fetching invoices:', error);
      throw error;
    }
  },

  /**
   * Get an invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Fetching invoice ${id} from OData API`);
      const response = await apiClient.get<any>(`/odata/iworks/v1/Invoices('${id}')`);
      
      console.log('[Invoice Service] Raw invoice response:', response);
      
      // Transform to frontend format
      const invoice = transformInvoiceFromApi(response);
      console.log('[Invoice Service] Transformed invoice:', invoice);
      
      return invoice;
    } catch (error) {
      console.error(`[Invoice Service] Error fetching invoice ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get invoices for a customer
   */
  getInvoicesByCustomer: async (customerId: string): Promise<Invoice[]> => {
    try {
      console.log(`[Invoice Service] Fetching invoices for customer ${customerId}`);
      const response = await apiClient.get<any>(`/odata/iworks/v1/Invoices?$filter=CustomerID eq '${customerId}'`);
      
      console.log('[Invoice Service] Raw customer invoices response:', response);
      
      // Extract OData response
      const invoicesData = extractODataResponse(response);
      
      // Transform to frontend format
      const invoices: Invoice[] = invoicesData.map(transformInvoiceFromApi);
      console.log('[Invoice Service] Transformed customer invoices:', invoices.length);
      
      return invoices;
    } catch (error) {
      console.error(`[Invoice Service] Error fetching invoices for customer ${customerId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get invoice for a specific job
   */
  getInvoiceForJob: async (jobId: string): Promise<Invoice | null> => {
    if (!jobId) return null;
    
    try {
      console.log(`[Invoice Service] Fetching invoice for job ${jobId}`);
      const response = await apiClient.get<any>(`/odata/iworks/v1/Invoices?$filter=JobID eq '${jobId}'`);
      
      console.log('[Invoice Service] Raw job invoice response:', response);
      
      // Extract OData response
      const invoicesData = extractODataResponse(response);
      
      if (invoicesData.length === 0) {
        console.log('[Invoice Service] No invoice found for job');
        return null;
      }
      
      // Transform first invoice (assuming one invoice per job)
      const invoice = transformInvoiceFromApi(invoicesData[0]);
      console.log('[Invoice Service] Transformed job invoice:', invoice);
      
      return invoice;
    } catch (error) {
      console.error(`[Invoice Service] Error fetching invoice for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Update an invoice
   */
  updateInvoice: async (id: string, data: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Updating invoice ${id}`);
      
      // Transform to API format
      const apiData = transformInvoiceToApi(data);
      console.log('[Invoice Service] Transformed update data:', apiData);
      
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Invoices('${id}')`, apiData);
      
      console.log('[Invoice Service] Update response:', response);
      
      // Transform response back to frontend format
      const invoice = transformInvoiceFromApi(response);
      console.log('[Invoice Service] Transformed updated invoice:', invoice);
      
      return invoice;
    } catch (error) {
      console.error(`[Invoice Service] Error updating invoice ${id}:`, error);
      throw error;
    }
  },

  /**
   * Send an invoice to a customer
   */
  sendInvoice: async (id: string, method: 'email' | 'sms' | 'mail'): Promise<boolean> => {
    try {
      console.log(`[Invoice Service] Sending invoice ${id} via ${method}`);
      
      // Using OData action for sending invoice
      await apiClient.post(`/odata/iworks/v1/Invoices('${id}')/Send`, { method });
      
      console.log('[Invoice Service] Invoice sent successfully');
      return true;
    } catch (error) {
      console.error(`[Invoice Service] Error sending invoice ${id}:`, error);
      throw error;
    }
  },

  /**
   * Mark an invoice as paid
   */
  markAsPaid: async (id: string, paymentDetails: any): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Marking invoice ${id} as paid`);
      
      // Using OData action for marking invoice as paid
      const response = await apiClient.post<any>(`/odata/iworks/v1/Invoices('${id}')/MarkAsPaid`, paymentDetails);
      
      console.log('[Invoice Service] Mark as paid response:', response);
      
      // Transform response back to frontend format
      const invoice = transformInvoiceFromApi(response);
      console.log('[Invoice Service] Transformed paid invoice:', invoice);
      
      return invoice;
    } catch (error) {
      console.error(`[Invoice Service] Error marking invoice ${id} as paid:`, error);
      throw error;
    }
  },

};
