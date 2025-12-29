'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { estimateService } from '@/services/estimateService';
import { 
  PlusIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

// Helper to format decimal values from Prisma
const formatCurrency = (value: any): string => {
  const num = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
  return num.toFixed(2);
};

const formatNumber = (value: any, decimals: number = 0): string => {
  const num = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
  return num.toFixed(decimals);
};

export default function EstimatesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimateService.list(),
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter estimates
  const filteredEstimates = estimates?.filter((estimate: any) => {
    const matchesSearch = 
      searchTerm === '' ||
      estimate.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.estimateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || estimate.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil((filteredEstimates?.length || 0) / itemsPerPage);
  const paginatedEstimates = filteredEstimates?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = {
    total: estimates?.length || 0,
    draft: estimates?.filter((e: any) => e.status === 'DRAFT').length || 0,
    sent: estimates?.filter((e: any) => e.status === 'SENT').length || 0,
    approved: estimates?.filter((e: any) => e.status === 'APPROVED').length || 0,
    declined: estimates?.filter((e: any) => e.status === 'DECLINED').length || 0,
    totalValue: estimates?.reduce((sum: number, e: any) => sum + (e.total || 0), 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track all your estimates
              </p>
            </div>
            <button
              onClick={() => router.push('/estimates/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Estimate
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Estimates</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-gray-100"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.draft}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-blue-100"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sent</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.sent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full bg-green-100"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.approved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-green-600 font-bold">$</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      ${formatNumber(stats.totalValue, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search estimates..."
                  />
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-md ${
                    viewMode === 'card'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-md ${
                    viewMode === 'table'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <TableCellsIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="VIEWED">Viewed</option>
                      <option value="APPROVED">Approved</option>
                      <option value="DECLINED">Declined</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estimates List */}
        {!paginatedEstimates || paginatedEstimates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || filterStatus !== 'all' ? 'No estimates found' : 'No estimates'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new estimate.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/estimates/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Estimate
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {paginatedEstimates.map((estimate: any) => (
                <li
                  key={estimate.id}
                  onClick={() => router.push(`/estimates/${estimate.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-blue-600 truncate">
                            {estimate.title || `Estimate #${estimate.estimateNumber}`}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                estimate.status
                              )}`}
                            >
                              {estimate.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>
                              Created: {new Date(estimate.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {estimate.validUntil && (
                            <div className="ml-6 flex items-center">
                              <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              <span>
                                Valid until: {new Date(estimate.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {estimate.customer && (
                          <div className="mt-2 text-sm text-gray-600">
                            Customer: {estimate.customer.firstName} {estimate.customer.lastName}
                          </div>
                        )}
                        {estimate.message && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {estimate.message}
                          </p>
                        )}
                        
                        {/* Options and Line Items Summary */}
                        {estimate.options && estimate.options.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {estimate.options.map((option: any) => (
                              <div key={option.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {option.name}
                                    {option.isRecommended && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Recommended
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-sm font-semibold text-gray-900">
                                    ${formatCurrency(option.total)}
                                  </span>
                                </div>
                                {option.description && (
                                  <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                                )}
                                {option.lineItems && option.lineItems.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                      Line Items ({option.lineItems.length}):
                                    </p>
                                    {option.lineItems.map((item: any) => (
                                      <div key={item.id} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-2">
                                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            item.type === 'SERVICE' ? 'bg-blue-50 text-blue-700' :
                                            item.type === 'MATERIAL' ? 'bg-green-50 text-green-700' :
                                            item.type === 'LABOR' ? 'bg-purple-50 text-purple-700' :
                                            item.type === 'EQUIPMENT' ? 'bg-orange-50 text-orange-700' :
                                            'bg-gray-50 text-gray-700'
                                          }`}>
                                            {item.type}
                                          </span>
                                          <span className="text-gray-700">{item.name}</span>
                                          <span className="text-gray-500">x{item.quantity}</span>
                                          {item.isOptional && (
                                            <span className="text-gray-400 italic">(Optional)</span>
                                          )}
                                        </div>
                                        <span className="text-gray-900 font-medium">
                                          ${(item.quantity * item.unitPrice).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-6 text-right flex-shrink-0">
                        <p className="text-2xl font-semibold text-gray-900">
                          ${formatCurrency(estimate.total || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                        {estimate.options && estimate.options.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {estimate.options.length} option{estimate.options.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEstimates.map((estimate: any) => (
                  <tr
                    key={estimate.id}
                    onClick={() => router.push(`/estimates/${estimate.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {estimate.title || `Estimate #${estimate.estimateNumber}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        #{estimate.estimateNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {estimate.customer?.firstName} {estimate.customer?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {estimate.customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          estimate.status
                        )}`}
                      >
                        {estimate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {estimate.validUntil
                        ? new Date(estimate.validUntil).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ${formatCurrency(estimate.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredEstimates?.length || 0)}
                  </span>{' '}
                  of <span className="font-medium">{filteredEstimates?.length || 0}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
