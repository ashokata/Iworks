// src/services/jobService.ts
import { apiClient } from './apiClient';
import { Job, CreateJobRequest } from '@/types';
import { 
  transformJobFromApi, 
  transformCreateJobToApi,
  transformUpdateJobToApi,
  extractODataResponse 
} from '@/config/apiSchemas';

/**
 * Job Service
 * OData Endpoint: /odata/iworks/v1/Jobs
 * 
 * Available Operations:
 * - GET /Jobs - List all jobs
 * - GET /Jobs('{JobID}') - Get single job
 * - POST /Jobs - Create new job
 * - PATCH /Jobs('{JobID}') - Update job
 * - DELETE /Jobs('{JobID}') - Delete job
 * 
 * Expandable Relations:
 * - Job_AssignedTo (Employee)
 * - Customer
 * - JobLineItems
 * - Pricing
 */
export const jobService = {
  /**
   * Get all jobs
   * Endpoint: GET /odata/iworks/v1/Jobs
   * 
   * Query Options:
   * - $filter: Filter jobs (e.g., Status eq 'Scheduled')
   * - $orderby: Sort jobs (e.g., ScheduledDate desc)
   * - $expand: Expand relations (Job_AssignedTo, Customer, JobLineItems, Pricing)
   * - $select: Select specific fields
   * - $top/$skip: Pagination
   */
  getAllJobs: async (): Promise<Job[]> => {
    try {
      console.log('[Job Service] Fetching all jobs from: /odata/iworks/v1/Jobs');
      console.log('[Job Service] Full URL: http://localhost:8090/odata/iworks/v1/Jobs?$expand=Customer,Job_AssignedTo,JobLineItems,Pricing');
      
      // Expand related entities to get complete job details
        const response = await apiClient.get<any>('/odata/iworks/v1/Jobs?$expand=Customer,Job_AssignedTo,JobLineItems,Pricing');
      console.log('[Job Service] API response received:', response);
      
      // Extract OData response (handles 'value' array)
      const jobsData = extractODataResponse(response);
      console.log(`[Job Service] Processing ${jobsData.length} jobs from OData response`);
      
      // Transform API data to Job interface using centralized schema
      const transformedJobs = jobsData.map((apiJob: any) => transformJobFromApi(apiJob));
      console.log('[Job Service] Jobs transformed:', transformedJobs.length);
      
      return transformedJobs;
    } catch (error: any) {
      console.error('[Job Service] Error fetching jobs:', error);
      console.error('[Job Service] Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Get a job by ID
   * Endpoint: GET /odata/iworks/v1/Jobs('{JobID}')
   * 
   * @param id - JobID (UUID format)
   */
  getJobById: async (id: number): Promise<Job | null> => {
    try {
      console.log(`[Job Service] Fetching job with ID: ${id}`);
      console.log(`[Job Service] Full URL: /odata/iworks/v1/Jobs(${id})?$expand=Customer,Job_AssignedTo,JobLineItems,Pricing`);
      // Expand related entities to get complete job details including pricing
      const response = await apiClient.get<any>(`/odata/iworks/v1/Jobs(${id})?$expand=Customer,Job_AssignedTo,JobLineItems,Pricing`);
      console.log('[Job Service] Job retrieved successfully:', response);
      
      if (response) {
        const transformedJob = transformJobFromApi(response);
        console.log('[Job Service] Transformed job:', transformedJob);
        return transformedJob;
      }
      
      console.warn('[Job Service] No response data received');
      return null;
    } catch (error: any) {
      console.error(`[Job Service] ❌ Error fetching job ${id}:`, error);
      console.error('[Job Service] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Create a job line item
   * Endpoint: POST /odata/iworks/v1/JobLineItems
   * 
   * @param jobId - JobID to associate the line item with
   * @param lineItem - Line item data (already in OData format with capital case properties)
   */
  createJobLineItem: async (jobId: number, lineItem: any): Promise<any> => {
    try {
      const payload = {
        "Job@odata.bind": `Jobs(${jobId})`,
        Name: lineItem.Name || '',
        Description: lineItem.Description || '',
        Quantity: lineItem.Quantity || 0,
        UnitPrice: lineItem.UnitPrice || 0,
        TotalPrice: lineItem.TotalPrice || 0,
        UnitCost: lineItem.UnitCost || 0,
        ItemType: lineItem.ItemType || 'Product',
        Markup: lineItem.Markup || 0,
        IsTaxExempt: lineItem.IsTaxExempt || false,
      };

      console.log('[Job Service] Creating line item for job:', jobId);
      console.log('[Job Service] Line item payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<any>('/odata/iworks/v1/JobLineItems', payload);
      console.log('[Job Service] Line item created successfully');
      
      return response;
    } catch (error: any) {
      console.error('[Job Service] Error creating line item:', error);
      console.error('[Job Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Create a new job
   * Endpoint: POST /odata/iworks/v1/Jobs
   * 
   * Schema: JobCREATE
   * - Required: JobID (generated as UUID)
   * - Returns: 201 Created with Job object
   * - If line items exist, creates them separately after job creation
   * 
   * @param jobData - Job creation data
   */
  createJob: async (jobData: CreateJobRequest): Promise<Job> => {
    try {
      const apiJobData = transformCreateJobToApi(jobData);
      
      // Remove JobLineItems from the main payload - we'll create them separately
      const { JobLineItems, ...jobPayload } = apiJobData;
      const lineItemsToCreate = JobLineItems;
      
      console.log('[Job Service] Creating new job');
      console.log('[Job Service] Payload:', JSON.stringify(jobPayload, null, 2));
      
      const response = await apiClient.post<any>('/odata/iworks/v1/Jobs', jobPayload);
      console.log('[Job Service] Job created successfully:', response.JobID);
      
      // Create line items separately if they exist
      if (lineItemsToCreate && lineItemsToCreate.length > 0) {
        console.log(`[Job Service] Creating ${lineItemsToCreate.length} line items for job ${response.JobID}`);
        
        for (let i = 0; i < lineItemsToCreate.length; i++) {
          const lineItem = lineItemsToCreate[i];
          try {
            await jobService.createJobLineItem(response.JobID, lineItem);
            console.log(`[Job Service] Line item ${i + 1}/${lineItemsToCreate.length} created`);
          } catch (lineItemError) {
            console.error(`[Job Service] Failed to create line item ${i + 1}:`, lineItemError);
            // Continue creating other line items even if one fails
          }
        }
        
        console.log('[Job Service] All line items processed');
      }
      
      return transformJobFromApi(response);
    } catch (error: any) {
      console.error('[Job Service] Error creating job:', error);
      console.error('[Job Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Update an existing job
   * Endpoint: PATCH /odata/iworks/v1/Jobs('{JobID}')
   * 
   * Schema: JobUPDATE
   * - JobID is in URL path, not in body
   * - Only include fields being updated
   * - Returns: 201 Created or 204 No Content
   * 
   * @param id - JobID (UUID)
   * @param jobData - Partial job data to update
   */
  updateJob: async (id: number, jobData: Partial<Job>): Promise<Job> => {
    try {
      const apiJobData = transformUpdateJobToApi(jobData);
      
      console.log(`[Job Service] Updating job ${id}`);
      console.log('[Job Service] Update payload:', JSON.stringify(apiJobData, null, 2));
      
      const response = await apiClient.patch<any>(`/odata/iworks/v1/Jobs('${id}')`, apiJobData);
      console.log('[Job Service] Job updated successfully');
      
      // If response is 204 No Content, fetch the updated job
      if (!response || Object.keys(response).length === 0) {
        console.log('[Job Service] 204 response, fetching updated job');
        const updatedJob = await jobService.getJobById(id);
        if (!updatedJob) {
          throw new Error('Failed to fetch updated job');
        }
        return updatedJob;
      }
      
      return transformJobFromApi(response);
    } catch (error: any) {
      console.error(`[Job Service] Error updating job ${id}:`, error);
      console.error('[Job Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Delete a job
   * Endpoint: DELETE /odata/iworks/v1/Jobs('{JobID}')
   * 
   * Returns: 204 No Content
   * 
   * @param id - JobID (UUID)
   */
  deleteJob: async (id: number): Promise<void> => {
    try {
      console.log(`[Job Service] Deleting job ${id}`);
      
      await apiClient.delete(`/odata/iworks/v1/Jobs('${id}')`);
      console.log('[Job Service] Job deleted successfully');
    } catch (error: any) {
      console.error(`[Job Service] Error deleting job ${id}:`, error);
      console.error('[Job Service] Error details:', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  /**
   * Get jobs count
   * Endpoint: GET /odata/iworks/v1/Jobs/$count
   * 
   * Optional filters can be applied
   */
  getJobsCount: async (filter?: string): Promise<number> => {
    try {
      const url = filter 
        ? `/odata/iworks/v1/Jobs/$count?$filter=${encodeURIComponent(filter)}`
        : '/odata/iworks/v1/Jobs/$count';
      
      console.log(`[Job Service] Fetching jobs count: ${url}`);
      const count = await apiClient.get<number>(url);
      
      return count;
    } catch (error: any) {
      console.error('[Job Service] Error fetching jobs count:', error);
      throw error;
    }
  },
};
