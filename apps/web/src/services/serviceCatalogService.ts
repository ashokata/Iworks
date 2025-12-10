import { apiClient } from './apiClient';
import { ServiceItem, ServiceCategory } from '@/types/enhancedTypes';

/**
 * Service to handle service catalog management
 * Based on HouseCallPro's comprehensive service catalog
 */
export const serviceCatalogService = {
  /**
   * Get all service categories
   */
  getCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const response = await apiClient.get<ServiceCategory[]>('/api/service-categories');
      return response;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      return [];
    }
  },

  /**
   * Get a specific service category by ID
   */
  getCategoryById: async (id: string): Promise<ServiceCategory | null> => {
    try {
      const response = await apiClient.get<ServiceCategory>(`/api/service-categories/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching service category ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new service category
   */
  createCategory: async (category: Omit<ServiceCategory, 'id'>): Promise<ServiceCategory | null> => {
    try {
      const response = await apiClient.post<ServiceCategory>('/api/service-categories', category);
      return response;
    } catch (error) {
      console.error('Error creating service category:', error);
      return null;
    }
  },

  /**
   * Update an existing service category
   */
  updateCategory: async (id: string, category: Partial<ServiceCategory>): Promise<ServiceCategory | null> => {
    try {
      const response = await apiClient.put<ServiceCategory>(`/api/service-categories/${id}`, category);
      return response;
    } catch (error) {
      console.error(`Error updating service category ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a service category
   */
  deleteCategory: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/service-categories/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting service category ${id}:`, error);
      return false;
    }
  },

  /**
   * Get all service items
   */
  getServices: async (categoryId?: string): Promise<ServiceItem[]> => {
    try {
      const endpoint = categoryId 
        ? `/api/service-items?categoryId=${categoryId}` 
        : '/api/service-items';
      
      const response = await apiClient.get<ServiceItem[]>(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching services:', error);
      return [];
    }
  },

  /**
   * Get a specific service item by ID
   */
  getServiceById: async (id: string): Promise<ServiceItem | null> => {
    try {
      const response = await apiClient.get<ServiceItem>(`/api/service-items/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new service item
   */
  createService: async (service: Omit<ServiceItem, 'id'>): Promise<ServiceItem | null> => {
    try {
      const response = await apiClient.post<ServiceItem>('/api/service-items', service);
      return response;
    } catch (error) {
      console.error('Error creating service item:', error);
      return null;
    }
  },

  /**
   * Update an existing service item
   */
  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem | null> => {
    try {
      const response = await apiClient.put<ServiceItem>(`/api/service-items/${id}`, service);
      return response;
    } catch (error) {
      console.error(`Error updating service item ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a service item
   */
  deleteService: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/service-items/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting service item ${id}:`, error);
      return false;
    }
  }
};
