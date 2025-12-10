'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';
import { Job } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();
  const jobId = id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

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

  // Form state
  const [title, setTitle] = useState<string>('');
  const [status, setStatus] = useState<'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'>('Scheduled');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Low');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(1);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<Job>(`/api/jobs/${jobId}`);
        setJob(data);
        
        // Initialize form with job data
        setTitle(data.title);
        const mappedStatus = data.status === 'In_Progress' ? 'In Progress' : data.status === 'Canceled' ? 'Cancelled' : data.status;
        setStatus(mappedStatus as 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled');
        setAssignedTo(data.assignedTo || '');
        setDate(data.date || '');
        setDescription(data.description || '');
        setLocation(data.location || '');
        setPriority(data.priority || 'Low');
        setEstimatedDuration(data.estimatedDuration || 1);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;
    
    try {
      setSaving(true);
      
      const updatedJob: Job = {
        ...job,
        title,
        status: status === 'In Progress' ? 'In_Progress' : status === 'Cancelled' ? 'Canceled' : status,
        assignedTo,
        date,
        description,
        location,
        priority,
        estimatedDuration,
      };
      
      await apiClient.put<Job>(`/api/jobs/${jobId}`, updatedJob);
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      console.error('Error updating job:', err);
      setError('Failed to update job');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Fetch</h3>
            <p className="text-sm text-gray-500 mb-4">
              {!isOnline 
                ? 'You are currently offline. Please check your internet connection.' 
                : error || 'Unable to load job details from the server. Please try again.'}
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/jobs')} className="w-full">
                Go to Jobs List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Edit Job</CardTitle>
            <Button
              variant="outline"
              onClick={() => router.push(`/jobs/${jobId}`)}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="title">
                  Job Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="assignedTo">
                  Assigned To
                </label>
                <input
                  id="assignedTo"
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="estimatedDuration">
                  Estimated Duration (hours)
                </label>
                <input
                  id="estimatedDuration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-h-[100px]"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                disabled={saving || !isOnline}
                className={`px-6 py-2 ${saving || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
