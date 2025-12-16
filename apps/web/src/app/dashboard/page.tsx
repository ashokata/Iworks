'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Job } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { PlusIcon, MicrophoneIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { invoiceService } from '@/services/invoiceService';
import { jobService } from '@/services/jobService';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const { startListening, stopListening, isListening, lastIntent } = useVoiceAssistant();

  // Handle redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

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

  // Fetch invoices summary
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceService.getAllInvoices,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Calculate invoice summary stats - ensure invoices is always an array
  const invoiceList = Array.isArray(invoices) ? invoices : [];
  
  const totalUnpaid = invoiceList
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
    
  const totalPaid = invoiceList
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + (inv.paidAmount || inv.total), 0);
    
  const overdueInvoices = invoiceList.filter(inv => inv.status === 'Overdue').length;
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const { data: jobs, isLoading: jobsLoading, isError, error, refetch } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobService.getAllJobs(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (lastIntent?.action === 'create_job') {
      router.push('/dashboard/jobs/create');
    }
  }, [lastIntent, router]);

  // Show loading spinner while loading or redirecting unauthenticated users
  if (isLoading || jobsLoading || tenantLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Job Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage and track your field service jobs</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/dashboard/jobs/create')}
                disabled={!isOnline}
                className="bg-white text-[#0f118a] hover:bg-gray-100"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Job
              </Button>
              <Button
                onClick={() => router.push('/dashboard/jobs/enhanced-create')}
                disabled={!isOnline}
                className="bg-white text-[#0f118a] hover:bg-gray-100"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Enhanced Job Creation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-4">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs?.length || 2}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">$NaN</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Payments Received</p>
                  <p className="text-2xl font-bold text-gray-900">$NaN</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Enhanced Features Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Enhanced Features (HouseCallPro)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Job Templates & Checklists</h3>
                  <p className="text-sm text-gray-600 mb-4">Create standardized jobs with templates and quality control checklists.</p>
                  <Button
                    onClick={() => router.push('/dashboard/jobs/enhanced-create')}
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                  >
                    Create Enhanced Job
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Service Catalog</h3>
                  <p className="text-sm text-gray-600 mb-4">Comprehensive service catalog with detailed service descriptions and pricing.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                  >
                    View Service Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Material Tracking</h3>
                  <p className="text-sm text-gray-600 mb-4">Track material usage, inventory and costs across jobs.</p>
                  <Button
                    onClick={() => router.push('/dashboard/jobs/job-1')}
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                  >
                    View Sample Job
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Generate professional invoices and track payments for jobs.</p>
                  <Button
                    onClick={() => router.push('/dashboard/invoices')}
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                  >
                    Manage Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Fetch Jobs</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {!isOnline 
                    ? 'You are currently offline. Please check your internet connection.' 
                    : 'Unable to load jobs from the server. Please try again.'}
                </p>
                <Button onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        {job.priority && (
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(job.priority)}`}>
                            {job.priority}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span>Assigned to: {job.assignedTo}</span>
                        <span className="mx-2">•</span>
                        <span>Due: {formatDate(job.date)}</span>
                        {job.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{job.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first job.</p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/dashboard/jobs/create')} disabled={!isOnline}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
