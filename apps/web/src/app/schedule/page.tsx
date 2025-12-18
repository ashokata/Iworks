'use client';

import { useState, useEffect } from 'react';
import { ScheduledJob, Technician, DispatchRecommendation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Mock data - replace with actual API calls
const mockTechnicians: Technician[] = [
  {
    id: 'tech1',
    name: 'John Smith',
    email: 'john@infieldworks.com',
    phone: '555-0101',
    skills: ['plumbing', 'hvac'],
    location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
    availability: [],
    color: '#3b82f6',
  },
  {
    id: 'tech2',
    name: 'Sarah Johnson',
    email: 'sarah@infieldworks.com',
    phone: '555-0102',
    skills: ['electrical', 'general'],
    location: { lat: 40.7589, lng: -73.9851, address: 'New York, NY' },
    availability: [],
    color: '#10b981',
  },
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>(mockTechnicians);
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [draggedJob, setDraggedJob] = useState<ScheduledJob | null>(null);

  // Mock jobs for demonstration
  useEffect(() => {
    const mockJobs: ScheduledJob[] = [
      {
        id: 1,
        tenantId: 'tenant1',
        title: 'AC Repair',
        description: 'Fix air conditioning unit',
        status: 'Scheduled',
        priority: 'High',
        date: new Date().toISOString(),
        location: '123 Main St, New York',
        scheduledStart: new Date(new Date().setHours(9, 0)).toISOString(),
        scheduledEnd: new Date(new Date().setHours(11, 0)).toISOString(),
        technicianId: 'tech1',
        dispatchStatus: 'dispatched',
        isEmergency: false,
      },
    ];
    setJobs(mockJobs);
  }, []);

  const handleDragStart = (job: ScheduledJob) => {
    setDraggedJob(job);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (technicianId: string, timeSlot: Date) => {
    if (!draggedJob) return;

    // Update job assignment
    setJobs(jobs.map(j =>
      j.id === draggedJob.id
        ? {
            ...j,
            technicianId,
            scheduledStart: timeSlot.toISOString(),
            scheduledEnd: new Date(timeSlot.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            dispatchStatus: 'dispatched' as const,
          }
        : j
    ));
    setDraggedJob(null);
  };

  const getJobsForTechnicianAndTime = (techId: string, hour: number) => {
    return jobs.filter(job => {
      if (job.technicianId !== techId) return false;
      const jobStart = new Date(job.scheduledStart);
      return jobStart.getHours() === hour;
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Schedule</h1>
              <p className="text-blue-100 mt-1">Manage technician schedules and job assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/dashboard'}
                className="bg-white text-[#1a2a6c] hover:bg-gray-100"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule & Dispatch</h1>
            <p className="text-gray-600 mt-1">Manage technician schedules and dispatch jobs efficiently</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowDispatchPanel(!showDispatchPanel)}
              className="bg-[#1a2a6c] hover:bg-[#1e40af]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Auto Dispatch
            </Button>
            <Button variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Job
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'day' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Month
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <span className="text-lg font-semibold">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
          <Button variant="outline" size="sm">
            Today
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scheduler Grid */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-4">
              <h2 className="text-xl font-semibold">Technician Schedule</h2>
              <p className="text-sm text-blue-100 mt-1">Drag and drop jobs to assign technicians</p>
            </div>

            {/* Schedule Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Time Header */}
                <div className="grid grid-cols-[120px_repeat(auto-fill,minmax(150px,1fr))] border-b">
                  <div className="p-3 bg-gray-50 font-semibold border-r">Technician</div>
                  {hours.map(hour => (
                    <div key={hour} className="p-3 bg-gray-50 text-center text-sm font-medium border-r">
                      {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                    </div>
                  ))}
                </div>

                {/* Technician Rows */}
                {technicians.map(tech => (
                  <div key={tech.id} className="grid grid-cols-[120px_repeat(auto-fill,minmax(150px,1fr))] border-b hover:bg-gray-50">
                    {/* Technician Name */}
                    <div className="p-3 border-r flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tech.color }}
                      />
                      <div>
                        <div className="font-medium text-sm">{tech.name}</div>
                        <div className="text-xs text-gray-500">{tech.skills.join(', ')}</div>
                      </div>
                    </div>

                    {/* Time Slots */}
                    {hours.map(hour => {
                      const jobsInSlot = getJobsForTechnicianAndTime(tech.id, hour);
                      return (
                        <div
                          key={hour}
                          className="p-2 border-r min-h-[80px] relative"
                          onDragOver={handleDragOver}
                          onDrop={() => {
                            const timeSlot = new Date(selectedDate);
                            timeSlot.setHours(hour, 0, 0, 0);
                            handleDrop(tech.id, timeSlot);
                          }}
                        >
                          {jobsInSlot.map(job => (
                            <div
                              key={job.id}
                              draggable
                              onDragStart={() => handleDragStart(job)}
                              onClick={() => setSelectedJob(job)}
                              className={`p-2 rounded-lg text-xs cursor-move mb-1 ${
                                job.isEmergency
                                  ? 'bg-red-100 border border-red-300 text-red-800'
                                  : 'bg-blue-100 border border-blue-300 text-blue-800'
                              }`}
                              style={{ borderLeftColor: tech.color, borderLeftWidth: '3px' }}
                            >
                              <div className="font-medium truncate">{job.title}</div>
                              <div className="text-xs opacity-75 truncate">{job.location}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2" />
              <span>Regular Job</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2" />
              <span>Emergency Job</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Unassigned Jobs */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Unassigned Jobs
            </h3>
            <div className="space-y-2">
              {jobs.filter(j => !j.technicianId).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">All jobs assigned!</p>
              ) : (
                jobs.filter(j => !j.technicianId).map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => handleDragStart(job)}
                    className={`p-3 rounded-lg border cursor-move ${
                      job.isEmergency
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{job.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{job.location}</div>
                    {job.isEmergency && (
                      <div className="text-xs text-red-600 font-semibold mt-1">⚠️ EMERGENCY</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Jobs</span>
                <span className="font-semibold">{jobs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assigned</span>
                <span className="font-semibold text-green-600">
                  {jobs.filter(j => j.technicianId).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Unassigned</span>
                <span className="font-semibold text-orange-600">
                  {jobs.filter(j => !j.technicianId).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Emergency</span>
                <span className="font-semibold text-red-600">
                  {jobs.filter(j => j.isEmergency).length}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                View Map
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Set Recurring
              </Button>
              <Button className="w-full justify-start" variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Mark Emergency
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Job Details Modal - would be implemented with proper modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">{selectedJob.title}</h3>
              <button onClick={() => setSelectedJob(null)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <p><strong>Location:</strong> {selectedJob.location}</p>
              <p><strong>Description:</strong> {selectedJob.description}</p>
              <p><strong>Status:</strong> {selectedJob.dispatchStatus}</p>
              {selectedJob.technician && (
                <p><strong>Assigned To:</strong> {selectedJob.technician.name}</p>
              )}
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
