'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
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

interface EmployeeAssignment {
  id: string;
  employee: {
    id: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  };
}

interface PermissionCategory {
  [category: string]: string[];
}

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [roleEmployees, setRoleEmployees] = useState<Record<string, any[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: [] as string[],
  });

  // Fetch permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<{
        permissions: string[];
        byCategory: PermissionCategory;
      }>('/api/configurations/permissions');
      return response;
    },
    enabled: showModal, // Only fetch when modal is open
  });

  useEffect(() => {
    loadRoles();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      console.log('[Roles Page] Loading employees...');
      const response = await apiClient.get<{ employees: any[] }>('/employees');
      console.log('[Roles Page] Loaded employees response:', response);
      console.log('[Roles Page] Total employees from API:', response.employees?.length || 0);
      console.log('[Roles Page] All employees:', response.employees);
      
      if (!response.employees || response.employees.length === 0) {
        console.warn('[Roles Page] No employees returned from API. This could mean:');
        console.warn('  1. No employees exist for this tenant');
        console.warn('  2. Employees exist but are archived');
        console.warn('  3. Employees exist but do not have user accounts');
        console.warn('  4. Tenant ID is not being sent correctly');
        setEmployees([]);
        return;
      }
      
      // Filter out archived employees only
      // Note: Employees can exist without user accounts, but they can only be assigned roles if they have a user account
      const validEmployees = (response.employees || []).filter((emp: any) => {
        // Check if employee is archived
        if (emp.isArchived) {
          console.log('[Roles Page] Filtering out archived employee:', emp.id);
          return false;
        }
        
        // Employees without user accounts can be shown, but they can't be assigned roles yet
        // We'll show them but indicate they need a user account
        return true;
      });
      
      console.log('[Roles Page] Valid employees after filtering:', validEmployees.length);
      console.log('[Roles Page] Valid employees:', validEmployees.map((e: any) => ({
        id: e.id,
        name: e.user?.firstName + ' ' + e.user?.lastName,
        email: e.user?.email,
        isArchived: e.isArchived
      })));
      
      if (validEmployees.length === 0 && response.employees.length > 0) {
        console.warn('[Roles Page] All employees were filtered out. Reasons:');
        const archivedCount = response.employees.filter((e: any) => e.isArchived).length;
        const noUserCount = response.employees.filter((e: any) => !e.user || (!e.user.firstName && !e.user.lastName && !e.user.email)).length;
        console.warn(`  - Archived: ${archivedCount}`);
        console.warn(`  - No user account: ${noUserCount}`);
      }
      
      setEmployees(validEmployees);
    } catch (error: any) {
      console.error('[Roles Page] Failed to load employees:', error);
      console.error('[Roles Page] Error details:', error.response?.data || error.message);
      console.error('[Roles Page] Error status:', error.response?.status);
      // Set empty array on error so UI doesn't break
      setEmployees([]);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ roles: Role[] }>('/api/configurations/roles');
      setRoles(response.roles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      permissions: [],
    });
    setExpandedCategories(new Set()); // Reset expanded categories
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    // Expand all categories when editing
    if (permissionsData?.byCategory) {
      setExpandedCategories(new Set(Object.keys(permissionsData.byCategory)));
    }
    setShowModal(true);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(permission)) {
        return {
          ...prev,
          permissions: currentPermissions.filter((p) => p !== permission),
        };
      } else {
        return {
          ...prev,
          permissions: [...currentPermissions, permission],
        };
      }
    });
  };

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = permissionsData?.byCategory[category] || [];
    setFormData((prev) => {
      const currentPermissions = prev.permissions || [];
      const allSelected = categoryPermissions.every((p) => currentPermissions.includes(p));
      
      if (allSelected) {
        // Deselect all in category
        return {
          ...prev,
          permissions: currentPermissions.filter((p) => !categoryPermissions.includes(p)),
        };
      } else {
        // Select all in category
        const newPermissions = [...currentPermissions];
        categoryPermissions.forEach((p) => {
          if (!newPermissions.includes(p)) {
            newPermissions.push(p);
          }
        });
        return {
          ...prev,
          permissions: newPermissions,
        };
      }
    });
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.name || formData.name.trim().length === 0) {
        alert('Role name is required');
        return;
      }

      if (!formData.permissions || formData.permissions.length === 0) {
        alert('Please select at least one permission for this role');
        return;
      }

      // Prepare data for API
      const roleData = {
        name: formData.name.trim(),
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        permissions: formData.permissions || [],
      };

      console.log('[Roles Page] Saving role:', roleData);

      if (selectedRole) {
        await apiClient.put(`/api/configurations/roles/${selectedRole.id}`, roleData);
      } else {
        await apiClient.post('/api/configurations/roles', roleData);
      }
      setShowModal(false);
      loadRoles();
    } catch (error: any) {
      console.error('Failed to save role:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save role';
      const errorDetails = error?.response?.data?.details;
      alert(`${errorMessage}${errorDetails ? `\n\nDetails: ${JSON.stringify(errorDetails)}` : ''}`);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Are you sure you want to delete "${role.name}"?`)) return;
    if (role.isSystem) {
      alert('Cannot delete system role');
      return;
    }

    try {
      await apiClient.delete(`/api/configurations/roles/${role.id}`);
      loadRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Failed to delete role');
    }
  };

  const loadRoleEmployees = async (roleId: string) => {
    try {
      const response = await apiClient.get<{ role: Role & { employeeAssignments: EmployeeAssignment[] } }>(
        `/api/configurations/roles/${roleId}`
      );
      setRoleEmployees((prev) => ({
        ...prev,
        [roleId]: response.role.employeeAssignments || [],
      }));
    } catch (error) {
      console.error('Failed to load role employees:', error);
    }
  };

  const handleToggleRoleExpansion = (roleId: string) => {
    if (expandedRoleId === roleId) {
      setExpandedRoleId(null);
    } else {
      setExpandedRoleId(roleId);
      if (!roleEmployees[roleId]) {
        loadRoleEmployees(roleId);
      }
    }
  };

  const handleAssignEmployee = async (roleId: string, employeeId: string) => {
    try {
      await apiClient.post(`/api/configurations/roles/${roleId}/assign`, {
        employeeId,
      });
      loadRoleEmployees(roleId);
      loadRoles();
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert('Failed to assign role');
    }
  };

  const handleUnassignEmployee = async (roleId: string, employeeId: string) => {
    try {
      await apiClient.delete(`/api/configurations/roles/${roleId}/assign/${employeeId}`);
      loadRoleEmployees(roleId);
      loadRoles();
    } catch (error) {
      console.error('Failed to unassign role:', error);
      alert('Failed to unassign role');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/configurations')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Configurations
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Roles & Permissions</h1>
              <p className="text-lg text-gray-600">
                Manage roles with permissions and assign them to employees
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Role
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Roles List */}
          <div className="lg:col-span-2 space-y-4">
            {roles.map((role) => {
              const isExpanded = expandedRoleId === role.id;
              const assignedEmployees = roleEmployees[role.id] || [];
              // Filter employees that are not archived and aren't already assigned
              // Note: Only employees with user accounts can be assigned roles
              const unassignedEmployees = employees.filter(
                (emp) => {
                  // Check if employee is not archived
                  const isActive = !emp.isArchived;
                  // Check if employee is not already assigned
                  const isNotAssigned = !assignedEmployees.some((ae) => ae.employee?.id === emp.id);
                  
                  return isActive && isNotAssigned;
                }
              );

              return (
                <div
                  key={role.id}
                  className={`bg-white rounded-xl shadow-md border-2 transition-all duration-200 ${
                    isExpanded ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Role Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => handleToggleRoleExpansion(role.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`h-3 w-3 rounded-full ${isExpanded ? 'bg-blue-500' : 'bg-gray-300'} transition-colors`}></div>
                          <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                          {role.isSystem && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 ml-6 mb-3">{role.description || 'No description'}</p>
                        <div className="flex items-center space-x-6 ml-6">
                          <div className="flex items-center space-x-2">
                            <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserGroupIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {role._count.employeeAssignments} employee
                              {role._count.employeeAssignments !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(role)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Role"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => handleDelete(role)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Role"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                      {/* Assigned Employees */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
                          Assigned Employees ({assignedEmployees.length})
                        </h4>
                        {assignedEmployees.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {assignedEmployees.map((assignment) => {
                              const employee = assignment.employee;
                              const displayName = employee.user 
                                ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim() || employee.user.email || 'Unknown'
                                : 'Unknown Employee';
                              const initials = employee.user
                                ? `${employee.user.firstName?.[0] || ''}${employee.user.lastName?.[0] || ''}`.trim() || employee.user.email?.[0]?.toUpperCase() || '?'
                                : '?';
                              
                              return (
                                <div
                                  key={assignment.id}
                                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="h-6 w-6 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-2 text-xs font-bold">
                                    {initials}
                                  </div>
                                  <span>{displayName}</span>
                                  <button
                                    onClick={() => handleUnassignEmployee(role.id, employee.id)}
                                    className="ml-2 text-white hover:text-red-200 transition-colors"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No employees assigned to this role</p>
                          </div>
                        )}
                      </div>

                      {/* Assign New Employee */}
                      {unassignedEmployees.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2 text-green-600" />
                            Assign Employee ({unassignedEmployees.length} available)
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {unassignedEmployees.map((employee) => {
                              const hasUser = employee.user && (employee.user.firstName || employee.user.lastName || employee.user.email);
                              const displayName = hasUser 
                                ? `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim() || employee.user?.email
                                : `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email || employee.employeeNumber || 'Unknown';
                              
                              return (
                                <button
                                  key={employee.id}
                                  onClick={() => handleAssignEmployee(role.id, employee.id)}
                                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all transform hover:scale-105"
                                >
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  {displayName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="text-center py-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
                          <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">No employees available to assign</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}

            {roles.length === 0 && (
              <div className="bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300 p-12 text-center">
                <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No roles yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first role</p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Role
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-6 sticky top-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">About Roles</h3>
              </div>
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  <strong className="text-gray-900">Roles</strong> define permission sets that control what employees can do in the system.
                </p>
                <p>
                  <strong className="text-gray-900">Employees</strong> can be assigned multiple roles, giving them combined permissions from all assigned roles.
                </p>
                <p>
                  <strong className="text-gray-900">System Roles</strong> are built-in and cannot be deleted, but you can create custom roles for your organization.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Roles</span>
                  <span className="text-2xl font-bold text-blue-600">{roles.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Available Employees</span>
                  <span className="text-2xl font-bold text-green-600">{employees.length}</span>
                </div>
                {employees.length === 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    <p>No employees found. Employees need to have user accounts to be assigned to roles.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center mr-3">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedRole ? 'Edit Role' : 'Create Role'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          slug: selectedRole ? formData.slug : name.toLowerCase().replace(/\s+/g, '-'),
                        });
                      }}
                      placeholder="e.g., Field Technician"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-name"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Used for API references (auto-generated from name)</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Describe what this role is used for..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                  />
                </div>

                {/* Permissions Section */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Permissions <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Select the permissions this role should have ({formData.permissions?.length || 0} selected)
                      </p>
                    </div>
                    {permissionsData?.byCategory && (
                      <button
                        onClick={() => {
                          const allPermissions = Object.values(permissionsData.byCategory).flat();
                          const allSelected = allPermissions.every((p) => formData.permissions?.includes(p));
                          setFormData({
                            ...formData,
                            permissions: allSelected ? [] : allPermissions,
                          });
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {Object.values(permissionsData.byCategory).flat().every((p) => formData.permissions?.includes(p))
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    )}
                  </div>

                  {permissionsData?.byCategory ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                      {Object.entries(permissionsData.byCategory).map(([category, permissions]) => {
                        const isExpanded = expandedCategories.has(category);
                        const categorySelected = permissions.filter((p) => formData.permissions?.includes(p)).length;
                        const allSelected = categorySelected === permissions.length;

                        return (
                          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                              <button
                                type="button"
                                onClick={() => toggleCategory(category)}
                                className="flex items-center flex-1 text-left"
                              >
                                <div className={`h-3 w-3 rounded-full mr-3 transition-colors ${
                                  isExpanded ? 'bg-blue-500' : 'bg-gray-300'
                                }`}></div>
                                <span className="font-semibold text-gray-900">{category}</span>
                                <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  {categorySelected}/{permissions.length}
                                </span>
                                <div className="ml-auto mr-2">
                                  {isExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAllInCategory(category);
                                }}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 flex-shrink-0"
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-3 pt-2 border-t border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {permissions.map((permission) => {
                                    const isSelected = formData.permissions?.includes(permission);
                                    return (
                                      <label
                                        key={permission}
                                        className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                          isSelected
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => togglePermission(permission)}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className={`ml-2 text-sm ${
                                          isSelected ? 'font-medium text-blue-900' : 'text-gray-700'
                                        }`}>
                                          {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading permissions...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3 flex-shrink-0 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || (formData.permissions?.length || 0) === 0}
                  className="px-6 py-2.5 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {selectedRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

