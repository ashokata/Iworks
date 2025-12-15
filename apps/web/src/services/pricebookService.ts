/**
 * Pricebook Service - Frontend API Client
 * Handles all pricebook-related API calls
 */

import { API_CONFIG } from '@/config/api.config';

const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Types
export interface Industry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  parentId: string | null;
  industryId?: string;
  serviceCount?: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  estimatedDuration: number;
  categoryId: string;
  orderIndex: number;
  materialCount?: number;
}

export interface Material {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  unit: string;
  serviceId: string;
}

export const pricebookService = {
  // Industries
  listIndustries: async (): Promise<Industry[]> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/industries`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch industries');
    const data = await response.json();
    return data.industries || [];
  },

  getIndustry: async (slug: string): Promise<Industry> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/industries/${slug}`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch industry');
    return response.json();
  },

  // Categories
  listCategories: async (params?: { industryId?: string; parentId?: string }): Promise<Category[]> => {
    const queryParams = new URLSearchParams();
    if (params?.industryId) queryParams.append('industryId', params.industryId);
    if (params?.parentId) queryParams.append('parentId', params.parentId);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/categories?${queryParams}`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.categories || [];
  },

  getCategory: async (id: string): Promise<Category> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/categories/${id}`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  },

  createCategory: async (categoryData: {
    name: string;
    description?: string;
    parentId?: string;
    industryId?: string;
  }): Promise<Category> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  updateCategory: async (id: string, updates: {
    name?: string;
    description?: string;
  }): Promise<Category> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/categories/${id}`, {
      method: 'DELETE',
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },

  // Services
  listServices: async (params?: { categoryId?: string }): Promise<Service[]> => {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services?${queryParams}`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch services');
    const data = await response.json();
    return data.services || [];
  },

  getService: async (id: string): Promise<Service> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services/${id}`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch service');
    return response.json();
  },

  createService: async (serviceData: {
    name: string;
    description?: string;
    unitPrice: number;
    estimatedDuration: number;
    categoryId: string;
  }): Promise<Service> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(serviceData),
    });
    if (!response.ok) throw new Error('Failed to create service');
    return response.json();
  },

  updateService: async (id: string, updates: {
    name?: string;
    description?: string;
    unitPrice?: number;
    estimatedDuration?: number;
  }): Promise<Service> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update service');
    return response.json();
  },

  deleteService: async (id: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services/${id}`, {
      method: 'DELETE',
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to delete service');
  },

  // Materials
  listMaterials: async (serviceId: string): Promise<Material[]> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/services/${serviceId}/materials`, {
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to fetch materials');
    const data = await response.json();
    return data.materials || [];
  },

  createMaterial: async (materialData: {
    name: string;
    description?: string;
    unitPrice: number;
    quantity: number;
    unit: string;
    serviceId: string;
  }): Promise<Material> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(materialData),
    });
    if (!response.ok) throw new Error('Failed to create material');
    return response.json();
  },

  updateMaterial: async (id: string, updates: {
    name?: string;
    description?: string;
    unitPrice?: number;
    quantity?: number;
    unit?: string;
  }): Promise<Material> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update material');
    return response.json();
  },

  deleteMaterial: async (id: string): Promise<void> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/materials/${id}`, {
      method: 'DELETE',
      headers: { 'x-tenant-id': getTenantId() },
    });
    if (!response.ok) throw new Error('Failed to delete material');
  },

  // Import
  importPricebook: async (industrySlug: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/pricebook/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify({ industrySlug }),
    });
    if (!response.ok) throw new Error('Failed to import pricebook');
    return response.json();
  },
};

