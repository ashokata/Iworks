import { apiClient } from './apiClient';
import { ChecklistTemplate, ChecklistItem } from '@/types/enhancedTypes';

/**
 * Service to handle checklist templates and items
 * Based on HouseCallPro's checklist functionality
 */
export const checklistService = {
  /**
   * Get all checklist templates for a tenant
   */
  getTemplates: async (): Promise<ChecklistTemplate[]> => {
    try {
      const response = await apiClient.get<ChecklistTemplate[]>('/api/checklist-templates');
      return response;
    } catch (error) {
      console.error('Error fetching checklist templates:', error);
      return [];
    }
  },

  /**
   * Get a specific checklist template by ID
   */
  getTemplateById: async (id: string): Promise<ChecklistTemplate | null> => {
    try {
      const response = await apiClient.get<ChecklistTemplate>(`/api/checklist-templates/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching checklist template ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new checklist template
   */
  createTemplate: async (template: Omit<ChecklistTemplate, 'id'>): Promise<ChecklistTemplate | null> => {
    try {
      const response = await apiClient.post<ChecklistTemplate>('/api/checklist-templates', template);
      return response;
    } catch (error) {
      console.error('Error creating checklist template:', error);
      return null;
    }
  },

  /**
   * Update an existing checklist template
   */
  updateTemplate: async (id: string, template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate | null> => {
    try {
      const response = await apiClient.put<ChecklistTemplate>(`/api/checklist-templates/${id}`, template);
      return response;
    } catch (error) {
      console.error(`Error updating checklist template ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a checklist template
   */
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/checklist-templates/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting checklist template ${id}:`, error);
      return false;
    }
  },

  /**
   * Get checklist items for a job
   */
  getJobChecklist: async (jobId: string): Promise<ChecklistItem[]> => {
    try {
      const response = await apiClient.get<ChecklistItem[]>(`/api/jobs/${jobId}/checklist`);
      return response;
    } catch (error) {
      console.error(`Error fetching checklist for job ${jobId}:`, error);
      return [];
    }
  },

  /**
   * Update a checklist item
   */
  updateChecklistItem: async (
    jobId: string, 
    itemId: string, 
    value: any
  ): Promise<ChecklistItem | null> => {
    try {
      const response = await apiClient.put<ChecklistItem>(
        `/api/jobs/${jobId}/checklist/${itemId}`,
        { value }
      );
      return response;
    } catch (error) {
      console.error(`Error updating checklist item ${itemId} for job ${jobId}:`, error);
      return null;
    }
  },

  /**
   * Apply a checklist template to a job
   */
  applyTemplateToJob: async (jobId: string, templateId: string): Promise<ChecklistItem[]> => {
    try {
      const response = await apiClient.post<ChecklistItem[]>(
        `/api/jobs/${jobId}/apply-checklist-template`,
        { templateId }
      );
      return response;
    } catch (error) {
      console.error(`Error applying template ${templateId} to job ${jobId}:`, error);
      return [];
    }
  }
};
