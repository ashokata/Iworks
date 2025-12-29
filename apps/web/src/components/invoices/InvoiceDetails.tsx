import React from 'react';

// Accept a flexible invoice type that works with both database and enhanced types
interface InvoiceItem {
  id: string;
  description?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable?: boolean;
  isTaxable?: boolean;
}

interface FlexibleInvoice {
  id: string;
  jobId?: string;
  customerId?: string;
  tenantId?: string;
  invoiceNumber?: string;
  createdAt?: string;
  issueDate?: string;
  dueDate: string;
  items?: InvoiceItem[];
  lineItems?: InvoiceItem[];
  subtotal: number;
  taxRate?: number;
  tax?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
  status: string;
  paidAmount?: number;
  amountPaid?: number;
  paidDate?: string;
  paidAt?: string;
  paymentMethod?: string;
}

interface InvoiceDetailsProps {
  invoice: FlexibleInvoice;
  onClose: () => void;
  onSend?: (method: 'email' | 'sms' | 'mail') => void;
  onPrint?: () => void;
}

/**
 * Component for displaying invoice details.
 * Based on HouseCallPro's invoice presentation.
 */
export default function InvoiceDetails({ invoice, onClose, onSend, onPrint }: InvoiceDetailsProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Invoice #{invoice.id}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Invoice content */}
          <div className="px-6 py-4">
            {/* Status banner */}
            <div className={`mb-6 px-4 py-2 rounded-md ${
              ['Paid', 'PAID'].includes(invoice.status) ? 'bg-green-50 text-green-700 border border-green-200' :
              ['Overdue', 'OVERDUE'].includes(invoice.status) ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {['Paid', 'PAID'].includes(invoice.status) ? (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : ['Overdue', 'OVERDUE'].includes(invoice.status) ? (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{invoice.status}</span>
              </div>
            </div>
            
            {/* Invoice metadata */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.issueDate || invoice.createdAt || new Date().toISOString())}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Invoice Number</h3>
                <p className="mt-1 text-sm text-gray-900">{invoice.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Job ID</h3>
                <p className="mt-1 text-sm text-gray-900">{invoice.jobId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer ID</h3>
                <p className="mt-1 text-sm text-gray-900">{invoice.customerId}</p>
              </div>
            </div>
            
            {/* Invoice items */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(invoice.items || invoice.lineItems || []).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description || item.name || 'Item'}
                          {(item.taxable || item.isTaxable) && <span className="ml-2 text-xs text-gray-500">(Taxable)</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Invoice totals */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-md p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-500">Tax ({((invoice.taxRate || 0) * 100).toFixed(2)}%)</span>
                  <span className="text-gray-900">{formatCurrency(invoice.tax || invoice.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-base mt-4 border-t border-gray-200 pt-4">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
                
                {['Paid', 'PAID'].includes(invoice.status) && (
                  <div className="flex justify-between text-sm text-green-700 mt-2">
                    <span className="font-medium">Paid</span>
                    <span>{formatCurrency(invoice.paidAmount || invoice.amountPaid || invoice.total)}</span>
                  </div>
                )}
                
                {['Partial', 'PARTIAL'].includes(invoice.status) && (
                  <>
                    <div className="flex justify-between text-sm text-green-700 mt-2">
                      <span className="font-medium">Paid</span>
                      <span>{formatCurrency(invoice.paidAmount || invoice.amountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-700 mt-1">
                      <span className="font-medium">Balance Due</span>
                      <span>{formatCurrency(invoice.total - (invoice.paidAmount || invoice.amountPaid || 0))}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Notes */}
            {invoice.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{invoice.notes}</p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            {onPrint && (
              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            )}
            
            {onSend && invoice.status !== 'Paid' && (
              <button
                type="button"
                onClick={() => onSend('email')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send to Customer
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
