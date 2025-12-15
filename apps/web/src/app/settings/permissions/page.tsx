'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Mock data - Replace with actual API calls
const mockEmployees = [
  { id: '1', name: 'Mike Johnson', email: 'mike@example.com', roles: ['Admin', 'Manager'], status: 'ACTIVE' },
  { id: '2', name: 'Sarah Williams', email: 'sarah@example.com', roles: ['Field Tech'], status: 'ACTIVE' },
  { id: '3', name: 'John Smith', email: 'john@example.com', roles: ['Manager'], status: 'ACTIVE' },
];

const mockRoles = [
  { id: '1', name: 'Admin', employeeCount: 1, permissions: ['CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_EDIT', 'JOBS_VIEW', 'JOBS_CREATE'] },
  { id: '2', name: 'Manager', employeeCount: 2, permissions: ['CUSTOMERS_VIEW', 'JOBS_VIEW', 'JOBS_CREATE'] },
  { id: '3', name: 'Field Tech', employeeCount: 1, permissions: ['JOBS_VIEW', 'SCHEDULE_VIEW'] },
];

const permissionCategories = {
  'Customers': ['CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_EDIT', 'CUSTOMERS_DELETE', 'CUSTOMERS_EXPORT'],
  'Jobs': ['JOBS_VIEW', 'JOBS_CREATE', 'JOBS_EDIT', 'JOBS_DELETE', 'JOBS_ASSIGN', 'JOBS_COMPLETE'],
  'Invoices': ['INVOICES_VIEW', 'INVOICES_CREATE', 'INVOICES_EDIT', 'INVOICES_DELETE', 'INVOICES_SEND'],
  'Schedule': ['SCHEDULE_VIEW', 'SCHEDULE_MANAGE', 'DISPATCH_JOBS'],
  'Settings': ['SETTINGS_VIEW', 'SETTINGS_MANAGE', 'INTEGRATIONS_MANAGE'],
};

export default function PermissionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (authLoading) {
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
              Employees ({mockEmployees.length})
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
              Roles ({mockRoles.length})
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
              {mockEmployees.map((employee) => (
                <Card key={employee.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg mr-4">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        <div className="flex gap-2 mt-2">
                          {employee.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        {employee.status}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* TODO: Open role assignment dialog */}}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit Roles
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Manage Roles</h2>
              <Button variant="success">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Roles List */}
              <div className="space-y-4">
                {mockRoles.map((role) => (
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
                        <p className="text-sm text-gray-500">{role.employeeCount} employees</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* TODO: Open edit dialog */
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((perm) => (
                        <span
                          key={perm}
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
                ))}
              </div>

              {/* Permission Matrix */}
              <div>
                {selectedRole ? (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Permissions for {mockRoles.find(r => r.id === selectedRole)?.name}
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(permissionCategories).map(([category, permissions]) => (
                        <div key={category}>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">{category}</h4>
                          <div className="space-y-2">
                            {permissions.map((permission) => (
                              <label key={permission} className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  defaultChecked={mockRoles.find(r => r.id === selectedRole)?.permissions.includes(permission)}
                                />
                                <span className="ml-3 text-sm text-gray-700">
                                  {permission.replace(/_/g, ' ').toLowerCase()}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button variant="success" className="w-full">
                        Save Permissions
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-12 text-center">
                    <ShieldCheckIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a role to view and edit permissions</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
