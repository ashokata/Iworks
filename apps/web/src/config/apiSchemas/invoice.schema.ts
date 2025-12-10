/**
 * Invoice API Schema Mappings
 * 
 * Handles transformation between OData Invoice API and frontend Invoice interface
 */

import { Invoice, InvoiceItem } from '@/types/enhancedTypes';

/**
 * API Field Mapping for Invoices
 * Maps OData backend fields to frontend Invoice interface
 */
export const INVOICE_FIELD_MAP = {
  // Backend → Frontend
  InvoiceID: 'id',
  JobID: 'jobId',
  CustomerID: 'customerId',
  TenantID: 'tenantId',
  CreatedDate: 'createdAt',
  DueDate: 'dueDate',
  Subtotal: 'subtotal',
  TaxRate: 'taxRate',
  Tax: 'tax',
  Total: 'total',
  Notes: 'notes',
  Status: 'status',
  PaidAmount: 'paidAmount',
  PaidDate: 'paidDate',
  PaymentMethod: 'paymentMethod',
  Items: 'items',
} as const;

/**
 * Transform OData Invoice response to frontend Invoice interface
 */
export const transformInvoiceFromApi = (apiInvoice: any): Invoice => {
  console.log('[Invoice Schema] Transforming invoice:', apiInvoice?.InvoiceID || 'unknown');
  console.log('[Invoice Schema] Raw API data:', apiInvoice);
  
  return {
    id: apiInvoice.InvoiceID || apiInvoice.id || `inv_${Date.now()}`,
    jobId: apiInvoice.JobID || apiInvoice.jobId || '',
    customerId: apiInvoice.CustomerID || apiInvoice.customerId || '',
    tenantId: apiInvoice.TenantID || apiInvoice.tenantId || '',
    createdAt: apiInvoice.CreatedDate || apiInvoice.createdAt || new Date().toISOString(),
    dueDate: apiInvoice.DueDate || apiInvoice.dueDate || new Date().toISOString(),
    items: parseInvoiceItems(apiInvoice.Items || apiInvoice.items),
    subtotal: parseNumber(apiInvoice.Subtotal || apiInvoice.subtotal) || 0,
    taxRate: parseNumber(apiInvoice.TaxRate || apiInvoice.taxRate) || 0,
    tax: parseNumber(apiInvoice.Tax || apiInvoice.tax) || 0,
    total: parseNumber(apiInvoice.Total || apiInvoice.total) || 0,
    notes: apiInvoice.Notes || apiInvoice.notes,
    status: parseInvoiceStatus(apiInvoice.Status || apiInvoice.status),
    paidAmount: parseNumber(apiInvoice.PaidAmount || apiInvoice.paidAmount),
    paidDate: apiInvoice.PaidDate || apiInvoice.paidDate,
    paymentMethod: apiInvoice.PaymentMethod || apiInvoice.paymentMethod,
  };
};

/**
 * Transform frontend Invoice to API format for create/update
 */
export const transformInvoiceToApi = (invoice: Partial<Invoice>): any => {
  console.log('[Invoice Schema] Transforming invoice to API format:', invoice.id || 'new');
  
  return {
    InvoiceID: invoice.id,
    JobID: invoice.jobId,
    CustomerID: invoice.customerId,
    TenantID: invoice.tenantId,
    CreatedDate: invoice.createdAt,
    DueDate: invoice.dueDate,
    Subtotal: invoice.subtotal,
    TaxRate: invoice.taxRate,
    Tax: invoice.tax,
    Total: invoice.total,
    Notes: invoice.notes,
    Status: invoice.status,
    PaidAmount: invoice.paidAmount,
    PaidDate: invoice.paidDate,
    PaymentMethod: invoice.paymentMethod,
    Items: invoice.items ? invoice.items.map(transformInvoiceItemToApi) : [],
  };
};

/**
 * Transform invoice item to API format
 */
function transformInvoiceItemToApi(item: InvoiceItem): any {
  return {
    ItemID: item.id,
    Description: item.description,
    Quantity: item.quantity,
    UnitPrice: item.unitPrice,
    Total: item.total,
    Taxable: item.taxable,
  };
}

// Helper functions
function parseInvoiceItems(value: any): InvoiceItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => ({
      id: item.ItemID || item.id || `item_${Date.now()}`,
      description: item.Description || item.description || '',
      quantity: parseNumber(item.Quantity || item.quantity) || 0,
      unitPrice: parseNumber(item.UnitPrice || item.unitPrice) || 0,
      total: parseNumber(item.Total || item.total) || 0,
      taxable: Boolean(item.Taxable ?? item.taxable ?? true),
    }));
  }
  return [];
}

function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? undefined : parsed;
}

function parseInvoiceStatus(value: any): 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'Partial' {
  if (!value) return 'Unpaid';
  const normalized = String(value).toLowerCase();
  if (normalized.includes('paid') && !normalized.includes('unpaid')) return 'Paid';
  if (normalized.includes('overdue')) return 'Overdue';
  if (normalized.includes('cancel')) return 'Cancelled';
  if (normalized.includes('partial')) return 'Partial';
  return 'Unpaid';
}
