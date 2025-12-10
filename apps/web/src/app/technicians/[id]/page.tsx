'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { technicianService } from '@/services/technicianService';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Job {
  id: string;
  title: string;
  customer: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled';
  scheduledDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  address: string;
}

interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialty: string[];
  activeJobs: number;
  completedJobs: number;
  availability: 'Available' | 'Busy' | 'Off Duty';
  lastActive: string;
  bio: string;
  hireDate: string;
  certifications: string[];
  performanceRating: number;
  supervisor: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentJobs: Job[];
  recentJobs: Job[];
}

// Mock data for technician
const MOCK_TECHNICIANS = {
  '1': {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@infieldworks.com',
    phone: '(555) 123-4567',
    role: 'Senior Technician',
    specialty: ['HVAC', 'Electrical'],
    activeJobs: 3,
    completedJobs: 124,
    availability: 'Busy',
    lastActive: '2025-07-21T08:30:00',
    bio: 'Experienced technician with over 10 years in HVAC systems and electrical work. Certified in commercial refrigeration and high-voltage electrical systems.',
    hireDate: '2020-03-15',
    certifications: ['HVAC Certified', 'Electrical License #EL-12345', 'Safety Training Certificate'],
    performanceRating: 4.8,
    supervisor: 'Michael Wilson',
    emergencyContact: {
      name: 'Sarah Doe',
      phone: '(555) 987-6543',
      relationship: 'Spouse'
    },
    currentJobs: [
      {
        id: 'j1',
        title: 'Commercial AC Repair',
        customer: 'Office Plaza',
        status: 'In Progress',
        scheduledDate: '2025-07-21T10:00:00',
        priority: 'High',
        address: '123 Business Way, Suite 400'
      },
      {
        id: 'j2',
        title: 'Electrical Panel Inspection',
        customer: 'Downtown Apartments',
        status: 'Scheduled',
        scheduledDate: '2025-07-21T14:30:00',
        priority: 'Medium',
        address: '456 Center Street'
      },
      {
        id: 'j3',
        title: 'Emergency Generator Service',
        customer: 'City Hospital',
        status: 'Scheduled',
        scheduledDate: '2025-07-22T09:00:00',
        priority: 'Critical',
        address: '789 Medical Drive'
      }
    ],
    recentJobs: [
      {
        id: 'j4',
        title: 'Thermostat Replacement',
        customer: 'Mountain View Hotel',
        status: 'Completed',
        scheduledDate: '2025-07-19T15:00:00',
        priority: 'Medium',
        address: '321 Scenic Route'
      },
      {
        id: 'j5',
        title: 'Circuit Breaker Installation',
        customer: 'Sunset Residential',
        status: 'Completed',
        scheduledDate: '2025-07-18T11:00:00',
        priority: 'Low',
        address: '654 Homestead Lane'
      },
      {
        id: 'j6',
        title: 'Emergency Power Outage',
        customer: 'Main Street Diner',
        status: 'Completed',
        scheduledDate: '2025-07-17T08:30:00',
        priority: 'Critical',
        address: '987 Food Court'
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@infieldworks.com',
    phone: '(555) 987-6543',
    role: 'Field Technician',
    specialty: ['Plumbing', 'General Repairs'],
    activeJobs: 1,
    completedJobs: 78,
    availability: 'Available',
    lastActive: '2025-07-21T09:45:00',
    bio: 'Skilled plumber with expertise in residential and light commercial plumbing systems. Specializes in leak detection and repair.',
    hireDate: '2021-06-10',
    certifications: ['Plumbing License #PL-54321', 'Water Conservation Certified'],
    performanceRating: 4.5,
    supervisor: 'Michael Wilson',
    emergencyContact: {
      name: 'Tom Smith',
      phone: '(555) 234-5678',
      relationship: 'Brother'
    },
    currentJobs: [
      {
        id: 'j7',
        title: 'Water Heater Replacement',
        customer: 'Highland Apartments',
        status: 'In Progress',
        scheduledDate: '2025-07-21T11:00:00',
        priority: 'High',
        address: '246 Highland Ave, Apt 302'
      }
    ],
    recentJobs: [
      {
        id: 'j8',
        title: 'Leak Repair',
        customer: 'Riverside Home',
        status: 'Completed',
        scheduledDate: '2025-07-20T13:00:00',
        priority: 'Medium',
        address: '753 River Road'
      },
      {
        id: 'j9',
        title: 'Toilet Installation',
        customer: 'New Build Homes',
        status: 'Completed',
        scheduledDate: '2025-07-19T09:30:00',
        priority: 'Low',
        address: '159 Construction Avenue'
      }
    ]
  },
  // Add other technicians here as needed
};

export default function TechnicianDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const technicianId = params?.id as string;
  const [isOnline, setIsOnline] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch technician data
  const { data: technician, isLoading } = useQuery({
    queryKey: ['technician', technicianId],
    queryFn: () => technicianService.getTechnicianById(technicianId),
    retry: 1,
    enabled: !!technicianId && isAuthenticated
  });

  // Delete mutation
  const deleteTechnicianMutation = useMutation({
    mutationFn: (id: string) => technicianService.deleteTechnician(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      router.push('/technicians');
    },
    onError: (error: any) => {
      console.error('Failed to delete technician:', error);
      alert('Failed to delete technician. Please try again.');
    }
  });

  const handleDelete = () => {
    if (technicianId) {
      deleteTechnicianMutation.mutate(technicianId);
    }
  };

  // Handle error state
  if (!technicianId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Technician ID is missing</h2>
          <p className="mt-2 text-gray-600">Please return to the technicians list</p>
          <Button className="mt-4" onClick={() => router.push('/technicians')}>
            Go to Technicians
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not found state
  if (!technician) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Technician not found</h2>
          <p className="mt-2 text-gray-600">The technician you're looking for doesn't exist or has been removed</p>
          <Button className="mt-4" onClick={() => router.push('/technicians')}>
            Go to Technicians
          </Button>
        </div>
      </div>
    );
  }

  // Helper for status color
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'Off Duty':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper for job status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper for priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low':
        return 'bg-green-50 text-green-700';
      case 'Medium':
        return 'bg-blue-50 text-blue-700';
      case 'High':
        return 'bg-yellow-50 text-yellow-700';
      case 'Critical':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Technician</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{technician?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteTechnicianMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteTechnicianMutation.isPending}
              >
                {deleteTechnicianMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => router.push('/technicians')}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Technician Profile</h1>
            </div>
            <div className="flex items-center space-x-3">
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!isOnline}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Technician Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-col items-center text-center border-b pb-6">
              <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserCircleIcon className="h-16 w-16 text-blue-600" />
              </div>
              <CardTitle className="text-xl">{technician.name}</CardTitle>
              <p className="text-gray-600">{technician.role}</p>
              <div className="mt-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(technician.availability || 'Inactive')}`}>
                  {technician.availability || 'Inactive'}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{technician.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{technician.phone}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Hired: {technician.hireDate ? new Date(technician.hireDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {technician.specialty ? (
                      typeof technician.specialty === 'string' 
                        ? (technician.specialty as string).split(',').map((spec, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                              {spec.trim()}
                            </span>
                          ))
                        : Array.isArray(technician.specialty)
                          ? technician.specialty.map((spec, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                                {spec}
                              </span>
                            ))
                          : null
                    ) : <span className="text-sm text-gray-500">No specialties listed</span>}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Certifications</h3>
                  <ul className="space-y-2">
                    {technician.certifications ? (
                      typeof technician.certifications === 'string'
                        ? (technician.certifications as string).split(',').map((cert, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                              <span className="text-sm">{cert.trim()}</span>
                            </li>
                          ))
                        : Array.isArray(technician.certifications)
                          ? technician.certifications.map((cert, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                <span className="text-sm">{cert}</span>
                              </li>
                            ))
                          : null
                    ) : <span className="text-sm text-gray-500">No certifications listed</span>}
                  </ul>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md text-center">
                      <div className="text-sm text-blue-800">Rating</div>
                      <div className="text-xl font-bold text-blue-900">
                        {technician.performanceRating}/5.0
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md text-center">
                      <div className="text-sm text-green-800">Completed</div>
                      <div className="text-xl font-bold text-green-900">
                        {technician.completedJobs}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Emergency Contact</h3>
                  <p className="text-sm">{technician.emergencyContact?.name || 'N/A'}</p>
                  <p className="text-sm">{technician.emergencyContact?.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{technician.emergencyContact?.relationship || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  disabled={!isOnline}
                >
                  Message
                </Button>
                <Button 
                  className="flex-1"
                  disabled={!isOnline}
                  onClick={() => router.push(`/technicians/${technician.id}/edit`)}
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Technician Details & Jobs */}
          <div className="md:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-700">{technician.bio}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Supervisor</h4>
                    <p className="mt-1">{technician.supervisor}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Last Active</h4>
                    <p className="mt-1">{technician.lastActive ? new Date(technician.lastActive).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Jobs */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Current Assignments ({technician.currentJobs?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {technician.currentJobs && technician.currentJobs.length > 0 ? (
                  <div className="divide-y">
                    {technician.currentJobs.map((job) => (
                      <div key={job.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{job.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Customer: {job.customer}</p>
                        <p className="text-sm text-gray-600 mb-3">{job.address}</p>
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${getPriorityColor(job.priority)}`}>
                            {job.priority} Priority
                          </span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {new Date(job.scheduledDate).toLocaleString()}
                            </span>
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/jobs/${job.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">No current assignments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Recent Completed Jobs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {technician.recentJobs && technician.recentJobs.length > 0 ? (
                  <div className="divide-y">
                    {technician.recentJobs.map((job) => (
                      <div key={job.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{job.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Customer: {job.customer}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </span>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">No recent jobs</p>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/technicians/${technician.id}/history`)}
                  >
                    View Full Job History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
