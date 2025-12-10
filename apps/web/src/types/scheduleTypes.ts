import { Job } from './index';

/**
 * Represents a schedule event in the calendar
 */
export interface ScheduleEvent {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  start: string; // ISO datetime string
  end: string;   // ISO datetime string
  allDay: boolean;
  technicianId: string;
  jobId?: string; // Optional reference to a job
  location?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  color?: string; // Color for display in calendar
  type: 'job' | 'meeting' | 'training' | 'break' | 'other';
}

/**
 * Request object for creating a new schedule event
 */
export interface CreateScheduleEventRequest {
  title: string;
  description?: string;
  start: string; // ISO datetime string
  end: string;   // ISO datetime string
  allDay: boolean;
  technicianId: string;
  jobId?: string;
  location?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'job' | 'meeting' | 'training' | 'break' | 'other';
}

/**
 * Request object for updating an existing schedule event
 */
export interface UpdateScheduleEventRequest {
  id: string;
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  technicianId?: string;
  jobId?: string;
  location?: string;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type?: 'job' | 'meeting' | 'training' | 'break' | 'other';
}

/**
 * Schedule view filter options
 */
export interface ScheduleFilterOptions {
  technicianIds?: string[]; // Filter by specific technicians
  startDate?: string;      // ISO date string for range start
  endDate?: string;        // ISO date string for range end
  status?: ('scheduled' | 'in-progress' | 'completed' | 'cancelled')[];
  types?: ('job' | 'meeting' | 'training' | 'break' | 'other')[];
}

/**
 * Calendar view option
 */
export type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';

/**
 * Resource for displaying technicians in calendar
 */
export interface TechnicianResource {
  id: string;
  title: string; // Technician name
  imageUrl?: string; // Profile image
  status: 'Available' | 'Busy' | 'Off Duty';
}
