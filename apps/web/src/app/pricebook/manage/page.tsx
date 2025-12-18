'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { pricebookService } from '@/services/pricebookService';

interface Category {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  parentId: string | null;
  serviceCount?: number;
  children?: Category[];
}

export default function ManagePricebookPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', parentId: '' });

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['pricebook-categories'],
    queryFn: () => pricebookService.listCategories(),
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (categoryData: { name: string; description: string; parentId?: string }) =>
      pricebookService.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
      setShowCreateModal(false);
      setNewCategory({ name: '', description: '', parentId: '' });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => pricebookService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook-categories'] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: newCategory.name,
      description: newCategory.description,
      parentId: newCategory.parentId || undefined,
    });
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? This will also delete all services in this category.')) {
      deleteMutation.mutate(categoryId);
    }
  };

  const filteredCategories = categories?.filter((cat: Category) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <BookOpenIcon className="h-8 w-8 mr-3" />
                Manage Pricebook
              </h1>
              <p className="text-blue-100 mt-1">Manage your service catalog categories and services</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/pricebook')}
                className="bg-white text-[#1a2a6c] hover:bg-gray-100"
              >
                Browse Templates
              </Button>
              <Button
                variant="success"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Category
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              className="border border-gray-300 rounded-lg pl-10 pr-3 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No categories match your search.' : 'Get started by creating your first category.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Category
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map((category: Category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FolderOpenIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/pricebook/manage/category/${category.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {category.name}
                        </Link>
                        {category.serviceCount !== undefined && (
                          <span className="text-sm text-gray-500">
                            ({category.serviceCount} services)
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                    <Link href={`/pricebook/manage/category/${category.id}`}>
                      <Button variant="default" size="sm">
                        View Services
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Create New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g., Installation, Repair, Maintenance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCategory({ name: '', description: '', parentId: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleCreate}
                    disabled={!newCategory.name || createMutation.isPending}
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

