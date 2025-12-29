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
import {
  PlusIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { invoiceService } from '@/services/invoiceService';
import { jobService } from '@/services/jobService';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

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

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceService.getAllInvoices(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const totalUnpaid = invoiceList
    .filter(inv => ['DRAFT', 'SENT', 'VIEWED', 'OVERDUE'].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = invoiceList
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (inv.amountPaid || inv.total), 0);

  const overdueInvoices = invoiceList.filter(inv => inv.status === 'OVERDUE').length;

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

  if (isLoading || jobsLoading || tenantLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completedJobs = jobs?.filter(j => j.status === 'COMPLETED').length || 0;
  const inProgressJobs = jobs?.filter(j => j.status === 'IN_PROGRESS').length || 0;
  const scheduledJobs = jobs?.filter(j => j.status === 'SCHEDULED').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.name || 'User'}!</h1>
              <p className="text-sm text-blue-100">Here's your business overview and recent activity</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {/* Quick Actions Bar */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/dashboard/jobs/create')}
              disabled={!isOnline}
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50"
              style={{
                backgroundColor: '#06118d',
                color: 'white'
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Job
            </button>
            <button
              onClick={() => router.push('/dashboard/jobs/enhanced-create')}
              disabled={!isOnline}
              className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium transition-all"
              style={{
                borderColor: '#06118d',
                color: '#06118d',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#06118d';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#06118d';
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Enhanced Job Creation
            </button>
            <button
              onClick={() => router.push('/customers/new')}
              disabled={!isOnline}
              className="inline-flex items-center px-4 py-2 rounded-md border text-sm font-medium transition-all"
              style={{
                borderColor: '#06118d',
                color: '#06118d',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#06118d';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#06118d';
              }}
            >
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Jobs */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{jobs?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Jobs */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{completedJobs}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{inProgressJobs}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{scheduledJobs}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue (Paid) */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue (Paid)</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unpaid Invoices */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unpaid</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{formatCurrency(totalUnpaid)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Invoices */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{overdueInvoices}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Invoices */}
          <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{invoiceList.length}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Tiles */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
              onClick={() => router.push('/customers')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Customers</h3>
                    <p className="text-xs text-gray-500">Manage customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
              onClick={() => router.push('/schedule')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CalendarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Schedule</h3>
                    <p className="text-xs text-gray-500">View calendar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
              onClick={() => router.push('/reports')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Reports</h3>
                    <p className="text-xs text-gray-500">View analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500"
              onClick={() => router.push('/configurations')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <Cog6ToothIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
                    <p className="text-xs text-gray-500">Configure system</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/jobs')}
              >
                View All
              </Button>
            </div>
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
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                        <span>Assigned: {job.assignments?.[0]?.employee?.firstName || 'Unassigned'}</span>
                        <span className="mx-2">•</span>
                        <span>Due: {job.scheduledStart ? formatDate(job.scheduledStart) : 'Not scheduled'}</span>
                        {job.address && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{job.address.city || 'Location TBD'}</span>
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
