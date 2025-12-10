/**
 * Technician API Schema Mappings
 * 
 * TODO: Update field mappings based on your actual Technician API response
 */

/**
 * API Field Mapping for Technicians
 */
export const TECHNICIAN_FIELD_MAP = {
  // Backend → Frontend (Example - adjust based on your API)
  TechnicianID: 'id',
  TechnicianName: 'name',
  Email: 'email',
  Phone: 'phone',
  Specialty: 'specialty',
  Status: 'status',
  TenantId: 'tenantId',
  // Add more fields as needed
} as const;

/**
 * Transform Technician from API
 * TODO: Implement when Technician API is ready
 */
export const transformTechnicianFromApi = (apiTechnician: any): any => {
  console.log('[Technician Schema] Transforming technician:', apiTechnician?.TechnicianID || 'unknown');
  
  // TODO: Implement based on your Technician type
  return {
    id: apiTechnician.TechnicianID || apiTechnician.id,
    name: apiTechnician.TechnicianName || apiTechnician.name,
    email: apiTechnician.Email || apiTechnician.email,
    phone: apiTechnician.Phone || apiTechnician.phone,
    specialty: apiTechnician.Specialty || apiTechnician.specialty,
    status: apiTechnician.Status || apiTechnician.status,
    tenantId: apiTechnician.TenantId || apiTechnician.tenantId,
    // Add more fields...
  };
};

/**
 * Transform Technician to API format
 * TODO: Implement when Technician API is ready
 */
export const transformTechnicianToApi = (technician: any): any => {
  console.log('[Technician Schema] Transforming technician to API format:', technician?.id || 'new');
  
  // TODO: Implement based on your API requirements
  return {
    TechnicianID: technician.id,
    TechnicianName: technician.name,
    Email: technician.email,
    Phone: technician.phone,
    Specialty: technician.specialty,
    Status: technician.status,
    TenantId: technician.tenantId,
    // Add more fields...
  };
};
