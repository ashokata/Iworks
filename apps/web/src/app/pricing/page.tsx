'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { pricingService } from '@/services/pricingService';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  CalendarIcon,
  TagIcon,
  ArrowPathIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Pricing } from '@/types';

export default function PricingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPricingId, setFilterPricingId] = useState('');
  const [filterCounty, setFilterCounty] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<Array<{field: string, direction: 'asc' | 'desc'}>>([]);

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
      
      const nearTop = scrollTop < 300;
      const nearBottom = scrollTop + windowHeight >= documentHeight - 300;
      
      if (nearTop && !nearBottom) {
        setShowTopPagination(true);
        setShowBottomPagination(false);
      } else if (nearBottom && !nearTop) {
        setShowTopPagination(false);
        setShowBottomPagination(true);
      } else if (nearTop && nearBottom) {
        setShowTopPagination(true);
        setShowBottomPagination(false);
      } else {
        setShowTopPagination(false);
        setShowBottomPagination(false);
      }
    };

    handleScroll();
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

  // Fetch pricing data
  const { data: pricingRecords, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => pricingService.getAllPricing(),
    enabled: isAuthenticated,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Debug logging
  console.log('[Pricing Page Debug] isLoading:', isLoading);
  console.log('[Pricing Page Debug] isError:', isError);
  console.log('[Pricing Page Debug] error:', error);
  console.log('[Pricing Page Debug] pricing:', pricingRecords);

  // Filter pricing based on search query and filters
  const filteredPricing = pricingRecords?.filter(pricing => {
    const matchesSearch = !searchQuery || 
      pricing.county?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pricing.job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPricingId = !filterPricingId || pricing.id.toString().includes(filterPricingId);
    const matchesCounty = !filterCounty || (pricing.county && pricing.county.toLowerCase().includes(filterCounty.toLowerCase()));
    
    return matchesSearch && matchesPricingId && matchesCounty;
  });

  // Sort pricing with multiple criteria
  const sortedPricing = filteredPricing?.slice().sort((a, b) => {
    if (sortCriteria.length === 0) return 0;
    
    for (const criteria of sortCriteria) {
      let aValue: any;
      let bValue: any;
      
      switch (criteria.field) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'subTotal':
          aValue = a.subTotal;
          bValue = b.subTotal;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'county':
          aValue = a.county?.toLowerCase() || '';
          bValue = b.county?.toLowerCase() || '';
          break;
        case 'createdDate':
          aValue = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          bValue = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          break;
        default:
          continue;
      }
      
      if (aValue < bValue) return criteria.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return criteria.direction === 'asc' ? 1 : -1;
    }
    
    return 0;
  });

  // Handle sort for table headers with specific direction
  const handleSortByDirection = (field: string, direction: 'asc' | 'desc', e: React.MouseEvent) => {
    e.stopPropagation();
    const existingIndex = sortCriteria.findIndex(c => c.field === field);
    
    if (direction === 'asc') {
      if (existingIndex >= 0 && sortCriteria[existingIndex].direction === 'asc') {
        setSortCriteria(sortCriteria.filter((_, i) => i !== existingIndex));
      } else if (existingIndex >= 0) {
        const updated = [...sortCriteria];
        updated[existingIndex].direction = 'asc';
        setSortCriteria(updated);
      } else {
        setSortCriteria([...sortCriteria, { field, direction: 'asc' }]);
      }
    } else {
      if (existingIndex >= 0 && sortCriteria[existingIndex].direction === 'desc') {
        setSortCriteria(sortCriteria.filter((_, i) => i !== existingIndex));
      } else if (existingIndex >= 0) {
        const updated = [...sortCriteria];
        updated[existingIndex].direction = 'desc';
        setSortCriteria(updated);
      } else {
        setSortCriteria([...sortCriteria, { field, direction: 'desc' }]);
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil((sortedPricing?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPricing = sortedPricing?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPricingId, filterCounty, searchQuery]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Pricing</h2>
            <p className="text-gray-600 mt-1">Manage pricing and calculations</p>
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
                  Card View
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  Table View
                </>
              )}
            </Button>
            <Button
              variant="success"
              onClick={() => router.push('/pricing/create')}
              disabled={!isOnline}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Pricing
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
                Filter Pricing
              </h3>
              <div className="flex gap-2">
                {(filterPricingId || filterCounty) && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      setFilterPricingId('');
                      setFilterCounty('');
                    }}
                  >
                    Clear Filters ({[filterPricingId, filterCounty].filter(Boolean).length})
                  </Button>
                )}
                {viewMode === 'table' && sortCriteria.length > 0 && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setSortCriteria([])}
                  >
                    Clear Sorts ({sortCriteria.length})
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pricing ID</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pricing ID..."
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={filterPricingId}
                    onChange={(e) => setFilterPricingId(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">County</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="County..."
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={filterCounty}
                    onChange={(e) => setFilterCounty(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search all..."
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Card className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Fetch</h3>
            <p className="text-sm text-gray-500 mb-4">
              {!isOnline 
                ? 'You are currently offline. Please check your internet connection.' 
                : 'Unable to load pricing records from the server. Please try again.'}
            </p>
            <Button onClick={() => refetch()}>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </Card>
        )}

        {/* Data View */}
        {!isLoading && !isError && paginatedPricing && paginatedPricing.length > 0 && viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Table content will go here */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Pricing ID
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('id', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'id')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('id', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'id')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        SubTotal
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('subTotal', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'subTotal')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('subTotal', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'subTotal')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Total
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('total', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'total')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('total', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'total')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">County</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPricing.map((pricing, index) => (
                    <tr 
                      key={pricing.id} 
                      className={`hover:bg-blue-50 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      onDoubleClick={() => router.push(`/pricing/${pricing.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">#{pricing.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pricing.job ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{pricing.job.title}</div>
                            <div className="text-gray-500">Job #{pricing.job.id}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No job</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${pricing.subTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${pricing.discount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${pricing.taxAmount.toFixed(2)} ({pricing.taxRate}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ${pricing.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pricing.county || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/pricing/${pricing.id}`);
                            }}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/pricing/${pricing.id}/edit`);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!paginatedPricing || paginatedPricing.length === 0) && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <CurrencyDollarIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pricing Records</h3>
              <p className="text-gray-500 mb-4 text-center">
                {searchQuery || filterPricingId || filterCounty
                  ? 'No pricing records match your search criteria'
                  : 'No pricing records found. Create your first pricing record to get started.'}
              </p>
              {(searchQuery || filterPricingId || filterCounty) ? (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterPricingId('');
                    setFilterCounty('');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => router.push('/pricing/create')}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Pricing
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
