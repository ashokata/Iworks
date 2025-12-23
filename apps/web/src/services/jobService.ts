/**
 * Job Service - PostgreSQL Backend
 * 
 * This service handles all job-related API calls.
 * Uses the new database types that match the PostgreSQL schema.
 */

import { API_CONFIG } from '@/config/api.config';
import type {
  Job,
  JobStatus,
  JobPriority,
  JobAssignment,
  JobLineItem,
  CreateJobRequest,
  UpdateJobRequest,
  JobFilters,
  PaginatedResponse,
  CustomerSummary,
  AddressSummary,
  EmployeeSummary,
} from '@/types/database.types';

// Get tenant ID from user session (stored in localStorage)
const getTenantId = () => {
  // Try to get tenant ID from user session first
  if (typeof window !== 'undefined') {
    try {
      const userStr = localStorage.getItem('authUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.tenantId) {
          return user.tenantId;
        }
      }
    } catch (e) {
      console.warn('[Job Service] Error reading tenant ID from session:', e);
    }
  }
  // Fall back to environment variable or default
  return process.env.NEXT_PUBLIC_TENANT_ID || 'local-tenant';
};

// Transform API response to frontend Job type
const transformJob = (apiJob: any): Job => {
  return {
    id: apiJob.id || apiJob.jobId,
    tenantId: apiJob.tenantId,
    jobNumber: apiJob.jobNumber || apiJob.job_number || '',
    customerId: apiJob.customerId || apiJob.customer_id || '',
    customer: apiJob.customer ? transformCustomerSummary(apiJob.customer) : undefined,
    addressId: apiJob.addressId || apiJob.address_id || '',
    address: apiJob.address ? transformAddressSummary(apiJob.address) : undefined,
    jobTypeId: apiJob.jobTypeId || apiJob.job_type_id,
    jobType: apiJob.jobType,
    status: (apiJob.status || 'UNSCHEDULED').toUpperCase() as JobStatus,
    priority: (apiJob.priority || 'NORMAL').toUpperCase() as JobPriority,
    source: apiJob.source || 'MANUAL',
    title: apiJob.title || apiJob.JobName || '',
    description: apiJob.description || apiJob.Description || '',
    internalNotes: apiJob.internalNotes || apiJob.internal_notes || '',
    
    // Scheduling
    scheduledStart: apiJob.scheduledStart || apiJob.scheduled_start || apiJob.ScheduledDate,
    scheduledEnd: apiJob.scheduledEnd || apiJob.scheduled_end,
    arrivalWindowStart: apiJob.arrivalWindowStart,
    arrivalWindowEnd: apiJob.arrivalWindowEnd,
    actualStart: apiJob.actualStart || apiJob.actual_start || apiJob.StartDate,
    actualEnd: apiJob.actualEnd || apiJob.actual_end || apiJob.EndDate,
    estimatedDuration: apiJob.estimatedDuration || apiJob.estimated_duration || apiJob.EstimatedDuration || 60,
    
    // Relationships
    parentJobId: apiJob.parentJobId,
    isCallback: apiJob.isCallback ?? false,
    callbackReason: apiJob.callbackReason,
    estimateId: apiJob.estimateId,
    serviceAgreementId: apiJob.serviceAgreementId,
    
    // Financials
    subtotal: parseFloat(apiJob.subtotal) || 0,
    discountAmount: parseFloat(apiJob.discountAmount) || 0,
    taxAmount: parseFloat(apiJob.taxAmount) || 0,
    total: parseFloat(apiJob.total) || 0,
    
    // Tracking
    dispatchedAt: apiJob.dispatchedAt,
    completedAt: apiJob.completedAt,
    cancelledAt: apiJob.cancelledAt,
    cancellationReason: apiJob.cancellationReason,
    
    customFields: apiJob.customFields || {},
    createdById: apiJob.createdById,
    
    // Relations
    assignments: (apiJob.assignments || []).map(transformAssignment),
    lineItems: (apiJob.lineItems || apiJob.JobLineItems || []).map(transformLineItem),
    attachments: apiJob.attachments || [],
    checklists: apiJob.checklists || [],
    
    createdAt: apiJob.createdAt || apiJob.createdDate || new Date().toISOString(),
    updatedAt: apiJob.updatedAt || apiJob.changedDate || new Date().toISOString(),
  };
};

const transformCustomerSummary = (customer: any): CustomerSummary => ({
  id: customer.id || customer.customerId,
  customerNumber: customer.customerNumber,
  type: customer.type || 'RESIDENTIAL',
  firstName: customer.firstName || customer.first_name,
  lastName: customer.lastName || customer.last_name,
  companyName: customer.companyName || customer.company_name,
  displayName: customer.displayName || customer.companyName || 
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
  email: customer.email,
  mobilePhone: customer.mobilePhone || customer.mobile_number || customer.phone,
});

