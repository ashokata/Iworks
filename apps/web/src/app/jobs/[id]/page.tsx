'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobService } from '@/services/jobService';
import { Job } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  MapPinIcon, 
  PlusIcon, 
  DocumentTextIcon,
  PaperClipIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function JobDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  console.log('[Job Details] ========== INIT ==========');
  console.log('[Job Details] params:', params);
  console.log('[Job Details] jobId:', jobId);
  console.log('[Job Details] isAuthenticated:', isAuthenticated);
  console.log('[Job Details] authLoading:', authLoading);
  console.log('[Job Details] ===================================');

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

  // Fetch job details - uses cache from jobs list if available
  // Prefer cache, fallback to API if not found
  // Using any type due to legacy/new type differences that need migration
  const { data: job, isLoading, isError, error, refetch, isFetching } = useQuery<any>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const cachedJobs = queryClient.getQueryData<any[]>(['jobs']);
      if (cachedJobs) {
        const cachedJob = cachedJobs.find(j => j.id === jobId);
        if (cachedJob) {
          cachedJob._source = 'cache';
          return cachedJob;
        }
      }
      // Fallback to API
      const fetchedJob = await jobService.getJobById(jobId);
      if (!fetchedJob) {
        throw new Error('Job not found');
      }
      (fetchedJob as any)._source = 'api';
      return fetchedJob;
    },
    enabled: !!jobId && isAuthenticated,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  console.log('[Job Details] ========== STATE ==========');
  console.log('[Job Details] Current job state:', job);
  console.log('[Job Details] isLoading:', isLoading);
  console.log('[Job Details] isError:', isError);
  console.log('[Job Details] error:', error);
  console.log('[Job Details] ============================');

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state - only show error if there was an actual error, not just missing data
  if (isError) {
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
                : 'Unable to load job details from the server. Please try again.'}
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => refetch()} className="w-full">
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

  // If no job data after loading, show not found
  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Job Not Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              The job you're looking for doesn't exist or has been deleted.
            </p>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" onClick={() => router.push('/jobs')} className="w-full">
                Go to Jobs List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Format date for input field
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Not set';
    }
  };

  // Use pricing data directly from Job properties
  const subtotal = job.subtotal ?? 0;
  const discount = job.discountAmount ?? 0;
  const taxAmount = job.taxAmount ?? 0;
  const total = job.total ?? 0;

  // Debug logging - show what data is available
  console.log('[Job Details] ========== PRICING DEBUG ==========');
  console.log('[Job Details] Line items from API:', job.lineItems);
  console.log('[Job Details] Display values:', { subtotal, discount, taxAmount, total });
  
  if (!job.lineItems || job.lineItems.length === 0) {
    console.warn('[Job Details] ⚠️ NO LINE ITEMS FOUND');
  } else {
    console.log('[Job Details] ✓ Line items count:', job.lineItems.length);
  }
  console.log('[Job Details] =====================================');

  return (
    <div className="min-h-screen bg-gray-50">
      {job && (
        <div className="fixed top-2 right-2 z-50">
          <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
            Data source: {((job as any)._source === 'cache') ? 'Cache' : 'API'}
          </span>
        </div>
      )}
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/jobs')}
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              View Job
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <span className={`px-3 py-1 text-sm rounded-full ${
              job.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
              job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
              job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status.replace('_', ' ')}
            </span>
            <Button 
              onClick={() => router.push(`/jobs/${jobId}/edit`)}
              disabled={!isOnline}
            >
              Edit Job
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Map/Location */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3 relative">
              <MapPinIcon className="h-12 w-12 text-gray-400" />
            </div>
            {job.address && (
              <div className="text-sm text-gray-700 px-3 py-2">
                <MapPinIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                {job.address.fullAddress || `${job.address.city}, ${job.address.state}`}
              </div>
            )}
          </div>

          {/* Private Notes */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Private notes</span>
              </div>
            </div>
            {job.description && (
              <div className="px-4 pb-4">
                <div className="bg-gray-50 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700">
                  {job.description}
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <PaperClipIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Attachments</span>
              </div>
            </div>
            <div className="px-4 pb-4 text-sm text-gray-500">
              No attachments
            </div>
          </div>

          {/* Recurrence */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <ArrowPathIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Recurrence</span>
              </div>
            </div>
            <div className="px-4 pb-4 text-sm text-gray-500">
              Not recurring
            </div>
          </div>

          {/* Auto Invoice */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Auto invoice</span>
              </div>
            </div>
            <div className="px-0 pt-2 text-sm text-gray-500">
              {job.status === 'COMPLETED' ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {/* Job Title & Basic Info */}
            <div className="mb-6">
              <div className="text-2xl font-semibold w-full px-0 py-2 text-gray-900">
                {job.title}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Location</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {job.address?.fullAddress || job.address?.city || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Scheduled Date</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {formatDateForDisplay(job.scheduledStart)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Assigned To</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {job.assignments?.[0]?.employee?.firstName ? `${job.assignments[0].employee.firstName} ${job.assignments[0].employee.lastName || ''}`.trim() : 'Not assigned'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {job.status.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {job.priority || 'Medium'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Estimated Duration</label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
                    {job.estimatedDuration ? `${job.estimatedDuration} minutes` : 'Not set'}
                  </div>
                </div>
              </div>
            </div>

            {/* Estimates Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Estimates</h3>
              </div>
              <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-600">
                No estimates created yet
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Line items</h3>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>


              {/* Services */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Services</h4>
                </div>
                <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-700">
                  {job?.lineItems?.filter((item: any) => item.type === 'SERVICE' || item.itemType === 'Service').length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase">
                            <th className="text-left px-3 py-1">Name</th>
                            <th className="text-center px-3 py-1">Qty</th>
                            <th className="text-center px-3 py-1">Unit Price</th>
                            <th className="text-right px-3 py-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(job as any).lineItems?.filter((item: any) => item.itemType === 'Service').map((item: any) => (
                            <tr key={item.id} className="bg-gray-50 hover:bg-gray-100 rounded-lg shadow-sm">
                              <td className="px-3 py-2 font-medium text-gray-900 rounded-l-lg">{item.name}</td>
                              <td className="px-3 py-2 text-center">{item.quantity}</td>
                              <td className="px-3 py-2 text-center">${item.unitPrice.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-800 rounded-r-lg">${item.totalPrice.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-gray-500">No services added</span>
                  )}
                </div>
              </div>

              {/* Materials */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Materials</h4>
                </div>
                <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-700">
                  {(job as any).lineItems?.filter((item: any) => item.itemType === 'Product').length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase">
                            <th className="text-left px-3 py-1">Name</th>
                            <th className="text-center px-3 py-1">Qty</th>
                            <th className="text-center px-3 py-1">Unit Price</th>
                            <th className="text-right px-3 py-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(job as any).lineItems?.filter((item: any) => item.itemType === 'Product').map((item: any) => (
                            <tr key={item.id} className="bg-gray-50 hover:bg-gray-100 rounded-lg shadow-sm">
                              <td className="px-3 py-2 font-medium text-gray-900 rounded-l-lg">{item.name}</td>
                              <td className="px-3 py-2 text-center">{item.quantity}</td>
                              <td className="px-3 py-2 text-center">${item.unitPrice.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-800 rounded-r-lg">${item.totalPrice.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-gray-500">No materials added</span>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Tax</span>
                  </div>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
