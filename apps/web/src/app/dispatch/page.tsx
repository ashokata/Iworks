'use client';

import { useState, useEffect } from 'react';
import { ScheduledJob, Technician, DispatchRecommendation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import MapView from '@/components/Map/MapView';

// Mock data
const mockTechnicians: Technician[] = [
  {
    id: 'tech1',
    name: 'John Smith',
    email: 'john@infieldworks.com',
    phone: '555-0101',
    skills: ['plumbing', 'hvac', 'electrical'],
    location: { lat: 40.7128, lng: -74.0060, address: 'Manhattan, NY' },
    availability: [],
    color: '#3b82f6',
  },
  {
    id: 'tech2',
    name: 'Sarah Johnson',
    email: 'sarah@infieldworks.com',
    phone: '555-0102',
    skills: ['electrical', 'general'],
    location: { lat: 40.7589, lng: -73.9851, address: 'Times Square, NY' },
    availability: [],
    color: '#10b981',
  },
  {
    id: 'tech3',
    name: 'Mike Wilson',
    email: 'mike@infieldworks.com',
    phone: '555-0103',
    skills: ['plumbing', 'hvac'],
    location: { lat: 40.7484, lng: -73.9857, address: 'Empire State, NY' },
    availability: [],
    color: '#f59e0b',
  },
];

export default function DispatchPage() {
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [recommendations, setRecommendations] = useState<DispatchRecommendation[]>([]);
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);

  // Mock jobs
  useEffect(() => {
    const mockJobs: ScheduledJob[] = [
      {
        id: 1,
        tenantId: 'tenant1',
        title: 'AC Repair - Urgent',
        description: 'Air conditioning not working, customer reports high temperature',
        status: 'Scheduled',
        priority: 'Critical',
        date: new Date().toISOString(),
        location: '456 Broadway, New York, NY',
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        dispatchStatus: 'pending',
        isEmergency: true,
      },
      {
        id: 2,
        tenantId: 'tenant1',
        title: 'Plumbing Inspection',
        description: 'Regular maintenance check',
        status: 'Scheduled',
        priority: 'Low',
        date: new Date().toISOString(),
        location: '789 5th Avenue, New York, NY',
        scheduledStart: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        scheduledEnd: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        dispatchStatus: 'pending',
        isEmergency: false,
      },
    ];
    setJobs(mockJobs);
  }, []);

  // Auto-dispatch algorithm (simplified - would connect to Mendix backend)
  const calculateRecommendations = (job: ScheduledJob): DispatchRecommendation[] => {
    return technicians
      .map(tech => {
        let score = 100;
        const reasons: string[] = [];

        // Skill matching
        const requiredSkills = job.description?.toLowerCase() || '';
        const hasMatchingSkill = tech.skills.some(skill =>
          requiredSkills.includes(skill.toLowerCase())
        );
        if (hasMatchingSkill) {
          score += 30;
          reasons.push('Has required skills');
        } else {
          score -= 20;
          reasons.push('Missing some skills');
        }

        // Distance calculation (mock - would use actual geocoding)
        const distance = Math.random() * 10; // km
        if (distance < 3) {
          score += 20;
          reasons.push('Very close to job site');
        } else if (distance < 5) {
          score += 10;
          reasons.push('Close to job site');
        } else {
          score -= 5;
          reasons.push('Further from job site');
        }

        // Availability (mock - would check actual calendar)
        const availability = Math.random() > 0.3;
        if (availability) {
          score += 15;
          reasons.push('Available now');
        } else {
          score -= 30;
          reasons.push('Limited availability');
        }

        // Current workload (mock)
        const currentJobs = jobs.filter(j => j.technicianId === tech.id).length;
        if (currentJobs < 2) {
          score += 10;
          reasons.push('Light workload');
        } else if (currentJobs < 4) {
          reasons.push('Moderate workload');
        } else {
          score -= 15;
          reasons.push('Heavy workload');
        }

        // Emergency priority
        if (job.isEmergency && hasMatchingSkill) {
          score += 25;
          reasons.push('Qualified for emergency');
        }

        return {
          technicianId: tech.id,
          technician: tech,
          score: Math.max(0, Math.min(100, score)),
          reasons,
          estimatedTravelTime: Math.floor(distance * 3), // minutes
          distance,
          availability,
        };
      })
      .sort((a, b) => b.score - a.score);
  };

  const handleSelectJob = (job: ScheduledJob) => {
    setSelectedJob(job);
    setRecommendations(calculateRecommendations(job));
  };

  const handleAutoDispatch = async () => {
    setIsAutoDispatching(true);

    // Simulate API call to Mendix backend
    await new Promise(resolve => setTimeout(resolve, 1500));

    const unassignedJobs = jobs.filter(j => !j.technicianId);

    unassignedJobs.forEach(job => {
      const recs = calculateRecommendations(job);
      if (recs.length > 0) {
        const best = recs[0];
        job.technicianId = best.technicianId;
        job.dispatchStatus = 'dispatched';
      }
    });

    setJobs([...jobs]);
    setIsAutoDispatching(false);
  };

  const handleManualAssign = (jobId: number, technicianId: string) => {
    setJobs(jobs.map(j =>
      j.id === jobId
        ? { ...j, technicianId, dispatchStatus: 'dispatched' as const }
        : j
    ));
    setSelectedJob(null);
  };

  const pendingJobs = jobs.filter(j => j.dispatchStatus === 'pending');
  const dispatchedJobs = jobs.filter(j => j.dispatchStatus === 'dispatched');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Smart Dispatch</h1>
              <p className="text-blue-100 mt-1">AI-powered job assignment and route optimization</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleAutoDispatch}
                disabled={isAutoDispatching || pendingJobs.length === 0}
                className="bg-white text-[#1a2a6c] hover:bg-gray-100"
              >
                {isAutoDispatching ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Dispatching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Auto Dispatch All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="p-0 overflow-hidden h-[600px]">
              <MapView
                technicians={technicians}
                jobs={jobs}
                onJobClick={handleSelectJob}
                showRoutes={true}
              />
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{technicians.length}</div>
                <div className="text-sm text-gray-600 mt-1">Active Technicians</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{pendingJobs.length}</div>
                <div className="text-sm text-gray-600 mt-1">Pending Jobs</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{dispatchedJobs.length}</div>
                <div className="text-sm text-gray-600 mt-1">Dispatched</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {jobs.filter(j => j.isEmergency).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Emergency</div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pending Jobs */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending Jobs
                </h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                  {pendingJobs.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {pendingJobs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">All jobs dispatched!</p>
                ) : (
                  pendingJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedJob?.id === job.id
                          ? 'border-blue-500 bg-blue-50'
                          : job.isEmergency
                          ? 'border-red-200 bg-red-50 hover:border-red-300'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center">
                            {job.title}
                            {job.isEmergency && (
                              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{job.location}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {job.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recommendations */}
            {selectedJob && recommendations.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recommended Technicians
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.technicianId}
                      className="p-3 rounded-lg border bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: rec.technician.color }}
                          />
                          <span className="font-medium text-sm">{rec.technician.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-semibold">
                              BEST MATCH
                            </span>
                          )}
                          <div className="text-sm font-semibold text-blue-600">
                            {rec.score}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        {rec.reasons.map((reason, i) => (
                          <div key={i} className="text-xs text-gray-600 flex items-center">
                            <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {reason}
                          </div>
                        ))}
                        <div className="text-xs text-gray-500 mt-2">
                          📍 {rec.distance.toFixed(1)} km • ⏱️ {rec.estimatedTravelTime} min travel
                        </div>
                      </div>

                      <Button
                        onClick={() => handleManualAssign(selectedJob.id as number, rec.technicianId)}
                        size="sm"
                        className={`w-full ${
                          index === 0 ? 'bg-green-600 hover:bg-green-700' : ''
                        }`}
                      >
                        Assign to {rec.technician.name.split(' ')[0]}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
