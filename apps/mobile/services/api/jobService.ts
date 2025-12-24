import { apiClient } from './client';

export interface Job {
  id: string;
  jobNumber: string;
  title: string;
  description?: string;
  status: 'UNSCHEDULED' | 'SCHEDULED' | 'DISPATCHED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration?: number;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    mobilePhone?: string;
    homePhone?: string;
    workPhone?: string;
    email?: string;
  };
  address?: {
    id: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
  };
  assignments?: Array<{
    employee: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  lineItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
}

export const jobService = {
  /**
   * Get all jobs for current tenant
   */
  async getJobs(params?: { 
    status?: string; 
    date?: string; 
    assignedTo?: string;
  }): Promise<JobsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.assignedTo) queryParams.append('assignedTo', params.assignedTo);
    
    const query = queryParams.toString();
    const url = `/jobs${query ? `?${query}` : ''}`;
    
    return apiClient.get<JobsResponse>(url);
  },

  /**
   * Get jobs for today
   */
  async getTodaysJobs(): Promise<JobsResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.getJobs({ date: today });
  },

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<Job> {
    return apiClient.get<Job>(`/jobs/${id}`);
  },

  /**
   * Update job status
   */
  async updateJobStatus(id: string, status: Job['status']): Promise<Job> {
    return apiClient.patch<Job>(`/jobs/${id}/status`, { status });
  },

  /**
   * Start a job (set status to IN_PROGRESS)
   */
  async startJob(id: string): Promise<Job> {
    return this.updateJobStatus(id, 'IN_PROGRESS');
  },

  /**
   * Complete a job
   */
  async completeJob(id: string): Promise<Job> {
    return this.updateJobStatus(id, 'COMPLETED');
  },

  /**
   * Set job en route
   */
  async setEnRoute(id: string): Promise<Job> {
    return this.updateJobStatus(id, 'EN_ROUTE');
  },
};
