'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LeadSource {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: {
    customers: number;
  };
}

export default function LeadSourcesPage() {
  const router = useRouter();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeadSource, setSelectedLeadSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadLeadSources();
  }, []);

  const loadLeadSources = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ leadSources: LeadSource[] }>('/api/configurations/lead-sources');
      setLeadSources(response.leadSources);
    } catch (error) {
      console.error('Failed to load lead sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedLeadSource(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (leadSource: LeadSource) => {
    setSelectedLeadSource(leadSource);
    setFormData({
      name: leadSource.name,
      description: leadSource.description || '',
      isActive: leadSource.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedLeadSource) {
        await apiClient.put(`/api/configurations/lead-sources/${selectedLeadSource.id}`, formData);
      } else {
        await apiClient.post('/api/configurations/lead-sources', formData);
      }
      setShowModal(false);
      loadLeadSources();
    } catch (error) {
      console.error('Failed to save lead source:', error);
      alert('Failed to save lead source');
    }
  };

  const handleDelete = async (leadSource: LeadSource) => {
    if (!confirm(`Are you sure you want to delete "${leadSource.name}"?`)) return;

    try {
      await apiClient.delete(`/api/configurations/lead-sources/${leadSource.id}`);
      loadLeadSources();
    } catch (error) {
      console.error('Failed to delete lead source:', error);
      alert('Failed to delete lead source');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/configurations')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Configurations
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Lead Sources</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage customer lead sources
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Lead Source
          </button>
        </div>

        {/* Lead Sources Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customers
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
              {leadSources.map((leadSource) => (
                <tr key={leadSource.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leadSource.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{leadSource.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {leadSource._count.customers} customer
                      {leadSource._count.customers !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        leadSource.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {leadSource.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(leadSource)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(leadSource)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {selectedLeadSource ? 'Edit Lead Source' : 'Create Lead Source'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

