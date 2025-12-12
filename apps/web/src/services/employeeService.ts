/**
 * Employee Service - PostgreSQL Backend
 * 
 * This service handles all employee-related API calls.
 * Uses the new database types that match the PostgreSQL schema.
 */

import { API_CONFIG } from '@/config/api.config';
import type {
  Employee,
  EmployeeRole,
  EmployeeSkill,
  User,
  PaginatedResponse,
} from '@/types/database.types';

// Get tenant ID from environment
const getTenantId = () => {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Transform API response to frontend Employee type
const transformEmployee = (apiEmployee: any): Employee => {
  const user = apiEmployee.user || {};
  
  return {
    id: apiEmployee.id || apiEmployee.employeeId,
    userId: apiEmployee.userId || apiEmployee.user_id,
    user: user.id ? transformUser(user) : undefined,
    tenantId: apiEmployee.tenantId,
    employeeNumber: apiEmployee.employeeNumber || apiEmployee.employee_number,
    hireDate: apiEmployee.hireDate || apiEmployee.hire_date,
    terminationDate: apiEmployee.terminationDate || apiEmployee.termination_date,
    jobTitle: apiEmployee.jobTitle || apiEmployee.job_title || user.role,
    department: apiEmployee.department,
    colorHex: apiEmployee.colorHex || apiEmployee.color_hex || apiEmployee.color || '#3B82F6',
    hourlyRate: apiEmployee.hourlyRate ? parseFloat(apiEmployee.hourlyRate) : undefined,
    overtimeRate: apiEmployee.overtimeRate ? parseFloat(apiEmployee.overtimeRate) : undefined,
    commissionRate: parseFloat(apiEmployee.commissionRate) || 0,
    canBeBookedOnline: apiEmployee.canBeBookedOnline ?? apiEmployee.can_be_booked_online ?? true,
    isDispatchEnabled: apiEmployee.isDispatchEnabled ?? apiEmployee.is_dispatch_enabled ?? true,
    receivesDispatchNotifications: apiEmployee.receivesDispatchNotifications ?? true,
    serviceArea: apiEmployee.serviceArea,
    maxDailyJobs: apiEmployee.maxDailyJobs,
    certifications: apiEmployee.certifications || [],
    emergencyContactName: apiEmployee.emergencyContactName,
    emergencyContactPhone: apiEmployee.emergencyContactPhone,
    notes: apiEmployee.notes,
    isArchived: apiEmployee.isArchived ?? apiEmployee.archived ?? false,
    archivedAt: apiEmployee.archivedAt,
    skills: (apiEmployee.skills || []).map(transformSkill),
    createdAt: apiEmployee.createdAt || new Date().toISOString(),
    updatedAt: apiEmployee.updatedAt || new Date().toISOString(),
  };
};

const transformUser = (apiUser: any): User => ({
  id: apiUser.id,
  tenantId: apiUser.tenantId,
  email: apiUser.email || '',
  firstName: apiUser.firstName || apiUser.first_name,
  lastName: apiUser.lastName || apiUser.last_name,
  fullName: `${apiUser.firstName || ''} ${apiUser.lastName || ''}`.trim() || apiUser.name || 'Unknown',
  phone: apiUser.phone,
  avatarUrl: apiUser.avatarUrl || apiUser.avatar_url || apiUser.avatar,
  role: apiUser.role || 'FIELD_TECH',
  isActive: apiUser.isActive ?? true,
  isVerified: apiUser.isVerified ?? false,
  mfaEnabled: apiUser.mfaEnabled ?? false,
  lastLoginAt: apiUser.lastLoginAt,
  preferences: apiUser.preferences || {},
  createdAt: apiUser.createdAt || new Date().toISOString(),
  updatedAt: apiUser.updatedAt || new Date().toISOString(),
});

const transformSkill = (apiSkill: any): EmployeeSkill => ({
  id: apiSkill.id,
  employeeId: apiSkill.employeeId,
  skillId: apiSkill.skillId,
  skill: apiSkill.skill,
  proficiencyLevel: apiSkill.proficiencyLevel || 'INTERMEDIATE',
  certifiedAt: apiSkill.certifiedAt,
  certificationExpires: apiSkill.certificationExpires,
  certificationNumber: apiSkill.certificationNumber,
  notes: apiSkill.notes,
});

export interface CreateEmployeeRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: EmployeeRole;
  jobTitle?: string;
  department?: string;
  colorHex?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  canBeBookedOnline?: boolean;
  isDispatchEnabled?: boolean;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  colorHex?: string;
  hourlyRate?: number;
  overtimeRate?: number;
  commissionRate?: number;
  canBeBookedOnline?: boolean;
  isDispatchEnabled?: boolean;
  receivesDispatchNotifications?: boolean;
  maxDailyJobs?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface EmployeeFilters {
  search?: string;
  role?: EmployeeRole;
  department?: string;
  isDispatchEnabled?: boolean;
  includeArchived?: boolean;
}

// Export service interface with methods
export const employeeService = {
  /**
   * Get all employees with optional filters
   */
  getAllEmployees: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    try {
      const tenantId = getTenantId();
      console.log('[Employee Service] Fetching employees from PostgreSQL API');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.isDispatchEnabled !== undefined) params.append('isDispatchEnabled', filters.isDispatchEnabled.toString());
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/employees${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, return empty array
        if (response.status === 404) {
          console.warn('[Employee Service] Employees endpoint not available, returning empty array');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Employee Service] Received employees:', data.employees?.length || 0);
      
      // Transform each employee
      const employees = (data.employees || []).map(transformEmployee);
      return employees;
    } catch (error: any) {
      console.warn('[Employee Service] Error fetching employees, returning empty array:', error.message);
      return [];
    }
  },
  
  /**
   * Get paginated employees
   */
  getEmployeesPaginated: async (
    limit: number = 50,
    offset: number = 0,
    filters?: EmployeeFilters
  ): Promise<PaginatedResponse<Employee>> => {
    try {
      const tenantId = getTenantId();
      
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.includeArchived) params.append('includeArchived', 'true');
      
      const url = `${API_CONFIG.BASE_URL}/employees?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const employees = (data.employees || []).map(transformEmployee);
      
      return {
        data: employees,
        total: data.total || employees.length,
        limit,
        offset,
        hasMore: offset + employees.length < (data.total || employees.length),
      };
    } catch (error: any) {
      console.warn('[Employee Service] Error fetching paginated employees:', error.message);
      return {
        data: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }
  },
  
  /**
   * Get an employee by ID
   */
  getEmployeeById: async (id: string): Promise<Employee | null> => {
    try {
      console.log(`[Employee Service] Fetching employee: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (response.status === 404) {
        console.log('[Employee Service] Employee not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle { employee: ... } wrapper
      const employeeData = data.employee || data;
      return transformEmployee(employeeData);
    } catch (error: any) {
      console.warn(`[Employee Service] Error fetching employee ${id}:`, error.message);
      return null;
    }
  },
  
  /**
   * Get dispatch-enabled employees (technicians)
   */
  getDispatchableEmployees: async (): Promise<Employee[]> => {
    return employeeService.getAllEmployees({ isDispatchEnabled: true });
  },
  
  /**
   * Get employees available for online booking
   */
  getBookableEmployees: async (): Promise<Employee[]> => {
    try {
      const employees = await employeeService.getAllEmployees();
      return employees.filter(e => e.canBeBookedOnline && !e.isArchived);
    } catch (error) {
      return [];
    }
  },
  
  /**
   * Create a new employee
   */
  createEmployee: async (employeeData: CreateEmployeeRequest): Promise<Employee> => {
    try {
      console.log('[Employee Service] Creating employee');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Employee Service] Employee created successfully');
      
      // Handle { employee: ... } wrapper
      const employeeResponse = data.employee || data;
      return transformEmployee(employeeResponse);
    } catch (error: any) {
      console.error('[Employee Service] Error creating employee:', error);
      throw error;
    }
  },
  
  /**
   * Update an employee
   */
  updateEmployee: async (id: string, employeeData: UpdateEmployeeRequest): Promise<Employee> => {
    try {
      console.log(`[Employee Service] Updating employee: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Employee Service] Employee updated successfully');
      
      // Handle { employee: ... } wrapper
      const employeeResponse = data.employee || data;
      return transformEmployee(employeeResponse);
    } catch (error: any) {
      console.error(`[Employee Service] Error updating employee ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Archive (soft delete) an employee
   */
  archiveEmployee: async (id: string): Promise<void> => {
    try {
      console.log(`[Employee Service] Archiving employee: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      console.log('[Employee Service] Employee archived successfully');
    } catch (error: any) {
      console.error(`[Employee Service] Error archiving employee ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get employee schedule
   */
  getEmployeeSchedule: async (employeeId: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${employeeId}/schedule`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.schedule || [];
    } catch (error: any) {
      console.warn(`[Employee Service] Error fetching schedule for employee ${employeeId}:`, error.message);
      return [];
    }
  },
  
  /**
   * Update employee schedule
   */
  updateEmployeeSchedule: async (employeeId: string, schedule: any[]): Promise<any[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${employeeId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify({ schedule }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.schedule || [];
    } catch (error: any) {
      console.error(`[Employee Service] Error updating schedule for employee ${employeeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Add skill to employee
   */
  addSkill: async (employeeId: string, skillId: string, proficiencyLevel?: string): Promise<EmployeeSkill> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${employeeId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify({ skillId, proficiencyLevel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformSkill(data.skill || data);
    } catch (error: any) {
      console.error('[Employee Service] Error adding skill:', error);
      throw error;
    }
  },
  
  /**
   * Remove skill from employee
   */
  removeSkill: async (employeeId: string, skillId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/employees/${employeeId}/skills/${skillId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('[Employee Service] Error removing skill:', error);
      throw error;
    }
  },
  
  /**
   * Delete employee (alias for archiveEmployee)
   */
  deleteEmployee: async (id: string): Promise<void> => {
    return employeeService.archiveEmployee(id);
  },
};

// Re-export types for convenience
export type { Employee, EmployeeRole, EmployeeSkill, User };
