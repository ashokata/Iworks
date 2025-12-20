/**
 * Employee API Schema Mappings
 * 
 * Handles transformation between OData Employee API and frontend Employee interface
 */

import { Employee } from '@/types/database.types';

/**
 * API Field Mapping for Employees
 * Maps OData backend fields to frontend Technician interface
 */
export const EMPLOYEE_FIELD_MAP = {
  // Backend → Frontend
  EmployeeID: 'id',
  EmployeeName: 'name',
  Email: 'email',
  PhoneNumber: 'phone',
  Skills: 'skills',
  Rating: 'rating',
  YearsOfExperience: 'yearsOfExperience',
  Status: 'status',
  ProfileImage: 'profileImage',
  IsTechnician: 'isTechnician',
  Role: 'role',
  Specialty: 'specialty',
  ActiveJobs: 'activeJobs',
  CompletedJobs: 'completedJobs',
  Availability: 'availability',
  LastActive: 'lastActive',
  Bio: 'bio',
  HireDate: 'hireDate',
  Certifications: 'certifications',
  PerformanceRating: 'performanceRating',
  Supervisor: 'supervisor',
} as const;

/**
 * Transform OData Employee response to frontend Employee interface
 */
export const transformEmployeeFromApi = (apiEmployee: any): Employee => {
  console.log('[Employee Schema] Transforming employee:', apiEmployee?.EmployeeID || 'unknown');
  console.log('[Employee Schema] Raw API data:', apiEmployee);
  
  // Helper to convert string to array (split by comma) or return empty array
  const stringToArray = (value: any): string[] => {
    if (!value) return [];
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    if (Array.isArray(value)) return value;
    return [];
  };
  
  // Actual API fields: EmployeeID, FullName, Email, PhoneNumber, Role, IsActive, Bio, HireDate, YearsOfExperience, Skills, Specialty, Certifications, IsTechnician
  return {
    id: String(apiEmployee.EmployeeID || apiEmployee.id || `emp_${Date.now()}`),
    name: apiEmployee.FullName || apiEmployee.EmployeeName || 
          (apiEmployee.FirstName && apiEmployee.LastName ? `${apiEmployee.FirstName} ${apiEmployee.LastName}` : '') || 
          apiEmployee.Name || '',
    email: apiEmployee.Email || apiEmployee.email || '',
    phone: apiEmployee.PhoneNumber || apiEmployee.phone || '',
    skills: stringToArray(apiEmployee.Skills),
    rating: parseNumber(apiEmployee.Rating || apiEmployee.rating),
    yearsOfExperience: parseNumber(apiEmployee.YearsOfExperience || apiEmployee.yearsOfExperience),
    status: apiEmployee.IsActive ? 'Active' : 'Inactive',
    profileImage: apiEmployee.ProfileImage || apiEmployee.profileImage,
    isTechnician: apiEmployee.IsTechnician !== undefined ? apiEmployee.IsTechnician : false,
    // Extended fields
    role: apiEmployee.Role || apiEmployee.role || 'Technician',
    specialty: stringToArray(apiEmployee.Specialty),
    activeJobs: parseNumber(apiEmployee.ActiveJobs || apiEmployee.activeJobs),
    completedJobs: parseNumber(apiEmployee.CompletedJobs || apiEmployee.completedJobs),
    availability: apiEmployee.IsActive ? 'Active' : 'Inactive',
    lastActive: apiEmployee.LastLogin || apiEmployee.LastActive || apiEmployee.lastActive,
    bio: apiEmployee.Bio || apiEmployee.bio || '',
    hireDate: apiEmployee.HireDate || apiEmployee.createdDate || apiEmployee.hireDate || '',
    certifications: stringToArray(apiEmployee.Certifications),
    performanceRating: parseNumber(apiEmployee.PerformanceRating || apiEmployee.performanceRating || apiEmployee.Rating),
    supervisor: apiEmployee.Supervisor || apiEmployee.supervisor,
    currentJobs: apiEmployee.CurrentJobs || apiEmployee.currentJobs,
    recentJobs: apiEmployee.RecentJobs || apiEmployee.recentJobs,
  };
};

/**
 * Transform frontend Technician to API format for create/update
 */
export const transformEmployeeToApi = (technician: Partial<Technician>): any => {
  console.log('[Employee Schema] Transforming technician to API format:', technician.id);
  
  // Only send fields that the OData endpoint accepts
  const payload: any = {
    Role: technician.role || 'Technician',
    IsActive: (typeof (technician as any).isActive === 'boolean')
      ? (technician as any).isActive
      : (technician.status === 'Active'),
    IsTechnician: (typeof (technician as any).isTechnician === 'boolean') 
      ? (technician as any).isTechnician 
      : (technician.isTechnician !== undefined ? technician.isTechnician : false),
    PhoneNumber: technician.phone || '',
    FullName: technician.name || '',
    Email: technician.email || '',
  };

  // Add optional fields only if they have non-empty values (OData doesn't accept empty strings)
  if (technician.bio && technician.bio.trim()) payload.Bio = technician.bio;
  if (technician.hireDate && technician.hireDate.trim()) {
    // Convert date to ISO 8601 datetime format (YYYY-MM-DDTHH:mm:ssZ)
    payload.HireDate = technician.hireDate.includes('T') 
      ? technician.hireDate 
      : `${technician.hireDate}T00:00:00Z`;
  }
  if (typeof technician.yearsOfExperience === 'number' && technician.yearsOfExperience > 0) payload.YearsOfExperience = technician.yearsOfExperience;
  if (typeof (technician as any).skills === 'string' && (technician as any).skills.trim()) payload.Skills = (technician as any).skills.trim();
  if (typeof (technician as any).specialty === 'string' && (technician as any).specialty.trim()) payload.Specialty = (technician as any).specialty.trim();
  if (typeof (technician as any).certifications === 'string' && (technician as any).certifications.trim()) payload.Certifications = (technician as any).certifications.trim();

  console.log('[Employee Schema] Final API payload:', JSON.stringify(payload, null, 2));
  return payload;
};

// Helper functions
function parseSkills(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    // Handle comma-separated string
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return undefined;
}

function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? undefined : parsed;
}

function parseStatus(value: any): 'Available' | 'Busy' | 'Off Duty' | undefined {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase();
  if (normalized.includes('available')) return 'Available';
  if (normalized.includes('busy')) return 'Busy';
  if (normalized.includes('off') || normalized.includes('duty')) return 'Off Duty';
  return undefined;
}

function parseArray(value: any): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return undefined;
}
