// API Services - Export all API services from a single entry point
export { apiClient } from './client';
export { jobService } from './jobService';
export { customerService } from './customerService';
export { authService } from './authService';

// Re-export types
export type { 
  Job, 
  JobStatus, 
  JobPriority, 
  JobAssignment, 
  JobLineItem, 
  JobChecklist, 
  JobChecklistItem,
  CreateJobRequest,
  UpdateJobRequest,
} from './jobService';

export type { 
  Customer, 
  CustomerType, 
  CustomerAddress,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from './customerService';