const transformAddressSummary = (address: any): AddressSummary => ({
  id: address.id,
  street: address.street || address.address || '',
  city: address.city || '',
  state: address.state || '',
  zip: address.zip || address.zipCode || '',
  fullAddress: `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim(),
});

const transformAssignment = (assignment: any): JobAssignment => ({
  id: assignment.id,
  jobId: assignment.jobId,
  employeeId: assignment.employeeId,
  employee: assignment.employee ? {
    id: assignment.employee.id,
    userId: assignment.employee.userId,
    firstName: assignment.employee.user?.firstName || assignment.employee.firstName,
    lastName: assignment.employee.user?.lastName || assignment.employee.lastName,
    fullName: assignment.employee.user 
      ? `${assignment.employee.user.firstName || ''} ${assignment.employee.user.lastName || ''}`.trim()
      : 'Unknown',
    colorHex: assignment.employee.colorHex || '#3B82F6',
    jobTitle: assignment.employee.jobTitle,
  } : undefined,
  role: assignment.role || 'PRIMARY',
  commissionRate: assignment.commissionRate,
  notifiedAt: assignment.notifiedAt,
  acceptedAt: assignment.acceptedAt,
  declinedAt: assignment.declinedAt,
  declineReason: assignment.declineReason,
  createdAt: assignment.createdAt || new Date().toISOString(),
  updatedAt: assignment.updatedAt || new Date().toISOString(),
});

const transformLineItem = (item: any): JobLineItem => ({
  id: item.id || item.LineItemID?.toString(),
  jobId: item.jobId,
  type: item.type || (item.itemType === 'Service' ? 'SERVICE' : 'MATERIAL'),
  serviceId: item.serviceId,
  materialId: item.materialId,
  name: item.name || item.Name || '',
  description: item.description || item.Description || '',
  quantity: parseFloat(item.quantity) || parseFloat(item.Quantity) || 1,
  unitPrice: parseFloat(item.unitPrice) || parseFloat(item.UnitPrice) || 0,
  unitCost: parseFloat(item.unitCost) || 0,
  discountPercent: parseFloat(item.discountPercent) || 0,
  discountAmount: parseFloat(item.discountAmount) || 0,
  taxRate: parseFloat(item.taxRate) || 0,
  isTaxable: item.isTaxable ?? item.taxable ?? true,
  total: parseFloat(item.total) || parseFloat(item.totalPrice) || parseFloat(item.TotalPrice) || 0,
  sortOrder: item.sortOrder || 0,
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString(),
});

// Build request body for create/update
const buildJobRequestBody = (data: CreateJobRequest | UpdateJobRequest): Record<string, any> => {
  const body: Record<string, any> = {};
  
  if ('customerId' in data && data.customerId) body.customerId = data.customerId;
  if ('addressId' in data && data.addressId) body.addressId = data.addressId;
  if ('jobTypeId' in data) body.jobTypeId = data.jobTypeId;
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if ('internalNotes' in data) body.internalNotes = data.internalNotes;
  if ('status' in data && data.status) body.status = data.status;
  if ('priority' in data && data.priority) body.priority = data.priority;
  if ('source' in data) body.source = data.source;
  if ('scheduledStart' in data) body.scheduledStart = data.scheduledStart;
  if ('scheduledEnd' in data) body.scheduledEnd = data.scheduledEnd;
  if ('actualStart' in data) body.actualStart = data.actualStart;
  if ('actualEnd' in data) body.actualEnd = data.actualEnd;
  if ('estimatedDuration' in data) body.estimatedDuration = data.estimatedDuration;
  if ('cancellationReason' in data) body.cancellationReason = data.cancellationReason;
  if ('estimateId' in data) body.estimateId = data.estimateId;
  if ('serviceAgreementId' in data) body.serviceAgreementId = data.serviceAgreementId;
  if ('assignedEmployeeIds' in data) body.assignedEmployeeIds = data.assignedEmployeeIds;
  if ('lineItems' in data) body.lineItems = data.lineItems;
  
  return body;
};

// Export service interface with methods
export const jobService = {
  /**
   * Get all jobs with optional filters
   */
  getAllJobs: async (filters?: JobFilters): Promise<Job[]> => {
    try {
      const tenantId = getTenantId();
      console.log('[Job Service] Fetching jobs from PostgreSQL API');
      
      // Build query string
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          params.append('priority', filters.priority.join(','));
        } else {
          params.append('priority', filters.priority);
        }
      }
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.jobTypeId) params.append('jobTypeId', filters.jobTypeId);
      if (filters?.scheduledFrom) params.append('scheduledFrom', filters.scheduledFrom);
      if (filters?.scheduledTo) params.append('scheduledTo', filters.scheduledTo);
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/jobs${queryString ? `?${queryString}` : ''}`;
      
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
          console.warn('[Job Service] Jobs endpoint not available, returning empty array');
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Job Service] Received jobs:', data.jobs?.length || 0);
      
      // Transform each job
      const jobs = (data.jobs || []).map(transformJob);
      return jobs;
    } catch (error: any) {
      console.warn('[Job Service] Error fetching jobs, returning empty array:', error.message);
      return [];
    }
  },
  
  /**
   * Get paginated jobs
   */
  getJobsPaginated: async (
    limit: number = 50,
    offset: number = 0,
    filters?: JobFilters
  ): Promise<PaginatedResponse<Job>> => {
    try {
      const tenantId = getTenantId();
      
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      
      const url = `${API_CONFIG.BASE_URL}/jobs?${params.toString()}`;
      
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
      const jobs = (data.jobs || []).map(transformJob);
      
      return {
        data: jobs,
        total: data.total || jobs.length,
        limit,
        offset,
        hasMore: offset + jobs.length < (data.total || jobs.length),
      };
    } catch (error: any) {
      console.warn('[Job Service] Error fetching paginated jobs:', error.message);
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
   * Get a job by ID
   */
  getJobById: async (id: string): Promise<Job | null> => {
    try {
      console.log(`[Job Service] Fetching job: ${id}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (response.status === 404) {
        console.log('[Job Service] Job not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle { job: ... } wrapper
      const jobData = data.job || data;
      return transformJob(jobData);
    } catch (error: any) {
      console.warn(`[Job Service] Error fetching job ${id}:`, error.message);
      return null;
    }
  },
  
  /**
   * Get job by job number
   */
  getJobByNumber: async (jobNumber: string): Promise<Job | null> => {
    try {
      console.log(`[Job Service] Fetching job by number: ${jobNumber}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs?jobNumber=${encodeURIComponent(jobNumber)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const jobs = data.jobs || [];
      
      if (jobs.length === 0) return null;
      return transformJob(jobs[0]);
    } catch (error: any) {
      console.warn(`[Job Service] Error fetching job by number ${jobNumber}:`, error.message);
      return null;
    }
  },
  
  /**
   * Get jobs for schedule (date range)
   */
  getJobsForSchedule: async (startDate: string, endDate: string, employeeId?: string): Promise<Job[]> => {
    try {
      console.log(`[Job Service] Fetching schedule: ${startDate} to ${endDate}`);
      
      const params = new URLSearchParams();
      params.append('scheduledFrom', startDate);
      params.append('scheduledTo', endDate);
      if (employeeId) params.append('employeeId', employeeId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs?${params.toString()}`, {
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
      return (data.jobs || []).map(transformJob);
    } catch (error: any) {
      console.warn('[Job Service] Error fetching schedule:', error.message);
      return [];
    }
  },
  
  /**
   * Create a new job
   */
  createJob: async (jobData: CreateJobRequest): Promise<Job> => {
    try {
      console.log('[Job Service] Creating job');
      
      const body = buildJobRequestBody(jobData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Job Service] Job created successfully');
      
      // Handle { job: ... } wrapper
      const jobResponse = data.job || data;
      return transformJob(jobResponse);
    } catch (error: any) {
      console.error('[Job Service] Error creating job:', error);
      throw error;
    }
  },
  
  /**
   * Update a job
   */
  updateJob: async (id: string, jobData: UpdateJobRequest): Promise<Job> => {
    try {
      console.log(`[Job Service] Updating job: ${id}`);
      
      const body = buildJobRequestBody(jobData);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Job Service] Job updated successfully');
      
      // Handle { job: ... } wrapper
      const jobResponse = data.job || data;
      return transformJob(jobResponse);
    } catch (error: any) {
      console.error(`[Job Service] Error updating job ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Update job status
   */
  updateJobStatus: async (id: string, status: JobStatus, reason?: string): Promise<Job> => {
    return jobService.updateJob(id, { 
      status, 
      ...(status === 'CANCELLED' && reason ? { cancellationReason: reason } : {})
    });
  },
  
  /**
   * Assign employee to job
   */
  assignEmployee: async (jobId: string, employeeId: string, role: 'PRIMARY' | 'SECONDARY' | 'HELPER' = 'PRIMARY'): Promise<JobAssignment> => {
    try {
      console.log(`[Job Service] Assigning employee ${employeeId} to job ${jobId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/${jobId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify({ employeeId, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformAssignment(data.assignment || data);
    } catch (error: any) {
      console.error('[Job Service] Error assigning employee:', error);
      throw error;
    }
  },
  
  /**
   * Remove employee from job
   */
  unassignEmployee: async (jobId: string, employeeId: string): Promise<void> => {
    try {
      console.log(`[Job Service] Removing employee ${employeeId} from job ${jobId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/${jobId}/assignments/${employeeId}`, {
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
    } catch (error: any) {
      console.error('[Job Service] Error removing employee:', error);
      throw error;
    }
  },
  
  /**
   * Add line item to job
   */
  addLineItem: async (jobId: string, lineItem: Partial<JobLineItem>): Promise<JobLineItem> => {
    try {
      console.log(`[Job Service] Adding line item to job ${jobId}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/${jobId}/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': getTenantId(),
        },
        body: JSON.stringify(lineItem),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return transformLineItem(data.lineItem || data);
    } catch (error: any) {
      console.error('[Job Service] Error adding line item:', error);
      throw error;
    }
  },
};

// Re-export types for convenience
export type { Job, JobStatus, JobPriority, JobAssignment, JobLineItem, CreateJobRequest, UpdateJobRequest };
