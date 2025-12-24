import { apiClient } from './apiClient';

export interface CreateAppointmentDTO {
  title: string;
  description?: string;
  appointmentType?: string;
  customerId: string;
  addressId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration?: number;
  status?: string;
  priority?: string;
  assignedToId?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  appointmentNumber?: string;
  customerId: string;
  addressId?: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  title: string;
  description?: string;
  appointmentType?: string;
  status: string;
  priority: string;
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const appointmentService = {
  /**
   * Create a new appointment
   */
  createAppointment: async (data: CreateAppointmentDTO): Promise<Appointment> => {
    try {
      console.log('[Appointment Service] Creating appointment with data:', JSON.stringify(data, null, 2));
      
      const response = await apiClient.post<Appointment>('/appointments', data);
      
      console.log('[Appointment Service] Appointment created successfully:', response);
      return response;
    } catch (error: any) {
      console.error('[Appointment Service] Error creating appointment:', error);
      console.error('[Appointment Service] Error response:', error.response);
      console.error('[Appointment Service] Error data:', error.response?.data);
      console.error('[Appointment Service] Error status:', error.response?.status);
      
      // Re-throw with detailed error info
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create appointment';
      const fullError = new Error(errorMessage);
      (fullError as any).response = error.response;
      throw fullError;
    }
  },

  /**
   * Get all appointments
   */
  getAllAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('[Appointment Service] Fetching all appointments');
      
      const response = await apiClient.get<{ appointments: Appointment[] }>('/appointments');
      
      console.log('[Appointment Service] Fetched appointments:', response.appointments?.length || 0);
      return response.appointments || [];
    } catch (error: any) {
      console.error('[Appointment Service] Error fetching appointments:', error);
      throw new Error(error?.message || 'Failed to fetch appointments');
    }
  },

  /**
   * Get appointment by ID
   */
  getAppointmentById: async (id: string): Promise<Appointment> => {
    try {
      console.log('[Appointment Service] Fetching appointment:', id);
      
      const response = await apiClient.get<Appointment>(`/appointments/${id}`);
      
      console.log('[Appointment Service] Fetched appointment:', response);
      return response;
    } catch (error: any) {
      console.error('[Appointment Service] Error fetching appointment:', error);
      throw new Error(error?.message || 'Failed to fetch appointment');
    }
  },

  /**
   * Update appointment
   */
  updateAppointment: async (id: string, data: Partial<CreateAppointmentDTO>): Promise<Appointment> => {
    try {
      console.log('[Appointment Service] Updating appointment:', id, data);
      
      const response = await apiClient.put<Appointment>(`/appointments/${id}`, data);
      
      console.log('[Appointment Service] Appointment updated successfully:', response);
      return response;
    } catch (error: any) {
      console.error('[Appointment Service] Error updating appointment:', error);
      throw new Error(error?.message || 'Failed to update appointment');
    }
  },

  /**
   * Delete appointment
   */
  deleteAppointment: async (id: string): Promise<void> => {
    try {
      console.log('[Appointment Service] Deleting appointment:', id);
      
      await apiClient.delete(`/appointments/${id}`);
      
      console.log('[Appointment Service] Appointment deleted successfully');
    } catch (error: any) {
      console.error('[Appointment Service] Error deleting appointment:', error);
      throw new Error(error?.message || 'Failed to delete appointment');
    }
  },
};
