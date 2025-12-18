'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect';
import { jobService } from '@/services/jobService';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  UserIcon,
  MapPinIcon,
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
  ArrowsUpDownIcon,
  PlayIcon,
  StopIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Job } from '@/types';

export default function JobsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Helper function to get initial state from sessionStorage
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = sessionStorage.getItem(`jobs_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterJobId, setFilterJobId] = useState(() => getInitialState('filterJobId', ''));
  const [filterTitle, setFilterTitle] = useState(() => getInitialState('filterTitle', ''));
  const [filterLocation, setFilterLocation] = useState(() => getInitialState('filterLocation', ''));
  const [filterAssignedTo, setFilterAssignedTo] = useState(() => getInitialState('filterAssignedTo', ''));
  const [statusFilter, setStatusFilter] = useState<string[]>(() => getInitialState('statusFilter', []));
  const [priorityFilter, setPriorityFilter] = useState<string[]>(() => getInitialState('priorityFilter', []));
  const [isOnline, setIsOnline] = useState(true);
  const [showFilters, setShowFilters] = useState(() => getInitialState('showFilters', false));
  const [currentPage, setCurrentPage] = useState(() => getInitialState('currentPage', 1));
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => getInitialState('viewMode', 'table'));
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<Array<{field: string, direction: 'asc' | 'desc'}>>(() => getInitialState('sortCriteria', []));

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_filterJobId', JSON.stringify(filterJobId));
  }, [filterJobId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_filterTitle', JSON.stringify(filterTitle));
  }, [filterTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_filterLocation', JSON.stringify(filterLocation));
  }, [filterLocation]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_filterAssignedTo', JSON.stringify(filterAssignedTo));
  }, [filterAssignedTo]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_statusFilter', JSON.stringify(statusFilter));
  }, [statusFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_priorityFilter', JSON.stringify(priorityFilter));
  }, [priorityFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_showFilters', JSON.stringify(showFilters));
  }, [showFilters]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_currentPage', JSON.stringify(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_viewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('jobs_sortCriteria', JSON.stringify(sortCriteria));
  }, [sortCriteria]);

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

  // Fetch jobs data
  const { data: jobs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.getAllJobs(),
    enabled: isAuthenticated,
    retry: false,
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Debug logging
  console.log('[Jobs Page Debug] isLoading:', isLoading);
  console.log('[Jobs Page Debug] isError:', isError);
  console.log('[Jobs Page Debug] error:', error);
  console.log('[Jobs Page Debug] jobs:', jobs);

  // Filter jobs based on search query and filters
  const filteredJobs = jobs?.filter(job => {
    // Search filter
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by Job ID
    const matchesJobId = !filterJobId || job.id.toString().includes(filterJobId);
    
    // Filter by Title
    const matchesTitle = !filterTitle || job.title.toLowerCase().includes(filterTitle.toLowerCase());
    
    // Filter by Location
    const matchesLocation = !filterLocation || (job.location && job.location.toLowerCase().includes(filterLocation.toLowerCase()));
    
    // Filter by Assigned To
    const matchesAssignedTo = !filterAssignedTo || (job.assignedTo && job.assignedTo.toLowerCase().includes(filterAssignedTo.toLowerCase()));
    
    // Status filter - supports multiple selections
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status);
    
    // Priority filter - supports multiple selections
    const matchesPriority = priorityFilter.length === 0 || (job.priority && priorityFilter.includes(job.priority));
    
    return matchesSearch && matchesJobId && matchesTitle && matchesLocation && matchesAssignedTo && matchesStatus && matchesPriority;
  });

  // Sort jobs with multiple criteria (only in table view)
  const sortedJobs = filteredJobs?.slice().sort((a, b) => {
    // Skip sorting in card view
    if (viewMode === 'card' || sortCriteria.length === 0) return 0;
    
    for (const criteria of sortCriteria) {
      let aValue: any;
      let bValue: any;
      
      switch (criteria.field) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'date':
          aValue = a.date ? new Date(a.date).getTime() : 0;
          bValue = b.date ? new Date(b.date).getTime() : 0;
          break;
        case 'location':
          aValue = a.location?.toLowerCase() || '';
          bValue = b.location?.toLowerCase() || '';
          break;
        case 'assignedTo':
          aValue = a.assignedTo?.toLowerCase() || '';
          bValue = b.assignedTo?.toLowerCase() || '';
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
      // Clicking up arrow
      if (existingIndex >= 0 && sortCriteria[existingIndex].direction === 'asc') {
        // Already asc, remove it
        setSortCriteria(sortCriteria.filter((_, i) => i !== existingIndex));
      } else if (existingIndex >= 0) {
        // Change to asc
        const updated = [...sortCriteria];
        updated[existingIndex].direction = 'asc';
        setSortCriteria(updated);
      } else {
        // Add new with asc
        setSortCriteria([...sortCriteria, { field, direction: 'asc' }]);
      }
    } else {
      // Clicking down arrow
      if (existingIndex >= 0 && sortCriteria[existingIndex].direction === 'desc') {
        // Already desc, remove it
        setSortCriteria(sortCriteria.filter((_, i) => i !== existingIndex));
      } else if (existingIndex >= 0) {
        // Change to desc
        const updated = [...sortCriteria];
        updated[existingIndex].direction = 'desc';
        setSortCriteria(updated);
      } else {
        // Add new with desc
        setSortCriteria([...sortCriteria, { field, direction: 'desc' }]);
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil((sortedJobs?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = sortedJobs?.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterJobId, filterTitle, filterLocation, filterAssignedTo, statusFilter, priorityFilter, searchQuery]);

  // Helper for status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper for priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-green-50 text-green-700';
      case 'Medium':
        return 'bg-blue-50 text-blue-700';
      case 'High':
        return 'bg-yellow-50 text-yellow-700';
      case 'Critical':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Jobs</h1>
              <p className="text-blue-100 mt-1">Manage your jobs and assignments</p>
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
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-2 sm:mb-3 gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
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
              onMouseEnter={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.backgroundColor = '#06118d';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#06118d';
                }
              }}
            >
              <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              <span className="sm:hidden">Filters</span>
            </button>
            <button
              onClick={() => {
                const newMode = viewMode === 'table' ? 'card' : 'table';
                setViewMode(newMode);
                // Clear sort criteria when switching to card view
                if (newMode === 'card') {
                  setSortCriteria([]);
                }
              }}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border text-xs sm:text-sm font-medium transition-all"
              style={{
                borderColor: '#06118d',
                color: '#06118d',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#06118d';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#06118d';
              }}
            >
              {viewMode === 'table' ? (
                <>
                  <Squares2X2Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Matrix View</span>
                  <span className="sm:hidden">Matrix</span>
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Grid View</span>
                  <span className="sm:hidden">Grid</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/jobs/create')}
              disabled={!isOnline}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              style={{
                backgroundColor: '#06118d',
                color: 'white'
              }}
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Add Job
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-gray-200 mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Filter Panel - Full width for both views */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center">
                  <FunnelIcon className="h-4 w-4 mr-2 text-gray-600" />
                  Filter Jobs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(filterJobId || filterTitle || filterLocation || filterAssignedTo || statusFilter.length > 0 || priorityFilter.length > 0) && (
                    <button
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
                      style={{
                        backgroundColor: '#06118d',
                        color: 'white'
                      }}
                      onClick={() => {
                        setFilterJobId('');
                        setFilterTitle('');
                        setFilterLocation('');
                        setFilterAssignedTo('');
                        setStatusFilter([]);
                        setPriorityFilter([]);
                      }}
                    >
                      Clear Filters ({[filterJobId, filterTitle, filterLocation, filterAssignedTo].filter(Boolean).length + (statusFilter.length > 0 && !statusFilter.includes('') ? 1 : 0) + (priorityFilter.length > 0 && !priorityFilter.includes('') ? 1 : 0)})
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Job ID</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Job ID..."
                      className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterJobId}
                      onChange={(e) => setFilterJobId(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Title..."
                      className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Location..."
                      className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assigned To</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Assigned To..."
                      className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                      value={filterAssignedTo}
                      onChange={(e) => setFilterAssignedTo(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <MultiSearchableSelect
                    label="Status"
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'Scheduled', label: 'Scheduled' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Canceled', label: 'Canceled' }
                    ]}
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    placeholder="All Statuses"
                    allLabel="All Statuses"
                  />
                </div>
                <div>
                  <MultiSearchableSelect
                    label="Priority"
                    options={[
                      { value: '', label: 'All Priorities' },
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Critical', label: 'Critical' }
                    ]}
                    value={priorityFilter}
                    onChange={(value) => setPriorityFilter(value)}
                    placeholder="All Priorities"
                  />
                </div>
              </div>
              
              {/* Display Active Filters */}
              {(filterJobId || filterTitle || filterLocation || filterAssignedTo || statusFilter.length > 0 || priorityFilter.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700 flex-shrink-0">Active Filters:</span>
                    {filterJobId && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Job ID:</span> {filterJobId}
                      </span>
                    )}
                    {filterTitle && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Title:</span> {filterTitle}
                      </span>
                    )}
                    {filterLocation && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Location:</span> {filterLocation}
                      </span>
                    )}
                    {filterAssignedTo && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Assigned:</span> {filterAssignedTo}
                      </span>
                    )}
                    {statusFilter.length > 0 && !statusFilter.includes('') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Status:</span> {statusFilter.join(', ')}
                      </span>
                    )}
                    {priorityFilter.length > 0 && !priorityFilter.includes('') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                        <span className="font-medium">Priority:</span> {priorityFilter.join(', ')}
                      </span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">
                      {[filterJobId, filterTitle, filterLocation, filterAssignedTo].filter(Boolean).length + 
                       (statusFilter.length > 0 && !statusFilter.includes('') ? 1 : 0) + 
                       (priorityFilter.length > 0 && !priorityFilter.includes('') ? 1 : 0)} filter{[filterJobId, filterTitle, filterLocation, filterAssignedTo].filter(Boolean).length + 
                       (statusFilter.length > 0 && !statusFilter.includes('') ? 1 : 0) + 
                       (priorityFilter.length > 0 && !priorityFilter.includes('') ? 1 : 0) !== 1 ? 's' : ''} active
                    </span>
                  </div>
                </div>
              )}
            </div>
          
          {/* Summary Footer - Only show in card/matrix view */}
        </div>
        )}

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (isError || (!isLoading && !jobs)) ? (
          <div className={`bg-white rounded-lg shadow p-8 border-2 border-red-200 transition-all ${!showFilters ? 'flex items-center justify-center min-h-[calc(100vh-280px)]' : ''}`}>
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4">
                <svg className="h-16 w-16 mx-auto" viewBox="0 0 24 24" fill="none">
                  <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2Z" fill="#EF4444"/>
                  <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-medium text-gray-900 mb-2">Failed to load jobs</p>
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
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Top Pagination */}
            {showTopPagination && paginatedJobs && paginatedJobs.length > 0 && (
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-2"
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-gray-700 flex items-center">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="text-xs px-2"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs sm:text-xs text-gray-700">
                      {startIndex + 1} to {Math.min(endIndex, sortedJobs?.length || 0)} of{' '}
                      {sortedJobs?.length || 0}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-1.5 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDoubleLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
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
                            className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 border-[#06118d] text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            style={currentPage === pageNumber ? { backgroundColor: '#06118d' } : {}}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-1.5 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDoubleRightIcon className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {/* Table Header */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Job ID
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
                        {sortCriteria.findIndex(c => c.field === 'id') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'id') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Title
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('title', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'title')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('title', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'title')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'title') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'title') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('status', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'status')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('status', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'status')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'status') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'status') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Priority
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('priority', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'priority')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('priority', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'priority')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'priority') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'priority') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('date', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'date')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('date', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'date')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'date') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'date') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Location
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('location', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'location')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('location', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'location')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'location') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'location') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none"
                    >
                      <div className="flex items-center gap-1">
                        Assigned To
                        <div className="flex flex-col">
                          <ChevronUpIcon 
                            onClick={(e) => handleSortByDirection('assignedTo', 'asc', e)}
                            className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'assignedTo')?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                          <ChevronDownIcon 
                            onClick={(e) => handleSortByDirection('assignedTo', 'desc', e)}
                            className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === 'assignedTo')?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                          />
                        </div>
                        {sortCriteria.findIndex(c => c.field === 'assignedTo') >= 0 && (
                          <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                            {sortCriteria.findIndex(c => c.field === 'assignedTo') + 1}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!paginatedJobs || paginatedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    paginatedJobs.map((job, index) => (
                    <tr 
                      key={job.id} 
                      className={`hover:bg-blue-50 transition-all duration-150 cursor-pointer border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      onDoubleClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-bold text-blue-600">#{job.id}</span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{job.title}</div>
                        {job.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={job.description}>{job.description}</div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {job.priority && (
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                            {job.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {job.date ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                              <CalendarIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">{new Date(job.date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {job.location ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1.5 rounded-lg">
                              <MapPinIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-900 font-medium truncate max-w-[150px]" title={job.location}>{job.location}</span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {job.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 p-1.5 rounded-lg">
                              <UserIcon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">{job.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            className="inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                            style={{
                              borderColor: '#06118d',
                              color: '#06118d',
                              backgroundColor: 'white'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/jobs/${job.id}`);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#06118d';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#06118d';
                            }}
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                            style={{
                              borderColor: '#06118d',
                              color: '#06118d',
                              backgroundColor: 'white'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/jobs/${job.id}`);
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#06118d';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#06118d';
                            }}
                            title="Edit Job"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                            style={{
                              borderColor: '#dc2626',
                              color: '#dc2626',
                              backgroundColor: 'white'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this job?')) {
                                // TODO: Implement delete functionality
                                console.log('Delete job:', job.id);
                              }
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                            title="Delete Job"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Pagination */}
            {showBottomPagination && paginatedJobs && paginatedJobs.length > 0 && (
            <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs px-2"
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-700 flex items-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs px-2"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs sm:text-xs text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, sortedJobs?.length || 0)} of{' '}
                    {sortedJobs?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-1.5 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
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
                          className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 border-[#06118d] text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          style={currentPage === pageNumber ? { backgroundColor: '#06118d' } : {}}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-1.5 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </div>
        ) : (
          <>
            {showTopPagination && (
              <div className="bg-white rounded-lg shadow px-4 py-2.5 mb-3 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-2"
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-gray-700 flex items-center">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="text-xs px-2"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs sm:text-xs text-gray-700">
                      {startIndex + 1} to {Math.min(endIndex, sortedJobs?.length || 0)} of{' '}
                      {sortedJobs?.length || 0}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-1.5 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDoubleLeftIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
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
                            className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 border-[#06118d] text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            style={currentPage === pageNumber ? { backgroundColor: '#06118d' } : {}}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-1.5 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDoubleRightIcon className="h-4 w-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {paginatedJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  {/* Header - Fixed */}
                  <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate" title={job.title}>
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">#{job.id}</span>
                          {job.priority && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getPriorityColor(job.priority)}`}>
                              {job.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content - Flexible */}
                  <div className="p-3 space-y-2 flex-grow">
                    <div className="grid grid-cols-2 gap-2">
                      {job.date && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 uppercase">Date</div>
                            <div className="text-xs text-gray-900 font-medium truncate">{new Date(job.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 uppercase">Location</div>
                            <div className="text-xs text-gray-900 font-medium truncate" title={job.location}>{job.location}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer - Fixed */}
                  <div className="p-2 bg-gray-50 border-t flex items-center justify-between gap-1 flex-shrink-0 mt-auto">
                    <button
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                      style={{
                        borderColor: '#06118d',
                        color: '#06118d',
                        backgroundColor: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs/${job.id}`);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#06118d';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#06118d';
                      }}
                      title="View Details"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                      style={{
                        borderColor: '#06118d',
                        color: '#06118d',
                        backgroundColor: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs/${job.id}`);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#06118d';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = '#06118d';
                      }}
                      title="Edit Job"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all"
                      style={{
                        borderColor: '#dc2626',
                        color: '#dc2626',
                        backgroundColor: 'white'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this job?')) {
                          // TODO: Implement delete functionality
                          console.log('Delete job:', job.id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                      title="Delete Job"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Bottom Pagination for Card View */}
            {showBottomPagination && (
            <div className="bg-white rounded-lg shadow px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-xs px-2"
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-700 flex items-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-xs px-2"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-700">
                    {startIndex + 1} to {Math.min(endIndex, sortedJobs?.length || 0)} of{' '}
                    {sortedJobs?.length || 0}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-1.5 py-1.5 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
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
                          className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                            currentPage === pageNumber
                              ? 'z-10 border-[#06118d] text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          style={currentPage === pageNumber ? { backgroundColor: '#06118d' } : {}}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-1.5 py-1.5 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDoubleRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  );
}
