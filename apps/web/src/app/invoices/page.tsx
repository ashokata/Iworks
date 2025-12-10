'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { invoiceService } from '@/services/invoiceService';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  number: string;
  customer: {
    id: string;
    name: string;
    company?: string;
  };
  job: {
    id: string;
    title: string;
  };
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Canceled';
  paymentMethod?: string;
  paymentDate?: string;
  notes?: string;
}

export default function InvoicesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | 'asc' | 'desc'>('all');
  const [isOnline, setIsOnline] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Fetch invoices
  const { data: invoices, isLoading, isError, error, refetch } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const result = await invoiceService.getAllInvoices();
      return result as unknown as Invoice[];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Filter invoices based on all filters
  const filteredInvoices = invoices?.filter(invoice => {
    // Search query filter
    const matchesSearch = !searchQuery || 
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()); 
    
    // Status filter
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter === 'thisMonth') {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const invoiceDate = new Date(invoice.issueDate);
      matchesDate = invoiceDate.getMonth() === currentMonth && 
                    invoiceDate.getFullYear() === currentYear;
    } else if (dateFilter === 'lastMonth') {
      const currentDate = new Date();
      const lastMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
      const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      const invoiceDate = new Date(invoice.issueDate);
      matchesDate = invoiceDate.getMonth() === lastMonth && 
                    invoiceDate.getFullYear() === lastMonthYear;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort invoices if amount filter is active
  const sortedInvoices = filteredInvoices ? [...filteredInvoices] : [];
  if (amountFilter === 'asc') {
    sortedInvoices.sort((a, b) => a.amount - b.amount);
  } else if (amountFilter === 'desc') {
    sortedInvoices.sort((a, b) => b.amount - a.amount);
  }

  // Calculate totals
  const totalAmount = sortedInvoices.reduce((sum, invoice) => {
    // Only include paid and sent invoices in total
    if (invoice.status === 'Paid' || invoice.status === 'Sent' || invoice.status === 'Overdue') {
      return sum + invoice.amount;
    }
    return sum;
  }, 0);

  const outstandingAmount = sortedInvoices.reduce((sum, invoice) => {
    // Only include sent and overdue invoices in outstanding
    if (invoice.status === 'Sent' || invoice.status === 'Overdue') {
      return sum + invoice.amount;
    }
    return sum;
  }, 0);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      case 'Canceled':
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
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-blue-100 mt-1">Manage your invoices and payments</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
                className="bg-white text-[#0f118a] hover:bg-gray-100"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{sortedInvoices.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(outstandingAmount)}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
              {(statusFilter || dateFilter !== 'all' || amountFilter !== 'all') && (
                <span className="ml-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </Button>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {}} 
              disabled={!isOnline}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => router.push('/invoices/create')}
              disabled={!isOnline}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {isFilterOpen && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Filter Invoices</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsFilterOpen(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={statusFilter || ''}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value as any)}
                  >
                    <option value="all">No Sorting</option>
                    <option value="asc">Lowest First</option>
                    <option value="desc">Highest First</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter(null);
                    setDateFilter('all');
                    setAmountFilter('all');
                  }}
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-red-600 mb-4">
                          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="font-medium text-gray-900 mb-2">Failed to load invoices</p>
                        <p className="text-gray-500 mb-2 text-center">There was an error connecting to the API</p>
                        <p className="text-xs text-gray-400 mb-4 text-center max-w-md">
                          {error instanceof Error ? error.message : 'Unknown error occurred'}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                          Check browser console (F12) for detailed error logs
                        </p>
                        <Button onClick={() => refetch()}>
                          <ArrowPathIcon className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : sortedInvoices.length > 0 ? (
                  sortedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/invoices/${invoice.id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{invoice.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{invoice.customer?.name || 'Unknown Customer'}</div>
                        {invoice.customer?.company && (
                          <div className="text-gray-500 text-sm">{invoice.customer.company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{invoice.job?.title || 'Unknown Job'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'Unknown'}</div>
                        <div className="text-gray-500 text-sm">
                          Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoices/${invoice.id}`);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-500 font-medium">No invoices found</p>
                      {searchQuery || statusFilter || dateFilter !== 'all' ? (
                        <p className="text-gray-500">Try adjusting your filters</p>
                      ) : (
                        <Button className="mt-4" onClick={() => router.push('/invoices/create')}>
                          Create Your First Invoice
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
