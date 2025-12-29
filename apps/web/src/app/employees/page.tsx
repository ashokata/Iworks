'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, employeeService } from '@/services/employeeService';
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, Suspense } from 'react';

function EmployeesContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showTopPagination, setShowTopPagination] = useState(true);
  const [showBottomPagination, setShowBottomPagination] = useState(false);
  
  // Check if we should filter for technicians only
  const filterTechnicians = searchParams.get('filter') === 'technicians';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

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
      } else {
        setShowTopPagination(false);
        setShowBottomPagination(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch all employees
  const { data: employees = [], isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
    enabled: isAuthenticated,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteConfirmId(null);
      setDeleteConfirmName('');
    },
    onError: (error) => {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    },
  });

  // Show loading or nothing while redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleDelete = (id: string, name?: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name || 'this employee');
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/employees/create?id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeEmployees = employees.filter(emp => !emp.isArchived);
  const technicians = employees.filter(emp => emp.isDispatchEnabled === true);
  
  // Apply filter if technicians filter is active
  const displayedEmployees = filterTechnicians ? technicians : activeEmployees;

  // Pagination logic
  const totalPages = Math.ceil((displayedEmployees?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = displayedEmployees?.slice(startIndex, endIndex);

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, displayedEmployees.length)}</span> of{' '}
              <span className="font-medium">{displayedEmployees.length}</span> {filterTechnicians ? 'technicians' : 'employees'}
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === number
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">{filterTechnicians ? 'Technician Management' : 'Employee Management'}</h1>
              <p className="text-sm text-blue-100">{filterTechnicians ? 'Manage your field technicians' : 'Manage your team and workforce'}</p>
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
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
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
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Card View</span>
                  <span className="sm:hidden">Cards</span>
                </>
              ) : (
                <>
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Table View</span>
                  <span className="sm:hidden">Table</span>
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/employees/create')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none"
              style={{
                backgroundColor: '#06118d',
                color: 'white'
              }}
            >
              <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="mb-4 p-4">
          <h2 className="text-lg font-semibold mb-2">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total Employees</p>
              <p className="text-2xl font-bold">{employees.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Active Employees</p>
              <p className="text-2xl font-bold">{activeEmployees.length}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Technicians</p>
              <p className="text-2xl font-bold">{technicians.length}</p>
            </div>
          </div>
        </Card>

        {/* Top Pagination */}
        {showTopPagination && totalPages > 1 && <PaginationControls />}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Is Technician
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
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No employees found. Click "Add Employee" to create one.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((employee) => {
                      const displayName = employee.firstName && employee.lastName
                        ? `${employee.firstName} ${employee.lastName}`.trim()
                        : employee.user
                          ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim() || employee.user.email || 'Unknown'
                          : employee.email || employee.employeeNumber || 'Unknown';
                      const displayEmail = employee.email || employee.user?.email || '';
                      const displayPhone = employee.phone || employee.user?.phone || '';
                      const displayRole = employee.user?.role || employee.jobTitle || 'N/A';

                      return (
                      <tr key={employee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{displayName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{displayEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{displayPhone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{displayRole}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            employee.isDispatchEnabled
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.isDispatchEnabled ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            !employee.isArchived
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.isArchived ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(employee.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id, displayName)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedEmployees.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No employees found. Click "Add Employee" to create one.
              </div>
            ) : (
              paginatedEmployees.map((employee) => {
                const displayName = employee.firstName && employee.lastName
                  ? `${employee.firstName} ${employee.lastName}`.trim()
                  : employee.user
                    ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim() || employee.user.email || 'Unknown'
                    : employee.email || employee.employeeNumber || 'Unknown';
                const displayEmail = employee.email || employee.user?.email || '';
                const displayPhone = employee.phone || employee.user?.phone || '';
                const displayRole = employee.user?.role || employee.jobTitle || 'N/A';

                return (
                  <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-semibold text-gray-900">{displayName}</h3>
                            <p className="text-xs text-gray-500">{displayRole}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          !employee.isArchived
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isArchived ? 'Inactive' : 'Active'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        {displayEmail && (
                          <div className="flex items-center text-xs text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">{displayEmail}</span>
                          </div>
                        )}
                        {displayPhone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{displayPhone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.isDispatchEnabled
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.isDispatchEnabled ? 'Technician' : 'Staff'}
                        </span>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleEdit(employee.id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-900 border border-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id, displayName)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-900 border border-red-600 rounded hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Bottom Pagination */}
        {showBottomPagination && totalPages > 1 && <PaginationControls />}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Employee</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteConfirmName}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteConfirmName('');
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <EmployeesContent />
    </Suspense>
  );
}
