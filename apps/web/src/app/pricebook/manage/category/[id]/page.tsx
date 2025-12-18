'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { pricebookService } from '@/services/pricebookService';

interface Service {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  estimatedDuration: number;
  categoryId: string;
  orderIndex: number;
  materialCount?: number;
}

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    unitPrice: '',
    estimatedDuration: '',
  });

  // Unwrap the params promise using React.use()
  const { id } = use(params);

  // Fetch category
  const { data: category } = useQuery({
    queryKey: ['pricebook-category', id],
    queryFn: () => pricebookService.getCategory(id),
  });

  // Fetch services
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['pricebook-services', id],
    queryFn: () => pricebookService.listServices({ categoryId: id }),
  });
  const services = servicesData?.services || servicesData || [];

  // Create service mutation
  const createMutation = useMutation({
    mutationFn: (serviceData: any) =>
      pricebookService.createService({ ...serviceData, categoryId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-services', id] });
      setShowCreateModal(false);
      setNewService({ name: '', description: '', unitPrice: '', estimatedDuration: '' });
    },
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: (serviceId: string) => pricebookService.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-services', id] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: newService.name,
      description: newService.description,
      unitPrice: parseFloat(newService.unitPrice),
      estimatedDuration: parseInt(newService.estimatedDuration),
    });
  };

  const handleDelete = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(serviceId);
    }
  };

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
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/pricebook/manage')}
            className="bg-white text-[#1a2a6c] hover:bg-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold">{category?.name || 'Category'}</h1>
                <p className="text-sm text-blue-100">{category?.description || 'Manage services in this category'}</p>
              </div>
            </div>
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Service
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : services?.length === 0 ? (
          <Card className="p-12 text-center">
            <WrenchScrewdriverIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first service.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Service
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services?.map((service: Service) => (
              <Card key={service.id} className="p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{service.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingService(service)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center text-gray-700">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    ${service.unitPrice.toFixed(2)}
                  </div>
                  <div className="flex items-center text-gray-700">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {service.estimatedDuration} min
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Link href={`/pricebook/manage/service/${service.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Materials
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Create New Service</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g., AC Installation - Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Service description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      value={newService.unitPrice}
                      onChange={(e) => setNewService({ ...newService, unitPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      value={newService.estimatedDuration}
                      onChange={(e) => setNewService({ ...newService, estimatedDuration: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewService({ name: '', description: '', unitPrice: '', estimatedDuration: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleCreate}
                    disabled={!newService.name || !newService.unitPrice || createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

