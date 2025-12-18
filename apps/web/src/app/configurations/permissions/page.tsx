'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface PermissionCategory {
  [category: string]: string[];
}

export default function PermissionsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<{
        permissions: string[];
        byCategory: PermissionCategory;
      }>('/api/configurations/permissions');
      return response;
    },
  });

  const permissionsByCategory = permissionsData?.byCategory || {};
  const allPermissions = permissionsData?.permissions || [];
  const categories = Object.keys(permissionsByCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/configurations')}
                className="text-sm font-medium text-blue-100 hover:text-white mb-4 inline-flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Configurations
              </button>
              <h1 className="text-4xl font-bold text-white mb-2">Permissions</h1>
              <p className="text-lg text-blue-100">
                View all available permissions organized by category
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900">{allPermissions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Info</p>
                <p className="text-sm font-semibold text-gray-900">Read-only view</p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions by Category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const permissions = permissionsByCategory[category] || [];
            const isExpanded = selectedCategory === category;

            return (
              <div
                key={category}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setSelectedCategory(isExpanded ? null : category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-3 transition-colors ${
                      isExpanded ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center px-4 py-2 bg-white rounded-lg border border-gray-200"
                        >
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-900">About Permissions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  Permissions define what actions users can perform in the system. They are organized into categories for easy management.
                </p>
                <p className="mb-2">
                  <strong>How it works:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Permissions are assigned to <strong>Roles</strong></li>
                  <li>Employees are assigned to <strong>Roles</strong></li>
                  <li>Employees inherit all permissions from their assigned roles</li>
                  <li>To manage permissions, go to <strong>Roles & Permissions</strong> and edit a role</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

