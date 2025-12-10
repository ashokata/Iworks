import { apiClient } from './apiClient';
import { ScheduleEvent, CreateScheduleEventRequest, UpdateScheduleEventRequest, ScheduleFilterOptions } from '@/types/scheduleTypes';

// Mock data for development - using July 2025 dates
const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: 'event-001',
    tenantId: 'tenant-1',
    title: 'HVAC Repair at Johnson Residence',
    description: 'Repair broken central air unit',
    start: '2025-07-22T09:00:00',
    end: '2025-07-22T11:00:00',
    allDay: false,
    technicianId: 'tech-001',
    jobId: 'job-001',
    location: '123 Main St, Anytown, USA',
    status: 'scheduled',
    type: 'job'
  },
  {
    id: 'event-002',
    tenantId: 'tenant-1',
    title: 'Weekly Team Meeting',
    description: 'Review job assignments and discuss issues',
    start: '2025-07-23T08:00:00',
    end: '2025-07-23T09:00:00',
    allDay: false,
    technicianId: 'tech-001',
    status: 'scheduled',
    type: 'meeting'
  },
  {
    id: 'event-003',
    tenantId: 'tenant-1',
    title: 'Electrical Installation',
    description: 'Install new lighting fixtures',
    start: '2025-07-22T13:00:00',
    end: '2025-07-22T16:00:00',
    allDay: false,
    technicianId: 'tech-002',
    jobId: 'job-002',
    location: '456 Oak Ave, Anytown, USA',
    status: 'scheduled',
    type: 'job'
  },
  {
    id: 'event-004',
    tenantId: 'tenant-1',
    title: 'Safety Training',
    description: 'Annual safety certification training',
    start: '2025-07-24T09:00:00',
    end: '2025-07-24T16:00:00',
    allDay: true,
    technicianId: 'tech-003',
    status: 'scheduled',
    type: 'training'
  },
  {
    id: 'event-005',
    tenantId: 'tenant-1',
    title: 'Emergency Plumbing Repair',
    description: 'Water heater leaking in basement',
    start: '2025-07-21T14:00:00',
    end: '2025-07-21T16:30:00',
    allDay: false,
    technicianId: 'tech-001',
    jobId: 'job-005',
    location: '789 Elm St, Anytown, USA',
    status: 'scheduled',
    type: 'job'
  }
];

/**
 * Service for managing schedule events
 */
export const scheduleService = {
  /**
   * Get all schedule events with optional filtering
   */
  getScheduleEvents: async (filters?: ScheduleFilterOptions): Promise<ScheduleEvent[]> => {
    try {
      // API call will fail in this application since we're using mock data
      throw new Error("Using mock data");
    } catch (error) {
      console.error('Error fetching schedule events:', error);
      
      // Return filtered mock data if API fails
      // Use mock data as fallback
      let filteredEvents = [...mockScheduleEvents];
      
      if (filters) {
        if (filters.technicianIds && filters.technicianIds.length > 0) {
          filteredEvents = filteredEvents.filter(event => 
            filters.technicianIds?.includes(event.technicianId)
          );
        }
        
        if (filters.startDate) {
          filteredEvents = filteredEvents.filter(event => 
            new Date(event.start) >= new Date(filters.startDate!)
          );
        }
        
        if (filters.endDate) {
          filteredEvents = filteredEvents.filter(event => 
            new Date(event.end) <= new Date(filters.endDate!)
          );
        }
        
        if (filters.status && filters.status.length > 0) {
          filteredEvents = filteredEvents.filter(event => 
            filters.status?.includes(event.status)
          );
        }
        
        if (filters.types && filters.types.length > 0) {
          filteredEvents = filteredEvents.filter(event => 
            filters.types?.includes(event.type)
          );
        }
      }
      
      return filteredEvents;
      
      return [];
    }
  },
  
  /**
   * Get schedule events for a specific technician
   */
  getTechnicianSchedule: async (technicianId: string, startDate?: string, endDate?: string): Promise<ScheduleEvent[]> => {
    return scheduleService.getScheduleEvents({
      technicianIds: [technicianId],
      startDate,
      endDate
    });
  },
  
  /**
   * Get a specific schedule event by ID
   */
  getScheduleEventById: async (id: string): Promise<ScheduleEvent | null> => {
    try {
      // API call will fail in this application since we're using mock data
      throw new Error("Using mock data");
    } catch (error) {
      console.error(`Error fetching schedule event ${id}:`, error);
      
      // Use mock data as fallback
      const event = mockScheduleEvents.find(e => e.id === id);
      return event || null;
    }
  },
  
  /**
   * Create a new schedule event
   */
  createScheduleEvent: async (event: CreateScheduleEventRequest): Promise<ScheduleEvent | null> => {
    try {
      // API call will fail in this application since we're using mock data
      throw new Error("Using mock data");
    } catch (error) {
      console.error('Error creating schedule event:', error);
      
      // Use mock data as fallback
      // Generate a new mock event with an ID
      const newEvent: ScheduleEvent = {
        ...event,
        id: `event-${Date.now()}`,
        tenantId: 'tenant-1' // Default tenant ID for mock data
      };
      
      return newEvent;
      
      return null;
    }
  },
  
  /**
   * Update an existing schedule event
   */
  updateScheduleEvent: async (event: UpdateScheduleEventRequest): Promise<ScheduleEvent | null> => {
    try {
      // API call will fail in this application since we're using mock data
      throw new Error("Using mock data");
    } catch (error) {
      console.error(`Error updating schedule event ${event.id}:`, error);
      
      // Use mock data as fallback
      // Find the existing event
      const existingEventIndex = mockScheduleEvents.findIndex(e => e.id === event.id);
      
      if (existingEventIndex !== -1) {
        // Create updated event by merging the update with existing data
        const updatedEvent: ScheduleEvent = {
          ...mockScheduleEvents[existingEventIndex],
          ...event
        };
        
        return updatedEvent;
      }
      
      return null;
    }
  },
  
  /**
   * Delete a schedule event
   */
  deleteScheduleEvent: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/schedule-events/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting schedule event ${id}:`, error);
      
      // Use mock data as fallback
      // Simulate deletion success
      return true;
      
      return false;
    }
  },
  
  /**
   * Convert a job to a schedule event
   */
  convertJobToScheduleEvent: (job: any, technicianId: string): CreateScheduleEventRequest => {
    return {
      title: job.title,
      description: job.description || '',
      start: job.date || new Date().toISOString(),
      end: job.date ? new Date(new Date(job.date).getTime() + (job.estimatedDuration || 60) * 60000).toISOString() : new Date(new Date().getTime() + 60 * 60000).toISOString(),
      allDay: false,
      technicianId: technicianId || job.assignedTo,
      jobId: job.id,
      location: job.location,
      status: 'scheduled',
      type: 'job'
    };
  }
};
