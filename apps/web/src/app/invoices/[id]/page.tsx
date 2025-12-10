'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { invoiceService } from '@/services/invoiceService';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  AtSymbolIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

interface Invoice {
  id: string;
  number?: string;
  customer?: {
    id: string;
    name: string;
    company?: string;
    email: string;
    phone: string;
    address: string;
  };
  job?: {
    id: string;
    title: string;
    description: string;
    completionDate: string;
  };
  technician?: {
    id: string;
    name: string;
  };
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal?: number;
  total: number;
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled' | 'Partial';
  paymentMethod?: string;
  paymentDate?: string;
  paidDate?: string;
  notes?: string;
}

export default function InvoiceDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  const [isOnline, setIsOnline] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch invoice data
  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await invoiceService.getInvoiceById(invoiceId);
      if (!response) {
        throw new Error('Invoice not found');
      }
      return response as unknown as Invoice;
    },
    retry: 1,
    enabled: !!invoiceId
  });

  // Handle error state
  if (!invoiceId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Invoice ID is missing</h2>
          <p className="mt-2 text-gray-600">Please return to the invoices list</p>
          <Button className="mt-4" onClick={() => router.push('/invoices')}>
            Go to Invoices
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not found state
  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Invoice not found</h2>
          <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist or has been removed</p>
          <Button className="mt-4" onClick={() => router.push('/invoices')}>
            Go to Invoices
          </Button>
        </div>
      </div>
    );
  }

  // Helper for invoice status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => router.push('/invoices')}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.id}</h1>
            </div>
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </span>
            {invoice.paidDate && (
              <span className="ml-2 text-sm text-gray-600">
                Paid on: {new Date(invoice.paidDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              disabled={!isOnline}
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline"
              disabled={!isOnline || invoice.status === 'Paid' || invoice.status === 'Cancelled'}
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline"
              disabled={!isOnline}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            {invoice.status === 'Unpaid' && (
              <Button disabled={!isOnline}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Container */}
        <Card className="overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-blue-600 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold">INVOICE</h2>
                <p className="mt-2">{invoice.id}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold">InField Works</h3>
                <p className="mt-1">123 Service Road</p>
                <p>Tech City, TS 54321</p>
                <p>support@infieldworks.com</p>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            {/* Customer & Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Bill To:</h3>
                <div className="space-y-2">
                  {invoice.customer?.company && (
                    <div className="flex items-start">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <span>{invoice.customer.company}</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span>{invoice.customer?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <AtSymbolIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span>{invoice.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span>{invoice.customer?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <span>{invoice.customer?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Invoice Date:</h4>
                    <p>{new Date(invoice.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Due Date:</h4>
                    <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Job:</h4>
                    <p>{invoice.job?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Job Completed:</h4>
                    <p>{invoice.job?.completionDate ? new Date(invoice.job.completionDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Technician:</h4>
                    <p>{invoice.technician?.name || 'N/A'}</p>
                  </div>
                  {'paymentMethod' in invoice && invoice.paymentMethod && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Payment Method:</h4>
                      <p>{invoice.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Job Description</h3>
              <p className="text-gray-700">{invoice.job?.description || 'N/A'}</p>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Line Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
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
                        Tax Rate
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {item.taxRate}%
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2 lg:w-1/3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between py-2 text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm border-b">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.taxTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {'notes' in invoice && invoice.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <p className="text-gray-700 italic">{invoice.notes}</p>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="border-t pt-8">
              <h3 className="text-lg font-medium mb-4">Payment Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Bank Transfer</h4>
                  <p className="text-sm mb-1">Account Name: InField Works LLC</p>
                  <p className="text-sm mb-1">Account Number: XXXX-XXXX-1234</p>
                  <p className="text-sm mb-1">Bank: National Business Bank</p>
                  <p className="text-sm">Routing: 123456789</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Credit Card</h4>
                  <p className="text-sm mb-1">Pay online at:</p>
                  <p className="text-sm mb-3">https://infieldworks.com/pay</p>
                  <Button 
                    className="flex items-center"
                    disabled={!isOnline || invoice.status === 'Paid' || invoice.status === 'Cancelled'}
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Items */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">{invoice.customer?.name || 'N/A'}</p>
                    {invoice.customer?.company && (
                      <p className="text-gray-500">{invoice.customer.company}</p>
                    )}
                  </div>
                </div>
                {invoice.customer?.id && (
                  <Button 
                    className="w-full"
                    onClick={() => router.push(`/customers/${invoice.customer!.id}`)}
                  >
                    View Customer Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="font-medium">{invoice.job?.title || 'N/A'}</p>
                <p className="text-gray-700 line-clamp-2">{invoice.job?.description || 'N/A'}</p>
                <p className="text-sm text-gray-500">
                  Completed: {invoice.job?.completionDate ? new Date(invoice.job.completionDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {invoice.job?.id && (
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/jobs/${invoice.job!.id}`)}
                >
                  View Job Details
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
