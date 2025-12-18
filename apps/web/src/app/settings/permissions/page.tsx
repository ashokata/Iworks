'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import { employeeService, type Employee as EmployeeType } from '@/services/employeeService';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  _count: {
    employeeAssignments: number;
  };
}

export default function PermissionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
    enabled: isAuthenticated,
  });

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery<{ roles: Role[] }>({
    queryKey: ['roles'],
    queryFn: () => apiClient.get<{ roles: Role[] }>('/api/configurations/roles'),
    enabled: isAuthenticated,
  });

  const roles = rolesData?.roles || [];

  // Fetch employee role assignments
  const { data: employeeAssignments = [] } = useQuery({
    queryKey: ['employee-role-assignments', employees.length],
    queryFn: async () => {
      const assignments: any[] = [];
      for (const employee of employees) {
        try {
          const response = await apiClient.get<{ assignments: any[] }>(
            `/api/configurations/employees/${employee.id}/roles`
          );
          assignments.push(...(response.assignments || []));
        } catch (error) {
          console.error(`Failed to fetch assignments for employee ${employee.id}:`, error);
        }
      }
      return assignments;
    },
    enabled: isAuthenticated && employees.length > 0,
  });

  // Group assignments by employee
  const assignmentsByEmployee = employeeAssignments.reduce((acc: Record<string, Role[]>, assignment: any) => {
    const empId = assignment.employee?.id || assignment.employeeId;
    if (!acc[empId]) {
      acc[empId] = [];
    }
    if (assignment.role) {
      acc[empId].push(assignment.role);
    }
    return acc;
  }, {});

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ employeeId, roleId }: { employeeId: string; roleId: string }) => {
      return apiClient.post(`/api/configurations/roles/${roleId}/assign`, { employeeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-role-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Unassign role mutation
  const unassignRoleMutation = useMutation({
    mutationFn: async ({ employeeId, roleId }: { employeeId: string; roleId: string }) => {
      return apiClient.delete(`/api/configurations/roles/${roleId}/unassign/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-role-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const handleAssignRole = async (employeeId: string, roleId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permissions/page.tsx:110',message:'handleAssignRole called',data:{employeeId,roleId,employeeIdType:typeof employeeId,roleIdType:typeof roleId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    try {
      console.log('[Permissions Page] Assigning role:', { employeeId, roleId });
      await assignRoleMutation.mutateAsync({ employeeId, roleId });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c288bfc6-fede-4b2e-ba41-31212e9a87d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permissions/page.tsx:113',message:'Role assignment successful',data:{employeeId,roleId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      console.error('[Permissions Page] Failed to assign role:', error);
      console.error('[Permissions Page] Full error object:', {
        message: error?.message,
        response: error?.response,
        responseData: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText
      });
      
      let errorMessage = 'Failed to assign role. Please try again.';
      let errorDetails: any = null;
      
      if (error?.response?.data) {
        errorMessage = error.response.data.error || errorMessage;
        errorDetails = error.response.data.details || error.response.data;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`${errorMessage}${errorDetails ? `\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}` : ''}`);
    }
  };

  const handleUnassignRole = async (employeeId: string, roleId: string) => {
    try {
      await unassignRoleMutation.mutateAsync({ employeeId, roleId });
    } catch (error) {
      console.error('Failed to unassign role:', error);
      alert('Failed to unassign role. Please try again.');
    }
  };

  if (authLoading || employeesLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Filter active employees with user data
  const activeEmployees = (employees || []).filter(
    (emp: EmployeeType) => !emp.isArchived && emp.user && (emp.user.firstName || emp.user.lastName || emp.user.email)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <ShieldCheckIcon className="h-8 w-8 mr-3" />
                Permission Management
              </h1>
              <p className="text-blue-100 mt-1">Manage employee roles and permissions</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Employees ({activeEmployees.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
              Roles ({roles.length})
            </button>
          </nav>
        </div>

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Employee Permissions</h2>
            </div>

            <div className="space-y-4">
              {activeEmployees.length === 0 ? (
                <Card className="p-12 text-center">
                  <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active employees found.</p>
                </Card>
              ) : (
                activeEmployees.map((employee: EmployeeType) => {
                  const employeeRoles = assignmentsByEmployee[employee.id] || [];
                  const displayName = employee.user
                    ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim() ||
                      employee.user.email ||
                      'Unknown'
                    : 'Unknown';
                  const initials = employee.user
                    ? `${employee.user.firstName?.[0] || ''}${employee.user.lastName?.[0] || ''}`.trim() ||
                      employee.user.email?.[0]?.toUpperCase() ||
                      '?'
                    : '?';

                  return (
                    <Card key={employee.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg mr-4">
                            {initials}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                            <p className="text-sm text-gray-500">{employee.user?.email}</p>
                            <div className="flex gap-2 mt-2">
                              {employeeRoles.length > 0 ? (
                                employeeRoles.map((role) => (
                                  <span
                                    key={role.id}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {role.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">No roles assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            ACTIVE
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingEmployeeId(employee.id)}
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit Roles
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Manage Roles</h2>
              <Button variant="success" onClick={() => router.push('/configurations/roles')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Roles List */}
              <div className="space-y-4">
                {roles.length === 0 ? (
                  <Card className="p-12 text-center">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No roles found.</p>
                    <Button variant="success" onClick={() => router.push('/configurations/roles')}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </Card>
                ) : (
                  roles.map((role) => (
                    <Card
                      key={role.id}
                      className={`p-6 cursor-pointer transition-all ${
                        selectedRole === role.id
                          ? 'border-2 border-blue-500 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedRole(role.id)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-500">{role._count.employeeAssignments} employees</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/configurations/roles`);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {perm.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Role Details */}
              <div>
                {selectedRole ? (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Permissions for {roles.find((r) => r.id === selectedRole)?.name}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">
                          {roles.find((r) => r.id === selectedRole)?.description || 'No description'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Permissions</h4>
                        <div className="flex flex-wrap gap-2">
                          {roles.find((r) => r.id === selectedRole)?.permissions.map((perm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {perm.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        variant="success"
                        className="w-full"
                        onClick={() => router.push('/configurations/roles')}
                      >
                        Manage Role
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-12 text-center">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a role to view details</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Roles Modal */}
      {editingEmployeeId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Roles</h3>
              <button
                onClick={() => setEditingEmployeeId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {(() => {
              const employee = activeEmployees.find((e: EmployeeType) => e.id === editingEmployeeId);
              if (!employee) return null;

              const employeeRoles = assignmentsByEmployee[employee.id] || [];
              const assignedRoleIds = employeeRoles.map((r) => r.id);
              const unassignedRoles = roles.filter((r) => !assignedRoleIds.includes(r.id));

              const displayName = employee.user
                ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim() ||
                  employee.user.email ||
                  'Unknown'
                : 'Unknown';

              return (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Assign roles to <strong>{displayName}</strong>
                    </p>
                  </div>

                  {/* Assigned Roles */}
                  {employeeRoles.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Assigned Roles</h4>
                      <div className="flex flex-wrap gap-2">
                        {employeeRoles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {role.name}
                            <button
                              onClick={() => handleUnassignRole(employee.id, role.id)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              disabled={unassignRoleMutation.isPending}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available Roles */}
                  {unassignedRoles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Roles</h4>
                      <div className="space-y-2">
                        {unassignedRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{role.name}</p>
                              {role.description && (
                                <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignRole(employee.id, role.id)}
                              disabled={assignRoleMutation.isPending}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {unassignedRoles.length === 0 && employeeRoles.length > 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>All available roles have been assigned.</p>
                    </div>
                  )}

                  {roles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No roles available. Create a role first.</p>
                      <Button
                        variant="success"
                        className="mt-4"
                        onClick={() => {
                          setEditingEmployeeId(null);
                          router.push('/configurations/roles');
                        }}
                      >
                        Create Role
                      </Button>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <Button variant="outline" onClick={() => setEditingEmployeeId(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
