import { apiClient } from './apiClient';
import { Material } from '@/types/enhancedTypes';

/**
 * Service to handle materials management
 * Based on HouseCallPro's inventory tracking
 */
export const materialService = {
  /**
   * Get all materials
   */
  getAllMaterials: async (): Promise<Material[]> => {
    try {
      const response = await apiClient.get<Material[]>('/api/materials');
      return response;
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  },

  /**
   * Get a specific material by ID
   */
  getMaterialById: async (id: string): Promise<Material | null> => {
    try {
      const response = await apiClient.get<Material>(`/api/materials/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching material ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new material
   */
  createMaterial: async (material: Omit<Material, 'id'>): Promise<Material | null> => {
    try {
      const response = await apiClient.post<Material>('/api/materials', material);
      return response;
    } catch (error) {
      console.error('Error creating material:', error);
      return null;
    }
  },

  /**
   * Update an existing material
   */
  updateMaterial: async (id: string, material: Partial<Material>): Promise<Material | null> => {
    try {
      const response = await apiClient.put<Material>(`/api/materials/${id}`, material);
      return response;
    } catch (error) {
      console.error(`Error updating material ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a material
   */
  deleteMaterial: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/materials/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting material ${id}:`, error);
      return false;
    }
  },

  /**
   * Get materials for a specific job
   */
  getJobMaterials: async (jobId: string): Promise<Material[]> => {
    try {
      const response = await apiClient.get<Material[]>(`/api/jobs/${jobId}/materials`);
      return response;
    } catch (error) {
      console.error(`Error fetching materials for job ${jobId}:`, error);
      return [];
    }
  },

  /**
   * Add a material to a job
   */
  addMaterialToJob: async (
    jobId: string, 
    materialId: string, 
    quantity: number
  ): Promise<Material | null> => {
    try {
      const response = await apiClient.post<Material>(
        `/api/jobs/${jobId}/materials`, 
        { materialId, quantity }
      );
      return response;
    } catch (error) {
      console.error(`Error adding material to job ${jobId}:`, error);
      return null;
    }
  },

  /**
   * Update a material on a job
   */
  updateJobMaterial: async (
    jobId: string, 
    materialId: string, 
    quantity: number
  ): Promise<Material | null> => {
    try {
      const response = await apiClient.put<Material>(
        `/api/jobs/${jobId}/materials/${materialId}`, 
        { quantity }
      );
      return response;
    } catch (error) {
      console.error(`Error updating material on job ${jobId}:`, error);
      return null;
    }
  },

  /**
   * Remove a material from a job
   */
  removeJobMaterial: async (jobId: string, materialId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/jobs/${jobId}/materials/${materialId}`);
      return true;
    } catch (error) {
      console.error(`Error removing material from job ${jobId}:`, error);
      return false;
    }
  }
};
