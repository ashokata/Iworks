'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { pricebookService } from '@/services/pricebookService';

interface Material {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  unit: string;
  serviceId: string;
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    unitPrice: '',
    quantity: '',
    unit: 'each',
  });

  // Fetch service
  const { data: serviceData } = useQuery({
    queryKey: ['pricebook-service', params.id],
    queryFn: () => pricebookService.getService(params.id),
  });
  const service = serviceData?.service || serviceData;

  // Fetch materials
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['pricebook-materials', params.id],
    queryFn: () => pricebookService.listMaterials(params.id),
  });
  const materials = materialsData?.materials || materialsData || [];

  // Create material mutation
  const createMutation = useMutation({
    mutationFn: (materialData: any) =>
      pricebookService.createMaterial({ ...materialData, serviceId: params.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-materials', params.id] });
      setShowCreateModal(false);
      setNewMaterial({ name: '', description: '', unitPrice: '', quantity: '', unit: 'each' });
    },
  });

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => pricebookService.deleteMaterial(materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-materials', params.id] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: newMaterial.name,
      description: newMaterial.description,
      unitPrice: parseFloat(newMaterial.unitPrice),
      quantity: parseFloat(newMaterial.quantity),
      unit: newMaterial.unit,
    });
  };

  const handleDelete = (materialId: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteMutation.mutate(materialId);
    }
  };

  const totalMaterialCost = materials?.reduce((sum: number, mat: Material) => 
    sum + (mat.unitPrice * mat.quantity), 0
  ) || 0;

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/pricebook/manage/category/${service?.pricebookCategoryId || service?.categoryId}`)}
            className="bg-white text-[#0f118a] hover:bg-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{service?.name || 'Service'}</h1>
              <p className="text-blue-100 mt-1">Manage materials for this service</p>
            </div>
            <Button
              variant="success"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Material
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Service Summary */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Service Price</p>
              <p className="text-2xl font-bold text-gray-900">${service?.unitPrice?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Material Cost</p>
              <p className="text-2xl font-bold text-gray-900">${totalMaterialCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Materials Count</p>
              <p className="text-2xl font-bold text-gray-900">{materials?.length || 0}</p>
            </div>
          </div>
        </Card>

        {/* Materials List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : materials?.length === 0 ? (
          <Card className="p-12 text-center">
            <CubeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Materials Yet</h3>
            <p className="text-gray-500 mb-4">Add materials required for this service.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Material
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials?.map((material: Material) => (
              <Card key={material.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
                      <span className="text-sm text-gray-500">
                        {material.quantity} {material.unit}
                      </span>
                    </div>
                    {material.description && (
                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                    )}
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-900">
                        ${material.unitPrice.toFixed(2)} × {material.quantity} = ${(material.unitPrice * material.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMaterial(material)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Material Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Add Material</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    placeholder="e.g., Copper Pipe, Refrigerant, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      value={newMaterial.unitPrice}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unitPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    >
                      <option value="each">Each</option>
                      <option value="ft">Feet</option>
                      <option value="lb">Pounds</option>
                      <option value="gal">Gallons</option>
                      <option value="sqft">Sq Ft</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewMaterial({ name: '', description: '', unitPrice: '', quantity: '', unit: 'each' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleCreate}
                    disabled={!newMaterial.name || !newMaterial.unitPrice || !newMaterial.quantity || createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Material'}
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

