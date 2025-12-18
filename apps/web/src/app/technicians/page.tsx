'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
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
  CalendarIcon
} from '@heroicons/react/24/outline';
import { technicianService, Technician } from '@/services/technicianService';

interface TechnicianDisplay extends Technician {
  role?: string;
  specialty?: string[];
  activeJobs?: number;
  completedJobs?: number;
  availability?: 'Active' | 'Inactive';
  lastActive?: string;
}

export default function TechniciansPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Helper function to get initial state from sessionStorage
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = sessionStorage.getItem(`technicians_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterName, setFilterName] = useState(() => getInitialState('filterName', ''));
  const [filterEmail, setFilterEmail] = useState(() => getInitialState('filterEmail', ''));
  const [filterPhone, setFilterPhone] = useState(() => getInitialState('filterPhone', ''));
  const [filterRole, setFilterRole] = useState<string[]>(() => getInitialState('filterRole', []));
  const [filterSkills, setFilterSkills] = useState<string[]>(() => getInitialState('filterSkills', []));
  const [filterStatus, setFilterStatus] = useState<string[]>(() => getInitialState('filterStatus', []));
  const [isOnline, setIsOnline] = useState(true);
  const [showFilters, setShowFilters] = useState(() => getInitialState('showFilters', false));
  const [currentPage, setCurrentPage] = useState(() => getInitialState('currentPage', 1));
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'table' | 'card'>(() => getInitialState('viewMode', 'table'));
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<Array<{field: string, direction: 'asc' | 'desc'}>>(() => getInitialState('sortCriteria', []));
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Save state to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterName', JSON.stringify(filterName));
  }, [filterName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterEmail', JSON.stringify(filterEmail));
  }, [filterEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterPhone', JSON.stringify(filterPhone));
  }, [filterPhone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterRole', JSON.stringify(filterRole));
  }, [filterRole]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterSkills', JSON.stringify(filterSkills));
  }, [filterSkills]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_filterStatus', JSON.stringify(filterStatus));
  }, [filterStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_showFilters', JSON.stringify(showFilters));
  }, [showFilters]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_currentPage', JSON.stringify(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_viewMode', JSON.stringify(viewMode));
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('technicians_sortCriteria', JSON.stringify(sortCriteria));
  }, [sortCriteria]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

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

  // Fetch technicians data
  const { data: technicians, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => technicianService.getAllTechnicians(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Delete mutation
  const deleteTechnicianMutation = useMutation({
    mutationFn: (id: string) => technicianService.deleteTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete technician:', error);
      alert('Failed to delete technician. Please try again.');
      setDeleteConfirmId(null);
    }
  });

  const handleDelete = (id: string) => {
    deleteTechnicianMutation.mutate(id);
  };

  // Get unique values for filters
  const roles = (technicians && Array.isArray(technicians))
    ? Array.from(new Set(technicians.map(tech => tech.role).filter((role): role is string => Boolean(role))))
    : [];

  const allSkills = (technicians && Array.isArray(technicians))
    ? Array.from(new Set(technicians.flatMap(tech => tech.skills || [])))
    : [];

  const statuses = ['Active', 'Inactive'];

  // Filter technicians
  const filteredTechnicians = technicians?.filter(tech => {
    const matchesSearch = !searchQuery || 
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesName = !filterName || tech.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesEmail = !filterEmail || tech.email.toLowerCase().includes(filterEmail.toLowerCase());
    const matchesPhone = !filterPhone || (tech.phone && tech.phone.toLowerCase().includes(filterPhone.toLowerCase()));
    const matchesRole = filterRole.length === 0 || (tech.role && filterRole.includes(tech.role));
    const matchesStatus = filterStatus.length === 0 || (tech.status && filterStatus.includes(tech.status));
    const matchesSkills = filterSkills.length === 0 || (tech.skills && filterSkills.some(skill =>
      tech.skills?.includes(skill)
    ));
    
    return matchesSearch && matchesName && matchesEmail && matchesPhone && matchesRole && matchesStatus && matchesSkills;
  });

  // Sort technicians
  const sortedTechnicians = filteredTechnicians?.slice().sort((a, b) => {
    if (viewMode === 'card' || sortCriteria.length === 0) return 0;
    
    for (const criteria of sortCriteria) {
      let aValue: any;
      let bValue: any;
      
      switch (criteria.field) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'phone':
          aValue = a.phone?.toLowerCase() || '';
          bValue = b.phone?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role?.toLowerCase() || '';
          bValue = b.role?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          continue;
      }
      
      if (aValue < bValue) return criteria.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return criteria.direction === 'asc' ? 1 : -1;
    }
    
    return 0;
  });

  // Handle sorting
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

  // Pagination
  const totalPages = Math.ceil((sortedTechnicians?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTechnicians = sortedTechnicians?.slice(startIndex, endIndex);

  // Helper for status color
  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Pagination Component
  const PaginationControls = () => {
    if (!sortedTechnicians || sortedTechnicians.length === 0) return null;
    
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-xs text-gray-700 flex items-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-xs text-gray-700">
              {startIndex + 1} to {Math.min(endIndex, sortedTechnicians.length)} of{' '}
              {sortedTechnicians.length}
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
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-1.5 py-1.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                    currentPage === number
                      ? 'z-10 border-[#06118d] text-white'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                  style={currentPage === number ? { backgroundColor: '#06118d' } : {}}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Technician</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this technician? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteTechnicianMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleteTechnicianMutation.isPending}
              >
                {deleteTechnicianMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Technicians</h1>
              <p className="text-blue-100 mt-1">Manage your field technicians</p>
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
            onClick={() => router.push('/technicians/create')}
            disabled={!isOnline}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#06118d',
              color: 'white'
            }}
          >
            <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Add Technician
          </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-gray-200 mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center">
                <FunnelIcon className="h-4 w-4 mr-2 text-gray-600" />
                Filter Technicians
              </h3>
              <div className="flex flex-wrap gap-2">
                {(filterName || filterEmail || filterPhone || filterRole.length > 0 || filterSkills.length > 0 || filterStatus.length > 0) && (
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
                    style={{
                      backgroundColor: '#06118d',
                      color: 'white'
                    }}
                    onClick={() => {
                      setFilterName('');
                      setFilterEmail('');
                      setFilterPhone('');
                      setFilterRole([]);
                      setFilterSkills([]);
                      setFilterStatus([]);
                    }}
                  >
                    Clear Filters ({[filterName, filterEmail, filterPhone].filter(Boolean).length + (filterRole.length > 0 ? 1 : 0) + (filterSkills.length > 0 ? 1 : 0) + (filterStatus.length > 0 ? 1 : 0)})
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name..."
                    className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Email..."
                    className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Phone..."
                    className="border border-gray-300 rounded-lg pl-9 pr-2.5 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400"
                    value={filterPhone}
                    onChange={(e) => setFilterPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role</label>
                <MultiSearchableSelect
                  options={roles}
                  value={filterRole}
                  onChange={setFilterRole}
                  placeholder="Select roles..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Skills</label>
                <MultiSearchableSelect
                  options={allSkills}
                  value={filterSkills}
                  onChange={setFilterSkills}
                  placeholder="Select skills..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                <MultiSearchableSelect
                  options={statuses}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="Select status..."
                />
              </div>
            </div>
            
            {/* Display Active Filters */}
            {(filterName || filterEmail || filterPhone || filterRole.length > 0 || filterSkills.length > 0 || filterStatus.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700 flex-shrink-0">Active Filters:</span>
                  {filterName && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Name:</span> {filterName}
                    </span>
                  )}
                  {filterEmail && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Email:</span> {filterEmail}
                    </span>
                  )}
                  {filterPhone && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Phone:</span> {filterPhone}
                    </span>
                  )}
                  {filterRole.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Role:</span> {filterRole.join(', ')}
                    </span>
                  )}
                  {filterSkills.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Skills:</span> {filterSkills.join(', ')}
                    </span>
                  )}
                  {filterStatus.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs">
                      <span className="font-medium">Status:</span> {filterStatus.join(', ')}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {[filterName, filterEmail, filterPhone].filter(Boolean).length + 
                     (filterRole.length > 0 ? 1 : 0) + 
                     (filterSkills.length > 0 ? 1 : 0) + 
                     (filterStatus.length > 0 ? 1 : 0)} filter{[filterName, filterEmail, filterPhone].filter(Boolean).length + 
                     (filterRole.length > 0 ? 1 : 0) + 
                     (filterSkills.length > 0 ? 1 : 0) + 
                     (filterStatus.length > 0 ? 1 : 0) !== 1 ? 's' : ''} active
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {isError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error loading technicians. Please try again.
          </div>
        ) : viewMode === 'table' ? (
          /* Grid View */
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Top Pagination */}
            {showTopPagination && (
              <PaginationControls />
            )}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    {[
                      { field: 'name', label: 'Name' },
                      { field: 'email', label: 'Email' },
                      { field: 'phone', label: 'Phone' },
                      { field: 'role', label: 'Role' },
                      { field: 'status', label: 'Status' }
                    ].map(({ field, label }) => (
                      <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                        <div className="flex items-center gap-1">
                          {label}
                          <div className="flex flex-col">
                            <ChevronUpIcon 
                              onClick={(e) => handleSortByDirection(field, 'asc', e)}
                              className={`h-3 w-3 -mb-1 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === field)?.direction === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} 
                            />
                            <ChevronDownIcon 
                              onClick={(e) => handleSortByDirection(field, 'desc', e)}
                              className={`h-3 w-3 cursor-pointer hover:text-gray-700 ${sortCriteria.find(c => c.field === field)?.direction === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} 
                            />
                          </div>
                          {sortCriteria.findIndex(c => c.field === field) >= 0 && (
                            <span className="ml-1 text-xs bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              {sortCriteria.findIndex(c => c.field === field) + 1}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTechnicians && currentTechnicians.length > 0 ? (
                    currentTechnicians.map((tech, index) => (
                      <tr 
                        key={tech.id} 
                        className={`hover:bg-blue-50 transition-all duration-150 cursor-pointer border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        onDoubleClick={() => router.push(`/technicians/create?id=${tech.id}`)}
                      >
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{tech.name}</div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-500">{tech.email}</div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-500">{tech.phone || '-'}</div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-500">{tech.role || 'N/A'}</div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tech.status || 'Inactive')}`}>
                            {tech.status || 'Inactive'}
                          </span>
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
                                router.push(`/technicians/create?id=${tech.id}`);
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
                                router.push(`/technicians/create?id=${tech.id}`);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#06118d';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.color = '#06118d';
                              }}
                              title="Edit"
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
                                setDeleteConfirmId(tech.id);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No technicians found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Bottom Pagination */}
            {showBottomPagination && (
              <PaginationControls />
            )}
          </div>
        ) : (
          /* Matrix View */
          <>
            {/* Top Pagination for Matrix View */}
            {showTopPagination && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-3 sm:mb-4">
                <PaginationControls />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentTechnicians && currentTechnicians.length > 0 ? (
                currentTechnicians.map((tech) => (
                  <div 
                    key={tech.id} 
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
                    onClick={() => router.push(`/technicians/create?id=${tech.id}`)}
                  >
                    {/* Header - Fixed */}
                    <div className="p-3 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate" title={tech.name}>
                            {tech.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">#{tech.id}</span>
                            {tech.role && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                                {tech.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusColor(tech.status || 'Inactive')}`}>
                          {tech.status || 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content - Flexible */}
                    <div className="p-3 space-y-2 flex-grow">
                      <div className="grid grid-cols-2 gap-2">
                        {tech.email && (
                          <div className="flex items-center gap-2 col-span-2">
                            <CalendarIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-500 uppercase">Email</div>
                              <div className="text-xs text-gray-900 font-medium truncate" title={tech.email}>{tech.email}</div>
                            </div>
                          </div>
                        )}
                        {tech.phone && (
                          <div className="flex items-center gap-2 col-span-2">
                            <CalendarIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-500 uppercase">Phone</div>
                              <div className="text-xs text-gray-900 font-medium truncate">{tech.phone}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {tech.skills && tech.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tech.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
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
                          router.push(`/technicians/create?id=${tech.id}`);
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
                          router.push(`/technicians/create?id=${tech.id}`);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#06118d';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.color = '#06118d';
                        }}
                        title="Edit Technician"
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
                          setDeleteConfirmId(tech.id);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                        title="Delete Technician"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No technicians found
                </div>
              )}
            </div>
            
            {/* Bottom Pagination for Matrix View */}
            {showBottomPagination && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 mt-3 sm:mb-4">
                <PaginationControls />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
