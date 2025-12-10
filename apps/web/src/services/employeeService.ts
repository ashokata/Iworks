import { apiClient } from './apiClient';
import { transformEmployeeFromApi, transformEmployeeToApi } from '@/config/apiSchemas/employee.schema';
import { extractODataResponse } from '@/config/apiSchemas/utils';

export interface Employee {
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

export const employeeService = {
  /**
   * Get all employees for the current tenant
   */
  getAllEmployees: async (): Promise<Employee[]> => {
    try {
      console.log('[Employee Service] Fetching all employees from OData API');
      const response = await apiClient.get<any>('/odata/iworks/v1/Employees');
      
      console.log('[Employee Service] Raw OData response:', response);
      
      // Extract the value array from OData response
      const employees = extractODataResponse(response);
      
      console.log('[Employee Service] Extracted employees:', employees);
      
      // Transform each employee from API format to frontend format
      const transformedEmployees = employees.map((emp: any) => transformEmployeeFromApi(emp));
      
      console.log('[Employee Service] Transformed employees:', transformedEmployees);
      
      return transformedEmployees;
    } catch (error) {
      console.error('[Employee Service] Error fetching employees:', error);
      throw error;
    }
  },

  /**
   * Get a single employee by ID
   */
  getEmployeeById: async (id: string): Promise<Employee> => {
    try {
      console.log('[Employee Service] Fetching employee:', id);
      // OData requires numeric ID without quotes in the URL
      const response = await apiClient.get<any>(`/odata/iworks/v1/Employees(${id})`);
      
      console.log('[Employee Service] Raw employee response:', response);
      
      const transformedEmployee = transformEmployeeFromApi(response);
      
      console.log('[Employee Service] Transformed employee:', transformedEmployee);
      
      return transformedEmployee;
    } catch (error) {
      console.error('[Employee Service] Error fetching employee:', error);
      throw error;
    }
  },

  /**
   * Create a new employee
   */
  createEmployee: async (employeeData: Partial<Employee>): Promise<Employee> => {
    try {
      console.log('[Employee Service] Creating employee:', employeeData);
      
      // Transform frontend data to API format
      const apiData = transformEmployeeToApi(employeeData);
      
      console.log('[Employee Service] Transformed API payload:', apiData);
      
      const response = await apiClient.post<any>('/odata/iworks/v1/Employees', apiData);
      
      console.log('[Employee Service] Create response:', response);
      
      // Transform response back to frontend format
      const transformedEmployee = transformEmployeeFromApi(response);
      
      return transformedEmployee;
    } catch (error) {
      console.error('[Employee Service] Error creating employee:', error);
      throw error;
    }
  },

  /**
   * Update an existing employee (PATCH)
   */
  updateEmployee: async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    try {
      console.log('[Employee Service] Updating employee:', id, employeeData);
      
      // Transform frontend data to API format
      const apiData = transformEmployeeToApi(employeeData) as any;
      
      console.log('[Employee Service] Transformed API payload for PATCH:', apiData);
      
      // OData requires numeric ID without quotes in the URL
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Employees(${id})`, apiData);
      
      console.log('[Employee Service] Update response:', response);
      
      // Transform response back to frontend format
      const transformedEmployee = transformEmployeeFromApi(response);
      
      return transformedEmployee;
    } catch (error) {
      console.error('[Employee Service] Error updating employee:', error);
      throw error;
    }
  },

  /**
   * Delete an employee
   */
  deleteEmployee: async (id: string): Promise<void> => {
    try {
      console.log('[Employee Service] Deleting employee:', id);
      // OData requires numeric ID without quotes in the URL
      await apiClient.delete(`/odata/iworks/v1/Employees(${id})`);
      console.log('[Employee Service] Employee deleted successfully');
    } catch (error) {
      console.error('[Employee Service] Error deleting employee:', error);
      throw error;
    }
  },
};
