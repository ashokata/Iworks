import { apiClient } from './client';

// Types - these should eventually come from @fieldsmartpro/shared
export interface Job {
  id: string;
  tenantId: string;
  customerId: string;
  jobTypeId?: string;
  title: string;
  description?: string;
  status: JobStatus;
  priority: JobPriority;
  source: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration?: number;
  internalNotes?: string;
  customerNotes?: string;
  addressId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  customer?: {
    id: string;
    displayName: string;
    email?: string;
    phone?: string;
  };
  address?: {
    id: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  assignments?: JobAssignment[];
  lineItems?: JobLineItem[];
  checklists?: JobChecklist[];
}

export type JobStatus = 
  | 'UNSCHEDULED' 
  | 'SCHEDULED' 
  | 'DISPATCHED' 
  | 'EN_ROUTE' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'COMPLETED' 
  | 'INVOICED' 
  | 'PAID' 
  | 'CANCELLED';

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export interface JobAssignment {
  id: string;
  jobId: string;
  employeeId: string;
  role: 'PRIMARY' | 'SECONDARY' | 'HELPER';
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface JobLineItem {
  id: string;
  jobId: string;
  name: string;
  description?: string;
  type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'FEE' | 'DISCOUNT' | 'TAX';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isTaxable: boolean;
}

export interface JobChecklist {
  id: string;
  jobId: string;
  name: string;
  items: JobChecklistItem[];
}

export interface JobChecklistItem {
  id: string;
  checklistId: string;
  label: string;
  valueType: string;
  value?: string;
  isRequired: boolean;
  sortOrder: number;
  completedAt?: string;
  completedBy?: string;
}

export interface CreateJobRequest {
  customerId: string;
  title: string;
  description?: string;
  priority?: JobPriority;
  scheduledStart?: string;
  scheduledEnd?: string;
  addressId?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  status?: JobStatus;
  priority?: JobPriority;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  internalNotes?: string;
  customerNotes?: string;
}

/**
 * Job Service - handles all job-related API calls
 */
export const jobService = {
  /**
   * Get all jobs (with optional filters)
   */
  async getAllJobs(filters?: {
    status?: JobStatus;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Job[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/jobs?${queryString}` : '/jobs';
    
    const response = await apiClient.get<{ jobs: Job[] }>(url);
    return response.jobs;
  },

  /**
   * Get today's jobs for the current technician
   */
  async getTodayJobs(): Promise<Job[]> {
    const response = await apiClient.get<{ jobs: Job[] }>('/technician/today');
    return response.jobs;
  },

  /**
   * Get a single job by ID
   */
  async getJobById(id: string): Promise<Job> {
    const response = await apiClient.get<{ job: Job }>(`/jobs/${id}`);
    return response.job;
  },

  /**
   * Create a new job
   */
  async createJob(data: CreateJobRequest): Promise<Job> {
    const response = await apiClient.post<{ job: Job }>('/jobs', data);
    return response.job;
  },

  /**
   * Update a job
   */
  async updateJob(id: string, data: UpdateJobRequest): Promise<Job> {
    const response = await apiClient.put<{ job: Job }>(`/jobs/${id}`, data);
    return response.job;
  },

  /**
   * Update job status (convenience method)
   */
  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    return this.updateJob(id, { status });
  },

  /**
   * Clock in to a job (start work)
   */
  async clockIn(jobId: string): Promise<{ success: boolean; startTime: string }> {
    return apiClient.post(`/jobs/${jobId}/clock-in`);
  },

  /**
   * Clock out from a job (end work)
   */
  async clockOut(jobId: string): Promise<{ success: boolean; endTime: string; duration: number }> {
    return apiClient.post(`/jobs/${jobId}/clock-out`);
  },

  /**
   * Complete a job
   */
  async completeJob(jobId: string, data?: {
    notes?: string;
    signature?: string;
  }): Promise<Job> {
    const response = await apiClient.post<{ job: Job }>(`/jobs/${jobId}/complete`, data);
    return response.job;
  },

  /**
   * Add a line item to a job
   */
  async addLineItem(jobId: string, item: Omit<JobLineItem, 'id' | 'jobId'>): Promise<JobLineItem> {
    const response = await apiClient.post<{ lineItem: JobLineItem }>(`/jobs/${jobId}/line-items`, item);
    return response.lineItem;
  },

  /**
   * Update a checklist item
   */
  async updateChecklistItem(
    jobId: string, 
    checklistId: string, 
    itemId: string, 
    value: string
  ): Promise<JobChecklistItem> {
    const response = await apiClient.put<{ item: JobChecklistItem }>(
      `/jobs/${jobId}/checklists/${checklistId}/items/${itemId}`,
      { value }
    );
    return response.item;
  },

  /**
   * Upload a photo for a job
   */
  async uploadPhoto(jobId: string, photoUri: string, caption?: string): Promise<{ id: string; url: string }> {
    // For file uploads, we need to use FormData
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    if (caption) {
      formData.append('caption', caption);
    }

    return apiClient.post(`/jobs/${jobId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Upload a signature for a job
   */
  async uploadSignature(jobId: string, signatureBase64: string, signerName: string): Promise<{ id: string; url: string }> {
    return apiClient.post(`/jobs/${jobId}/signature`, {
      signature: signatureBase64,
      signerName,
    });
  },
};

