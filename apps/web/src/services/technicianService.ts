import { apiClient } from './apiClient';
import { transformEmployeeFromApi, transformEmployeeToApi } from '@/config/apiSchemas/employee.schema';
import { extractODataResponse } from '@/config/apiSchemas/utils';

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills?: string[];
  rating?: number;
  tenantId?: string;
  yearsOfExperience?: number;
  status?: 'Active' | 'Inactive';
  profileImage?: string;
  isTechnician?: boolean;
  // Extended fields for detail view
  role?: string;
  specialty?: string[];
  activeJobs?: number;
  completedJobs?: number;
  availability?: 'Active' | 'Inactive';
  lastActive?: string;
  bio?: string;
  hireDate?: string;
  certifications?: string[];
  performanceRating?: number;
  supervisor?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentJobs?: Array<{
    id: string;
    title: string;
    customer: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled';
    scheduledDate: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    address: string;
  }>;
  recentJobs?: Array<{
    id: string;
    title: string;
    customer: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled';
    scheduledDate: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    address: string;
  }>;
}

export const technicianService = {
  /**
   * Get all technicians for the current tenant
   */
  getAllTechnicians: async (): Promise<Technician[]> => {
    try {
      console.log('[Technician Service] Fetching all employees from OData API');
      const response = await apiClient.get<any>('/odata/iworks/v1/Employees');
      
      console.log('[Technician Service] Raw OData response:', response);
      
      // Extract OData response (handles 'value' array)
      const employeesData = extractODataResponse(response);
      console.log('[Technician Service] Extracted employees count:', employeesData.length);
      
      // Transform to frontend format
      const technicians: Technician[] = employeesData.map(transformEmployeeFromApi);
      console.log('[Technician Service] Transformed technicians:', technicians.length);
      
      return technicians;
    } catch (error) {
      console.error('[Technician Service] Error fetching technicians:', error);
      throw error;
    }
  },

  /**
   * Get a technician by ID
   */
  getTechnicianById: async (id: string): Promise<Technician> => {
    try {
      console.log(`[Technician Service] Fetching employee ${id} from OData API`);
      // Use numeric ID without quotes for OData
      const response = await apiClient.get<any>(`/odata/iworks/v1/Employees(${id})`);
      
      console.log('[Technician Service] Raw employee response:', response);
      
      // Transform to frontend format
      const technician = transformEmployeeFromApi(response);
      console.log('[Technician Service] Transformed technician:', technician);
      
      return technician;
    } catch (error) {
      console.error(`[Technician Service] Error fetching technician ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new technician
   */
  createTechnician: async (technicianData: Omit<Technician, 'id' | 'tenantId' | 'rating' | 'skills' | 'specialty' | 'certifications'> & {
    skills: string;
    specialty: string;
    certifications: string;
    isActive: boolean;
  }): Promise<Technician> => {
    let apiData: any;
    try {
      console.log('[Technician Service] Creating new employee via OData API');
      console.log('[Technician Service] Input data:', JSON.stringify(technicianData, null, 2));
      
      // Transform to API format and force isTechnician to true
      apiData = transformEmployeeToApi({ ...technicianData, isTechnician: true } as any);
      console.log('[Technician Service] Transformed API data:', JSON.stringify(apiData, null, 2));
      
      const response = await apiClient.post<any>('/odata/iworks/v1/Employees', apiData);
      console.log('[Technician Service] Create response:', JSON.stringify(response, null, 2));
      
      // Transform response back to frontend format
      const technician = transformEmployeeFromApi(response);
      return technician;
    } catch (error: any) {
      console.error('[Technician Service] Error creating technician:', error);
      console.error('[Technician Service] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        requestData: apiData,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  },

  /**
   * Update a technician
   */
  updateTechnician: async (id: string, technicianData: any): Promise<Technician> => {
    try {
      console.log(`[Technician Service] Updating employee ${id} via OData API`);
      console.log('[Technician Service] Input update data:', JSON.stringify(technicianData, null, 2));
      
      // Transform to API format and force isTechnician to true
      const apiData = transformEmployeeToApi({ ...technicianData, isTechnician: true } as Technician);
      console.log('[Technician Service] Transformed API update data:', JSON.stringify(apiData, null, 2));
      
      // Use PATCH for partial updates with numeric ID
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Employees(${id})`, apiData);
      console.log('[Technician Service] Update response:', JSON.stringify(response, null, 2));
      
      // Transform response back to frontend format
      const technician = transformEmployeeFromApi(response);
      return technician;
    } catch (error: any) {
      console.error(`[Technician Service] Error updating technician ${id}:`, error);
      console.error('[Technician Service] Update error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }
  },

  /**
   * Delete a technician
   */
  deleteTechnician: async (id: string): Promise<void> => {
    try {
      console.log(`[Technician Service] Deleting employee ${id} via OData API`);
      await apiClient.delete(`/odata/iworks/v1/Employees('${id}')`);
      console.log('[Technician Service] Delete successful');
    } catch (error) {
      console.error(`[Technician Service] Error deleting technician ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get technician schedule
   */
  getTechnicianSchedule: async (id: string, startDate?: string, endDate?: string): Promise<any[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const url = `/api/technicians/${id}/schedule${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get<any[]>(url);
      return response;
    } catch (err) {
      console.log("API not available, returning mock schedule");
      // Return mock schedule data
      return [
        {
          id: 'job-001',
          title: 'Maintenance Service',
          startTime: '2025-07-22T09:00:00',
          endTime: '2025-07-22T11:00:00',
          status: 'Scheduled',
          customer: 'John Smith'
        },
        {
          id: 'job-002',
          title: 'AC Repair',
          startTime: '2025-07-22T13:00:00',
          endTime: '2025-07-22T15:00:00',
          status: 'Scheduled',
          customer: 'Jane Doe'
        }
      ];
    }
  },

  /**
   * Get technician performance metrics
   */
  getTechnicianPerformance: async (id: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> => {
    try {
      const response = await apiClient.get<any>(`/api/technicians/${id}/performance?period=${period}`);
      return response;
    } catch (err) {
      console.log("API not available, returning mock performance metrics");
      // Return mock performance data
      return {
        completedJobs: 24,
        averageRating: 4.7,
        onTimePercentage: 92,
        averageCompletionTime: 78, // minutes
        revenueGenerated: 9850,
        period
      };
    }
  }
};
