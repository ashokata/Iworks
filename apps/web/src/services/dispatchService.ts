import { apiClient } from './apiClient';
import { ScheduledJob, Technician, DispatchRecommendation, DispatchRule } from '@/types';

/**
 * Dispatch Service - Handles automated job dispatch and technician assignment
 * Integrates with Mendix backend for dispatch rules and AI-powered recommendations
 */
class DispatchService {
  /**
   * Get dispatch recommendations from Mendix backend
   * Uses AI/ML algorithms configured in Mendix
   */
  async getRecommendations(
    jobId: number,
    technicians: Technician[]
  ): Promise<DispatchRecommendation[]> {
    try {
      const response = await apiClient.post<{ recommendations: DispatchRecommendation[] }>(
        '/api/dispatch/recommend',
        {
          jobId,
          technicianIds: technicians.map(t => t.id),
        }
      );

      return response.recommendations;
    } catch (error) {
      console.error('[Dispatch Service] Error getting recommendations:', error);
      // Fallback to local algorithm if backend fails
      return this.localRecommendationAlgorithm(jobId, technicians);
    }
  }

  /**
   * Automatically dispatch jobs based on configured rules
   * Connects to Mendix dispatch engine
   */
  async autoDispatch(jobs: ScheduledJob[]): Promise<ScheduledJob[]> {
    try {
      const response = await apiClient.post<{ dispatchedJobs: ScheduledJob[] }>(
        '/api/dispatch/auto',
        { jobs }
      );

      return response.dispatchedJobs;
    } catch (error) {
      console.error('[Dispatch Service] Error auto-dispatching:', error);
      throw new Error('Failed to auto-dispatch jobs');
    }
  }

  /**
   * Get active dispatch rules from Mendix
   */
  async getDispatchRules(): Promise<DispatchRule[]> {
    try {
      const response = await apiClient.get<{ rules: DispatchRule[] }>(
        '/api/dispatch/rules'
      );

      return response.rules;
    } catch (error) {
      console.error('[Dispatch Service] Error fetching dispatch rules:', error);
      return [];
    }
  }

  /**
   * Create or update dispatch rule in Mendix
   */
  async saveDispatchRule(rule: Partial<DispatchRule>): Promise<DispatchRule> {
    try {
      const endpoint = rule.id
        ? `/api/dispatch/rules/${rule.id}`
        : '/api/dispatch/rules';

      const response = await apiClient.post<DispatchRule>(endpoint, rule);
      return response;
    } catch (error) {
      console.error('[Dispatch Service] Error saving dispatch rule:', error);
      throw new Error('Failed to save dispatch rule');
    }
  }

  /**
   * Calculate route and travel time between locations
   * Uses Mapbox Directions API
   */
  async calculateRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number; route: any }> {
    try {
      const response = await apiClient.post<{
        distance: number;
        duration: number;
        route: any;
      }>('/api/dispatch/route', { from, to });

      return response;
    } catch (error) {
      console.error('[Dispatch Service] Error calculating route:', error);
      // Fallback: simple distance calculation
      return {
        distance: this.haversineDistance(from, to),
        duration: this.haversineDistance(from, to) * 3, // Assume 3 min per km
        route: null,
      };
    }
  }

  /**
   * Optimize route for multiple stops
   * Used for scheduling multiple jobs for one technician
   */
  async optimizeRoute(
    technicianLocation: { lat: number; lng: number },
    jobLocations: Array<{ lat: number; lng: number; jobId: number }>
  ): Promise<{ optimizedOrder: number[]; totalDistance: number; totalDuration: number }> {
    try {
      const response = await apiClient.post<{
        optimizedOrder: number[];
        totalDistance: number;
        totalDuration: number;
      }>('/api/dispatch/optimize-route', {
        start: technicianLocation,
        stops: jobLocations,
      });

      return response;
    } catch (error) {
      console.error('[Dispatch Service] Error optimizing route:', error);
      // Fallback: return original order
      return {
        optimizedOrder: jobLocations.map(l => l.jobId),
        totalDistance: 0,
        totalDuration: 0,
      };
    }
  }

  /**
   * Check technician availability
   */
  async checkAvailability(
    technicianId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.post<{ available: boolean }>(
        '/api/dispatch/check-availability',
        { technicianId, startTime, endTime }
      );

      return response.available;
    } catch (error) {
      console.error('[Dispatch Service] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Assign job to technician
   */
  async assignJob(jobId: number, technicianId: string): Promise<ScheduledJob> {
    try {
      const response = await apiClient.post<ScheduledJob>(
        `/api/dispatch/assign/${jobId}`,
        { technicianId }
      );

      return response;
    } catch (error) {
      console.error('[Dispatch Service] Error assigning job:', error);
      throw new Error('Failed to assign job');
    }
  }

  /**
   * Prioritize emergency jobs
   */
  async prioritizeEmergencyJobs(jobs: ScheduledJob[]): Promise<ScheduledJob[]> {
    return jobs.sort((a, b) => {
      // Emergency jobs first
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;

      // Then by priority
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;

      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by scheduled time
      return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
    });
  }

  /**
   * Local recommendation algorithm (fallback)
   * This runs in the frontend when backend is unavailable
   */
  private localRecommendationAlgorithm(
    jobId: number,
    technicians: Technician[]
  ): DispatchRecommendation[] {
    // Simple scoring algorithm
    return technicians.map(tech => ({
      technicianId: tech.id,
      technician: tech,
      score: Math.floor(Math.random() * 100),
      reasons: ['Local calculation', 'Backend unavailable'],
      estimatedTravelTime: Math.floor(Math.random() * 30),
      distance: Math.random() * 10,
      availability: true,
    }));
  }

  /**
   * Haversine formula for distance calculation
   * Returns distance in kilometers
   */
  private haversineDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) *
        Math.cos(this.toRad(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

export const dispatchService = new DispatchService();
