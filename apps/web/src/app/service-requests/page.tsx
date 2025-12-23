'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';

const urgencyColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

const statusColors = {
  NEW: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  NEW: ExclamationTriangleIcon,
  ASSIGNED: ArrowPathIcon,
  IN_PROGRESS: ArrowPathIcon,
  COMPLETED: CheckCircleIcon,
  CANCELLED: XCircleIcon,
};

export default function ServiceRequestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState<'voice' | 'all'>('voice');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['service-requests', activeTab, currentPage],
    queryFn: () =>
      serviceRequestService.list({
        createdSource: activeTab === 'voice' ? 'VOICE_AGENT' : undefined,
        page: currentPage,
        pageSize: itemsPerPage,
      }),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Fetch counts for tabs (independent of active tab)
  const { data: voiceCountData } = useQuery({
    queryKey: ['service-requests-voice-count'],
    queryFn: () =>
      serviceRequestService.list({
        createdSource: 'VOICE_AGENT',
        page: 1,
        pageSize: 1,
      }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCountData } = useQuery({
    queryKey: ['service-requests-all-count'],
    queryFn: () =>
      serviceRequestService.list({
        page: 1,
        pageSize: 1,
      }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

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

  // Handle scroll to show/hide pagination
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

  const serviceRequests = data?.serviceRequests || [];

  // Get counts from separate queries
  const voiceRequestsCount = voiceCountData?.pagination?.total || 0;
  const allRequestsCount = allCountData?.pagination?.total || 0;

  // Filter service requests
  const filteredRequests = serviceRequests.filter((request: ServiceRequest) => {
    const matchesSearch = !searchTerm || 
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || request.status === filterStatus;
    const matchesUrgency = !filterUrgency || request.urgency === filterUrgency;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterUrgency, activeTab]);

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await serviceRequestService.delete(id);
      setDeleteConfirmId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete service request:', error);
      alert('Failed to delete service request');
    }
  };

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

  const PaginationControls = () => (
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
            {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length}
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Service Requests</h1>
              <p className="text-sm text-blue-100">View service requests created by voice calls and other sources</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="bg-white text-[#1a2a6c] hover:bg-gray-100"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-2 sm:mb-3 gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border text-xs sm:text-sm font-medium transition-all hover:bg-opacity-100"
              style={{
                borderColor: '#06118d',
                color: showFilters ? 'white' : '#06118d',
                backgroundColor: showFilters ? '#06118d' : 'white'
              }}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border text-xs sm:text-sm font-medium transition-all"
              style={{
                borderColor: '#06118d',
                color: '#06118d',
                backgroundColor: 'white'
              }}
            >
              {viewMode === 'table' ? (
                <>
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Matrix View</span>
                  <span className="sm:hidden">Matrix</span>
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Grid View</span>
                  <span className="sm:hidden">Grid</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/service-requests/new')}
              disabled={!isOnline}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              style={{
                backgroundColor: '#06118d',
                color: 'white'
              }}
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Service Request</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('voice')}
                className={`${
                  activeTab === 'voice'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                Voice Agent Requests
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                  activeTab === 'voice' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {voiceRequestsCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                All Requests
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                  activeTab === 'all' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {allRequestsCount}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
                Filter Service Requests
              </h3>
              {(searchTerm || filterStatus || filterUrgency) && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterUrgency('');
                  }}
                >
                  Clear Filters ({[searchTerm, filterStatus, filterUrgency].filter(Boolean).length})
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Title, description, customer..."
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                >
                  <option value="">All Urgencies</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-12 border-2 border-red-200">
            <div className="flex flex-col items-center justify-center">
              <p className="font-medium text-gray-900 mb-2">Failed to load service requests</p>
              <p className="text-gray-500 mb-4">There was an error connecting to the API</p>
              <Button onClick={() => refetch()}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : !filteredRequests || filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <PhoneIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests Found</h3>
              <p className="text-gray-500 mb-4 text-center">
                {searchTerm || filterStatus || filterUrgency
                  ? 'No service requests match your search criteria'
                  : activeTab === 'voice'
                  ? 'No service requests have been created via voice calls yet.'
                  : 'No service requests found. Create your first service request to get started.'}
              </p>
              {(searchTerm || filterStatus || filterUrgency) ? (
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterUrgency('');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => router.push('/service-requests/new')}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Service Request
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Top Pagination */}
            {showTopPagination && filteredRequests.length > 0 && <PaginationControls />}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problem Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRequests.map((request: ServiceRequest) => {
                    const StatusIcon = statusIcons[request.status];
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">{request.title}</p>
                                {request.requestNumber && (
                                  <span className="text-xs text-gray-500">#{request.requestNumber}</span>
                                )}
                              </div>
                              {request.createdSource === 'VOICE_AGENT' && (
                                <span className="mt-1 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  📞 Voice
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {request.customer.firstName} {request.customer.lastName}
                            </p>
                            <p className="text-gray-500">{request.customer.customerNumber}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.customer.mobilePhone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {request.problemType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${urgencyColors[request.urgency]}`}>
                            {request.urgency}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link
                              href={`/service-requests/view/${request.id}`}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/service-requests/edit/${request.id}`}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              Edit
                            </Link>
                            {request.createdSource !== 'VOICE_AGENT' && (
                              <button
                                onClick={() => setDeleteConfirmId(request.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                disabled={!isOnline}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            {showBottomPagination && filteredRequests.length > 0 && <PaginationControls />}
          </div>
        ) : (
          /* Card View */
          <div className="space-y-4">
            {paginatedRequests.map((request: ServiceRequest) => {
              const StatusIcon = statusIcons[request.status];
              return (
                <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                        {request.requestNumber && (
                          <span className="text-sm text-gray-500">#{request.requestNumber}</span>
                        )}
                        {request.createdSource === 'VOICE_AGENT' && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            📞 Voice Call
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{request.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${urgencyColors[request.urgency]}`}>
                        {request.urgency}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.customer.firstName} {request.customer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{request.customer.customerNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">{request.customer.mobilePhone || 'N/A'}</p>
                      </div>
                    </div>

                    {request.serviceAddress && (
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">{request.serviceAddress.street}</p>
                          <p className="text-xs text-gray-500">
                            {request.serviceAddress.city}, {request.serviceAddress.state}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {request.problemType}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/service-requests/view/${request.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/service-requests/edit/${request.id}`}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        Edit
                      </Link>
                      {request.createdSource !== 'VOICE_AGENT' && (
                        <button
                          onClick={() => setDeleteConfirmId(request.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          disabled={!isOnline}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setDeleteConfirmId(null)} />
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
                      Delete Service Request
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this service request? This action cannot be undone and all associated data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={!isOnline}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

