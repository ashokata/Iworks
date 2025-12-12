/**
 * Invoice Service - PostgreSQL Backend
 * 
 * This service handles all invoice-related API calls.
 * Uses the new database types that match the PostgreSQL schema.
 */

import { API_CONFIG } from '@/config/api.config';
import type {
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  Payment,
  PaymentMethod,
  PaymentTerms,
  CreateInvoiceRequest,
  CreatePaymentRequest,
  InvoiceFilters,
  PaginatedResponse,
  CustomerSummary,
  JobSummary,
} from '@/types/database.types';

// Get tenant ID from environment
const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Transform API response to frontend Invoice type
const transformInvoice = (apiInvoice: any): Invoice => {
  const subtotal = parseFloat(apiInvoice.subtotal) || 0;
  const discountAmount = parseFloat(apiInvoice.discountAmount) || 0;
  const taxAmount = parseFloat(apiInvoice.taxAmount) || parseFloat(apiInvoice.tax) || 0;
  const total = parseFloat(apiInvoice.total) || 0;
  const amountPaid = parseFloat(apiInvoice.amountPaid) || parseFloat(apiInvoice.paidAmount) || 0;
  
  return {
    id: apiInvoice.id || apiInvoice.invoiceId,
    tenantId: apiInvoice.tenantId,
    invoiceNumber: apiInvoice.invoiceNumber || apiInvoice.invoice_number || '',
    customerId: apiInvoice.customerId || apiInvoice.customer_id || '',
    customer: apiInvoice.customer ? transformCustomerSummary(apiInvoice.customer) : undefined,
    jobId: apiInvoice.jobId || apiInvoice.job_id,
    job: apiInvoice.job ? transformJobSummary(apiInvoice.job) : undefined,
    status: (apiInvoice.status || 'DRAFT').toUpperCase() as InvoiceStatus,
    
    issueDate: apiInvoice.issueDate || apiInvoice.issue_date || apiInvoice.createdAt || new Date().toISOString(),
    dueDate: apiInvoice.dueDate || apiInvoice.due_date || new Date().toISOString(),
    terms: apiInvoice.terms || 'DUE_ON_RECEIPT',
    
    poNumber: apiInvoice.poNumber || apiInvoice.po_number,
    message: apiInvoice.message || apiInvoice.notes,
    footerNotes: apiInvoice.footerNotes || apiInvoice.footer_notes,
    
    subtotal,
    discountAmount,
    taxRate: parseFloat(apiInvoice.taxRate) || 0,
    taxAmount,
    total,
    amountPaid,
    balanceDue: total - amountPaid,
    
    sentAt: apiInvoice.sentAt || apiInvoice.sent_at,
    viewedAt: apiInvoice.viewedAt || apiInvoice.viewed_at,
    paidAt: apiInvoice.paidAt || apiInvoice.paid_at || apiInvoice.paidDate,
    voidedAt: apiInvoice.voidedAt || apiInvoice.voided_at,
    voidReason: apiInvoice.voidReason || apiInvoice.void_reason,
    
    qboInvoiceId: apiInvoice.qboInvoiceId,
    stripeInvoiceId: apiInvoice.stripeInvoiceId,
    
    lineItems: (apiInvoice.lineItems || apiInvoice.items || []).map(transformLineItem),
    payments: (apiInvoice.payments || []).map(transformPayment),
    
    createdById: apiInvoice.createdById,
    createdAt: apiInvoice.createdAt || new Date().toISOString(),
    updatedAt: apiInvoice.updatedAt || new Date().toISOString(),
  };
};

const transformCustomerSummary = (customer: any): CustomerSummary => ({
  id: customer.id || customer.customerId,
  customerNumber: customer.customerNumber,
  type: customer.type || 'RESIDENTIAL',
  firstName: customer.firstName || customer.first_name,
  lastName: customer.lastName || customer.last_name,
  companyName: customer.companyName || customer.company_name,
  displayName: customer.displayName || customer.companyName || 
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
  email: customer.email,
  mobilePhone: customer.mobilePhone || customer.mobile_number || customer.phone,
});

const transformJobSummary = (job: any): JobSummary => ({
  id: job.id || job.jobId,
  jobNumber: job.jobNumber || job.job_number || '',
  title: job.title || job.JobName || '',
  status: job.status || 'SCHEDULED',
  scheduledStart: job.scheduledStart || job.scheduled_start || job.ScheduledDate,
});

