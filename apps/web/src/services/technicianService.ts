/**
 * Technician Service - PostgreSQL Backend
 * 
 * This service is a wrapper around employeeService for technician-specific operations.
 * Technicians are employees with isDispatchEnabled = true.
 */

import { employeeService, Employee } from './employeeService';

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
  colorHex?: string;
  jobTitle?: string;
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

// Transform Employee to Technician format
const transformEmployeeToTechnician = (employee: Employee): Technician => {
  const user = employee.user;
  const fullName = user 
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
    : (employee as any).name || 'Unknown';
  
  return {
    id: employee.id,
    name: fullName,
    email: user?.email || (employee as any).email || '',
    phone: user?.phone || (employee as any).phone || '',
    skills: employee.skills?.map(s => s.skill?.name || s.skillId) || [],
    rating: (employee as any).rating || 5,
    tenantId: employee.tenantId,
    yearsOfExperience: (employee as any).yearsOfExperience || 0,
    status: employee.isArchived ? 'Inactive' : 'Active',
    profileImage: user?.avatarUrl || '',
    isTechnician: employee.isDispatchEnabled,
    role: user?.role || 'FIELD_TECH',
    specialty: [],
    activeJobs: 0,
    completedJobs: 0,
    availability: employee.isArchived ? 'Inactive' : 'Active',
    lastActive: employee.updatedAt,
    bio: employee.notes || '',
    hireDate: employee.hireDate,
    certifications: employee.certifications || [],
    performanceRating: 5,
    colorHex: employee.colorHex,
    jobTitle: employee.jobTitle,
    emergencyContact: employee.emergencyContactName ? {
      name: employee.emergencyContactName,
      phone: employee.emergencyContactPhone || '',
      relationship: '',
    } : undefined,
  };
};

export const technicianService = {
  /**
   * Get all technicians (dispatch-enabled employees)
   */
  getAllTechnicians: async (): Promise<Technician[]> => {
    try {
      console.log('[Technician Service] Fetching technicians from PostgreSQL API');
      
      // Get dispatch-enabled employees only
      const employees = await employeeService.getDispatchableEmployees();
      
      console.log('[Technician Service] Received employees:', employees.length);
      
      // Transform to technician format
      const technicians = employees.map(transformEmployeeToTechnician);
      
      return technicians;
    } catch (error: any) {
      console.warn('[Technician Service] Error fetching technicians, returning empty array:', error.message);
      return [];
    }
  },

  /**
   * Get a single technician by ID
   */
  getTechnicianById: async (id: string): Promise<Technician | null> => {
    try {
      console.log('[Technician Service] Fetching technician:', id);
      
      const employee = await employeeService.getEmployeeById(id);
      
      if (!employee) {
        return null;
      }
      
      return transformEmployeeToTechnician(employee);
    } catch (error: any) {
      console.warn('[Technician Service] Error fetching technician:', error.message);
      return null;
    }
  },

  /**
   * Create a new technician
   */
  createTechnician: async (technicianData: Partial<Technician>): Promise<Technician> => {
    try {
      console.log('[Technician Service] Creating technician');
      
      // Split name into firstName and lastName
      const nameParts = (technicianData.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const employee = await employeeService.createEmployee({
        email: technicianData.email || '',
        firstName,
        lastName,
        phone: technicianData.phone,
        role: 'FIELD_TECH',
        jobTitle: technicianData.jobTitle || technicianData.role || 'Field Technician',
        colorHex: technicianData.colorHex,
        isDispatchEnabled: true,
        canBeBookedOnline: true,
      });
      
      return transformEmployeeToTechnician(employee);
    } catch (error: any) {
      console.error('[Technician Service] Error creating technician:', error);
      throw error;
    }
  },

  /**
   * Update a technician
   */
  updateTechnician: async (id: string, technicianData: Partial<Technician>): Promise<Technician> => {
    try {
      console.log('[Technician Service] Updating technician:', id);
      
      // Split name into firstName and lastName if provided
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (technicianData.name) {
        const nameParts = technicianData.name.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
      
      const employee = await employeeService.updateEmployee(id, {
        firstName,
        lastName,
        phone: technicianData.phone,
        jobTitle: technicianData.jobTitle || technicianData.role,
        colorHex: technicianData.colorHex,
        notes: technicianData.bio,
        emergencyContactName: technicianData.emergencyContact?.name,
        emergencyContactPhone: technicianData.emergencyContact?.phone,
      });
      
      return transformEmployeeToTechnician(employee);
    } catch (error: any) {
      console.error('[Technician Service] Error updating technician:', error);
      throw error;
    }
  },

  /**
   * Delete (archive) a technician
   */
  deleteTechnician: async (id: string): Promise<void> => {
    try {
      console.log('[Technician Service] Deleting technician:', id);
      await employeeService.archiveEmployee(id);
    } catch (error: any) {
      console.error('[Technician Service] Error deleting technician:', error);
      throw error;
    }
  },

  /**
   * Get technician availability/schedule
   */
  getTechnicianSchedule: async (id: string): Promise<any[]> => {
    try {
      return await employeeService.getEmployeeSchedule(id);
    } catch (error: any) {
      console.warn('[Technician Service] Error fetching schedule:', error.message);
      return [];
    }
  },
};
