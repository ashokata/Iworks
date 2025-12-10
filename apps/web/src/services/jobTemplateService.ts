import { apiClient } from './apiClient';
import { JobTemplate } from '@/types/enhancedTypes';

/**
 * Service to handle job templates
 * Based on HouseCallPro's job template functionality
 */
export const jobTemplateService = {
  /**
   * Get all job templates
   */
  getTemplates: async (): Promise<JobTemplate[]> => {
    try {
      const response = await apiClient.get<JobTemplate[]>('/api/job-templates');
      return response;
    } catch (error) {
      console.error('Error fetching job templates:', error);
      return [];
    }
  },

  /**
   * Get a specific job template by ID
   */
  getTemplateById: async (id: string): Promise<JobTemplate | null> => {
    try {
      const response = await apiClient.get<JobTemplate>(`/api/job-templates/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching job template ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new job template
   */
  createTemplate: async (template: Omit<JobTemplate, 'id'>): Promise<JobTemplate | null> => {
    try {
      const response = await apiClient.post<JobTemplate>('/api/job-templates', template);
      return response;
    } catch (error) {
      console.error('Error creating job template:', error);
      return null;
    }
  },

  /**
   * Update an existing job template
   */
  updateTemplate: async (id: string, template: Partial<JobTemplate>): Promise<JobTemplate | null> => {
    try {
      const response = await apiClient.put<JobTemplate>(`/api/job-templates/${id}`, template);
      return response;
    } catch (error) {
      console.error(`Error updating job template ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a job template
   */
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/job-templates/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting job template ${id}:`, error);
      return false;
    }
  },

  /**
   * Apply a job template to create a new job
   */
  applyTemplate: async (templateId: string, customData?: any): Promise<any> => {
    try {
      const response = await apiClient.post('/api/jobs/from-template', {
        templateId,
        ...customData
      });
      return response;
    } catch (error) {
      console.error(`Error applying job template ${templateId}:`, error);
      return null;
    }
  }
};