const transformLineItem = (item: any): InvoiceLineItem => ({
  id: item.id,
  invoiceId: item.invoiceId,
  jobLineItemId: item.jobLineItemId,
  type: item.type || 'SERVICE',
  serviceId: item.serviceId,
  materialId: item.materialId,
  name: item.name || item.description || '',
  description: item.description || '',
  quantity: parseFloat(item.quantity) || 1,
  unitPrice: parseFloat(item.unitPrice) || 0,
  discountAmount: parseFloat(item.discountAmount) || 0,
  taxRate: parseFloat(item.taxRate) || 0,
  isTaxable: item.isTaxable ?? item.taxable ?? true,
  total: parseFloat(item.total) || (parseFloat(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
  sortOrder: item.sortOrder || 0,
});

const transformPayment = (payment: any): Payment => ({
  id: payment.id,
  tenantId: payment.tenantId,
  invoiceId: payment.invoiceId,
  amount: parseFloat(payment.amount) || 0,
  method: payment.method || 'OTHER',
  status: payment.status || 'COMPLETED',
  
  transactionId: payment.transactionId,
  authorizationCode: payment.authorizationCode,
  cardBrand: payment.cardBrand,
  cardLastFour: payment.cardLastFour,
  checkNumber: payment.checkNumber,
  
  processedAt: payment.processedAt,
  failedAt: payment.failedAt,
  failureReason: payment.failureReason,
  refundedAt: payment.refundedAt,
  refundAmount: payment.refundAmount ? parseFloat(payment.refundAmount) : undefined,
  refundReason: payment.refundReason,
  
  collectedById: payment.collectedById,
  notes: payment.notes,
  
  stripePaymentIntentId: payment.stripePaymentIntentId,
  stripeChargeId: payment.stripeChargeId,
  
  createdAt: payment.createdAt || new Date().toISOString(),
  updatedAt: payment.updatedAt || new Date().toISOString(),
});

// Export service interface with methods
export const invoiceService = {
  /**
   * Get all invoices with optional filters
   */
  getAllInvoices: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    try {
      const tenantId = getTenantId();
      console.log('[Invoice Service] Fetching invoices from PostgreSQL API');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.jobId) params.append('jobId', filters.jobId);
      if (filters?.dueBefore) params.append('dueBefore', filters.dueBefore);
      if (filters?.dueAfter) params.append('dueAfter', filters.dueAfter);
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/invoices${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          console.warn('[Invoice Service] Invoices endpoint not available, returning empty array');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Invoice Service] Received invoices:', data.invoices?.length || 0);
      
      // Transform each invoice
      const invoices = (data.invoices || []).map(transformInvoice);
      return invoices;
    } catch (error: any) {
      console.warn('[Invoice Service] Error fetching invoices, returning empty array:', error.message);
      return [];
    }
  },
  
  /**
   * Get paginated invoices
   */
  getInvoicesPaginated: async (
    limit: number = 50,
    offset: number = 0,
    filters?: InvoiceFilters
  ): Promise<PaginatedResponse<Invoice>> => {
    try {
      const tenantId = getTenantId();
      
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters?.customerId) params.append('customerId', filters.customerId);
      
      const url = `${API_CONFIG.BASE_URL}/invoices?${params.toString()}`;
      
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
      const invoices = (data.invoices || []).map(transformInvoice);
      
      return {
        data: invoices,
        total: data.total || invoices.length,
        limit,
        offset,
        hasMore: offset + invoices.length < (data.total || invoices.length),
      };
    } catch (error: any) {
      console.warn('[Invoice Service] Error fetching paginated invoices:', error.message);
      return {
        data: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }
  },
  
  /**
   * Get an invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Fetching invoice: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (response.status === 404) {
        console.log('[Invoice Service] Invoice not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle { invoice: ... } wrapper
      const invoiceData = data.invoice || data;
      return transformInvoice(invoiceData);
    } catch (error: any) {
      console.warn(`[Invoice Service] Error fetching invoice ${id}:`, error.message);
      return null;
    }
  },
  
  /**
   * Get invoice for a job
   */
  getInvoiceForJob: async (jobId: string): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Fetching invoice for job: ${jobId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices?jobId=${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const invoices = data.invoices || [];
      
      if (invoices.length === 0) return null;
      return transformInvoice(invoices[0]);
    } catch (error: any) {
      console.warn(`[Invoice Service] Error fetching invoice for job ${jobId}:`, error.message);
      return null;
    }
  },
  
  /**
   * Get invoices for a customer
   */
  getInvoicesByCustomer: async (customerId: string): Promise<Invoice[]> => {
    try {
      console.log(`[Invoice Service] Fetching invoices for customer: ${customerId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices?customerId=${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.invoices || []).map(transformInvoice);
    } catch (error: any) {
      console.warn(`[Invoice Service] Error fetching invoices for customer ${customerId}:`, error.message);
      return [];
    }
  },
  
  /**
   * Create an invoice from a job
   */
  generateFromJob: async (jobId: string, options?: { dueDate?: string; terms?: PaymentTerms }): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Generating invoice for job: ${jobId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/from-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify({
          jobId,
          ...options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Invoice Service] Invoice generated successfully');
      
      const invoiceData = data.invoice || data;
      return transformInvoice(invoiceData);
    } catch (error: any) {
      console.error('[Invoice Service] Error generating invoice:', error);
      return null;
    }
  },
  
  /**
   * Create a new invoice
   */
  createInvoice: async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
    try {
      console.log('[Invoice Service] Creating invoice');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Invoice Service] Invoice created successfully');
      
      const invoiceResponse = data.invoice || data;
      return transformInvoice(invoiceResponse);
    } catch (error: any) {
      console.error('[Invoice Service] Error creating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Update an invoice
   */
  updateInvoice: async (id: string, invoiceData: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Updating invoice: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Invoice Service] Invoice updated successfully');
      
      const invoiceResponse = data.invoice || data;
      return transformInvoice(invoiceResponse);
    } catch (error: any) {
      console.error(`[Invoice Service] Error updating invoice ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Send an invoice
   */
  sendInvoice: async (id: string, method: 'email' | 'sms' | 'mail' = 'email'): Promise<boolean> => {
    try {
      console.log(`[Invoice Service] Sending invoice ${id} via ${method}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) {
        return false;
      }

      console.log('[Invoice Service] Invoice sent successfully');
      return true;
    } catch (error: any) {
      console.error(`[Invoice Service] Error sending invoice ${id}:`, error);
      return false;
    }
  },
  
  /**
   * Add a payment to an invoice
   */
  addPayment: async (invoiceId: string, payment: CreatePaymentRequest): Promise<Payment | null> => {
    try {
      console.log(`[Invoice Service] Adding payment to invoice: ${invoiceId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(payment),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Invoice Service] Payment added successfully');
      
      return transformPayment(data.payment || data);
    } catch (error: any) {
      console.error('[Invoice Service] Error adding payment:', error);
      return null;
    }
  },
  
  /**
   * Mark invoice as paid
   */
  markAsPaid: async (id: string, paymentDetails: CreatePaymentRequest): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Marking invoice ${id} as paid`);
      
      // Add payment
      const payment = await invoiceService.addPayment(id, paymentDetails);
      if (!payment) {
        return null;
      }
      
      // Get updated invoice
      return invoiceService.getInvoiceById(id);
    } catch (error: any) {
      console.error(`[Invoice Service] Error marking invoice ${id} as paid:`, error);
      return null;
    }
  },
  
  /**
   * Void an invoice
   */
  voidInvoice: async (id: string, reason: string): Promise<Invoice | null> => {
    try {
      console.log(`[Invoice Service] Voiding invoice: ${id}`);
      
      return invoiceService.updateInvoice(id, {
        status: 'VOID',
        voidReason: reason,
      } as any);
    } catch (error: any) {
      console.error(`[Invoice Service] Error voiding invoice ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Get invoice summary/stats
   */
  getInvoiceSummary: async (): Promise<{
    totalOutstanding: number;
    totalOverdue: number;
    countDraft: number;
    countSent: number;
    countOverdue: number;
    countPaid: number;
  }> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/invoices/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        return {
          totalOutstanding: 0,
          totalOverdue: 0,
          countDraft: 0,
          countSent: 0,
          countOverdue: 0,
          countPaid: 0,
        };
      }

      return await response.json();
    } catch (error: any) {
      console.warn('[Invoice Service] Error fetching invoice summary:', error.message);
      return {
        totalOutstanding: 0,
        totalOverdue: 0,
        countDraft: 0,
        countSent: 0,
        countOverdue: 0,
        countPaid: 0,
      };
    }
  },
};

// Re-export types for convenience
export type { Invoice, InvoiceStatus, InvoiceLineItem, Payment, PaymentMethod, CreateInvoiceRequest, CreatePaymentRequest };
