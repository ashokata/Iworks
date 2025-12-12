'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { customerService, Customer } from '@/services/customerService';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  TagIcon, 
  BuildingOfficeIcon,
  HomeIcon,
  UserCircleIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  TableCellsIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function CustomersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterLastName, setFilterLastName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  const {
    data: customers,
    isLoading: isLoadingCustomers,
    isError,
    error,
    refetch,
    status,
    fetchStatus
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: true,
    retry: false,
    refetchOnWindowFocus: false, // Don't auto-refetch, rely on manual invalidation
    refetchOnMount: true, // Only refetch on mount if data is stale
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Pre-populate individual customer cache when customers data is loaded
  useEffect(() => {
    if (customers && customers.length > 0) {
      customers.forEach((customer: Customer) => {
        // Set each customer in the cache so edit pages don't need to refetch
        queryClient.setQueryData(['customer', customer.id], customer);
      });
    }
  }, [customers, queryClient]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle scroll to show/hide pagination based on position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show only top pagination when near the top (within 300px)
      // Show only bottom pagination when near the bottom (within 300px from bottom)
      // Don't show both at the same time
      const nearTop = scrollTop < 300;
      const nearBottom = scrollTop + windowHeight >= documentHeight - 300;
      
      if (nearTop && !nearBottom) {
        setShowTopPagination(true);
        setShowBottomPagination(false);
      } else if (nearBottom && !nearTop) {
        setShowTopPagination(false);
        setShowBottomPagination(true);
      } else if (nearTop && nearBottom) {
        // If page is short enough to be both near top and bottom, show only top
        setShowTopPagination(true);
        setShowBottomPagination(false);
      } else {
        // In the middle, show neither
        setShowTopPagination(false);
        setShowBottomPagination(false);
      }
    };

    handleScroll(); // Check initial position
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Handle customer deletion (archive)
  const deleteCustomerMutation = useMutation({
        mutationFn: (id: string) => customerService.deleteCustomer(id),
    onMutate: async (deletedId) => {
      console.log('[Delete] Starting delete for ID:', deletedId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });
      
      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData<Customer[]>(['customers']);
      console.log('[Delete] Previous customers count:', previousCustomers?.length || 0);
      
      // Optimistically remove the customer from the UI
      if (previousCustomers) {
        const newCustomers = previousCustomers.filter(c => c.id !== deletedId);
        console.log('[Delete] Optimistically updating UI, new count:', newCustomers.length);
        queryClient.setQueryData(['customers'], newCustomers);
      }
      
      // Return a context object with the snapshotted value
      return { previousCustomers };
    },
    onSuccess: async (data, deletedId) => {
      console.log('[Delete] Customer deleted successfully from API, ID:', deletedId);
      console.log('[Delete] Forcing refetch to sync with backend...');
      
      // Remove all cached queries
      queryClient.removeQueries({ queryKey: ['customers'] });
      
      // Force an immediate refetch
      await refetch();
      console.log('[Delete] Refetch complete');
    },
    onError: (error: any, deletedId, context) => {
      console.error('[Delete] Failed to delete customer:', error);
      
      // Rollback to previous data on error
      if (context?.previousCustomers) {
        console.log('[Delete] Rolling back optimistic update');
        queryClient.setQueryData(['customers'], context.previousCustomers);
      }
      
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to delete customer. Please try again.';
      alert(`Error: ${errorMessage}`);
    },
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const handleDeleteCustomer = (id: string, name?: string) => {
    console.log('[Delete] Requesting confirmation for customer:', id, name);
    setDeleteConfirmId(id);
    setDeleteConfirmName(name || 'this customer');
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      console.log('[Delete] Confirmed deletion for ID:', deleteConfirmId);
      deleteCustomerMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
  };

  // Filter customers based on search term and filter fields
  const filteredCustomers = customers?.filter((customer: Customer) => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      (customer.first_name && customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.last_name && customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.mobile_number && customer.mobile_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by customer ID
    const matchesCustomerId = !filterCustomerId || (customer.id && customer.id.toLowerCase().includes(filterCustomerId.toLowerCase()));
    
    // Filter by first name
    const matchesFirstName = !filterFirstName || (customer.first_name && customer.first_name.toLowerCase().includes(filterFirstName.toLowerCase()));
    
    // Filter by last name
    const matchesLastName = !filterLastName || (customer.last_name && customer.last_name.toLowerCase().includes(filterLastName.toLowerCase()));
    
    // Filter by email
    const matchesEmail = !filterEmail || (customer.email && customer.email.toLowerCase().includes(filterEmail.toLowerCase()));
    
    return matchesSearch && matchesCustomerId && matchesFirstName && matchesLastName && matchesEmail;
  });

  // Pagination logic
  const totalPages = Math.ceil((filteredCustomers?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCustomerId, filterFirstName, filterLastName, filterEmail, searchTerm]);

  if (authLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Helper function to get primary address
  const getPrimaryAddress = (customer: Customer) => {
    // Handle both wrapped and unwrapped address structures
    const addresses = customer.addresses?.data || customer.addresses || [];
    if (!Array.isArray(addresses) || addresses.length === 0) return null;
    const primaryAddress = addresses.find((addr: any) => addr.isPrimary);
    return primaryAddress || addresses[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Customers</h2>
            <p className="text-gray-600 mt-1">Manage your customer base</p>
          </div>
          <div className="flex items-center space-x-4">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <Button
              variant={showFilters ? "warning" : "default"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant={viewMode === 'card' ? "warning" : "default"}
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
            >
              {viewMode === 'table' ? (
                <>
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Matrix View
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  Grid View
                </>
              )}
            </Button>
            <Button
              variant="success"
              onClick={() => router.push('/customers/new')}
              disabled={!isOnline}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Filter Customers
                </h3>
                <div className="flex gap-2">
                  {(filterCustomerId || filterFirstName || filterLastName || filterEmail) && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        setFilterCustomerId('');
                        setFilterFirstName('');
                        setFilterLastName('');
                        setFilterEmail('');
                      }}
                    >
                      Clear Filters ({[filterCustomerId, filterFirstName, filterLastName, filterEmail].filter(Boolean).length})
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer ID</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Customer ID..."
                      className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterCustomerId}
                      onChange={(e) => setFilterCustomerId(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="First Name..."
                      className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterFirstName}
                      onChange={(e) => setFilterFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Last Name..."
                      className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterLastName}
                      onChange={(e) => setFilterLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Email..."
                      className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterEmail}
                      onChange={(e) => setFilterEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {isLoadingCustomers ? (
        <div className="p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (isError || (!isLoadingCustomers && !customers)) ? (
        <div className="bg-white rounded-lg shadow p-12 border-2 border-red-200">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4">
              <svg className="h-16 w-16 mx-auto" viewBox="0 0 24 24" fill="none">
                <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2Z" fill="#EF4444"/>
                <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-2">Failed to load customers</p>
            <p className="text-gray-500 mb-2 text-center">There was an error connecting to the API</p>
            <p className="text-xs text-gray-400 mb-4 text-center max-w-md">
              {error instanceof Error ? error.message : 'Request failed with status code 500'}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Check browser console (F12) for detailed error logs
            </p>
            <Button onClick={() => refetch()}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : !customers || customers.length === 0 || filteredCustomers?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <UserCircleIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Available</h3>
            <p className="text-gray-500 mb-4 text-center">
              {searchTerm || filterCustomerId || filterFirstName || filterLastName || filterEmail
                ? 'No customers match your search criteria'
                : 'No customers found. Create your first customer to get started.'}
            </p>
            {(searchTerm || filterCustomerId || filterFirstName || filterLastName || filterEmail) ? (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCustomerId('');
                  setFilterFirstName('');
                  setFilterLastName('');
                  setFilterEmail('');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push('/customers/new')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Top Pagination */}
          {showTopPagination && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, filteredCustomers?.length || 0)} of{' '}
                    {filteredCustomers?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {
                  paginatedCustomers?.map((customer: Customer) => {
                    const primaryAddress = getPrimaryAddress(customer);
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              {customer.type === 'business' ? 
                                <BuildingOfficeIcon className="h-5 w-5 text-blue-600" /> :
                                <HomeIcon className="h-5 w-5 text-blue-600" />
                              }
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer.display_name || '-'}
                                {customer.archived && (
                                  <span className="ml-2 text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                                    Archived
                                  </span>
                                )}
                              </div>
                              {customer.company && (
                                <div className="text-sm text-gray-500">{customer.company}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{customer.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.mobile_number || customer.home_number || customer.work_number || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{primaryAddress ? primaryAddress.city : '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.type === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {customer.type ? (customer.type.charAt(0).toUpperCase() + customer.type.slice(1)) : 'Homeowner'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(customer.tags?.data || customer.tags || []).length ? (customer.tags?.data || customer.tags || []).slice(0, 2).map((tag: string) => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                <TagIcon className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            )) : (
                              <span className="text-sm text-gray-400">No tags</span>
                            )}
                            {(customer.tags?.data || customer.tags || []).length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{(customer.tags?.data || customer.tags || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link
                              href={`/customers/view/${customer.id}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/customers/edit/${customer.id}`}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id, customer.display_name || `${customer.first_name} ${customer.last_name}`)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              disabled={deleteCustomerMutation.isPending || !isOnline}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination */}
          {showBottomPagination && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, filteredCustomers?.length || 0)} of{' '}
                    {filteredCustomers?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        <div>
          {/* Top Pagination for Card View */}
          {showTopPagination && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="bg-white rounded-t-lg shadow-md border border-gray-200 px-6 py-4 mb-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, filteredCustomers?.length || 0)} of{' '}
                    {filteredCustomers?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            {paginatedCustomers?.map((customer: Customer) => {
              const primaryAddress = getPrimaryAddress(customer);
              
              return (
                <div
                  key={customer.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5">
                    {/* Header with Icon and Type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          customer.type === 'business' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {customer.type === 'business' ? (
                            <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
                          ) : (
                            <HomeIcon className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {customer.display_name || 'Unnamed Customer'}
                          </h3>
                          {customer.company && (
                            <p className="text-xs text-gray-500 truncate">{customer.company}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.type === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.type ? (customer.type.charAt(0).toUpperCase() + customer.type.slice(1)) : 'Home'}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3">
                      {customer.email && (
                        <div className="flex items-center text-xs text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {(customer.mobile_number || customer.home_number || customer.work_number) && (
                        <div className="flex items-center text-xs text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {customer.mobile_number || customer.home_number || customer.work_number}
                          </span>
                        </div>
                      )}
                      {primaryAddress && primaryAddress.city && (
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{primaryAddress.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {(customer.tags?.data || customer.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(customer.tags?.data || customer.tags || []).slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {(customer.tags?.data || customer.tags || []).length > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                            +{(customer.tags?.data || customer.tags || []).length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Link
                        href={`/customers/view/${customer.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/customers/edit/${customer.id}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id, customer.display_name || `${customer.first_name} ${customer.last_name}`)}
                        className="text-xs font-medium text-red-600 hover:text-red-900 transition-colors"
                        disabled={deleteCustomerMutation.isPending || !isOnline}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination for Card View */}
          {showBottomPagination && filteredCustomers && filteredCustomers.length > 0 && (
            <div className="bg-white rounded-b-lg shadow-md border border-gray-200 px-6 py-4 mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, filteredCustomers?.length || 0)} of{' '}
                    {filteredCustomers?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={cancelDelete} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      Delete Customer
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-medium text-gray-900">{deleteConfirmName}</span>? 
                        This action will archive the customer and they will no longer appear in your customer list.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteCustomerMutation.isPending}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={cancelDelete}
                  disabled={deleteCustomerMutation.isPending}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
