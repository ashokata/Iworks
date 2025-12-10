'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isOnline, setIsOnline] = useState(true);

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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock report data
  const reportData = {
    financialSummary: {
      revenue: 28750.50,
      expenses: 12340.75,
      profit: 16409.75,
      outstanding: 7890.25
    },
    jobMetrics: {
      total: 135,
      completed: 98,
      inProgress: 24,
      scheduled: 13
    },
    customerMetrics: {
      total: 87,
      new: 12,
      returning: 75,
      satisfaction: 4.8
    },
    technicianMetrics: {
      totalJobs: 135,
      avgTimePerJob: 3.5,
      topPerformer: 'John Doe',
      utilization: 87
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">Reporting Period:</span>
            <select
              className="border border-gray-300 rounded-md px-3 py-1"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex items-center space-x-3">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <Button variant="outline" disabled={!isOnline}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.financialSummary.revenue)}</p>
                  <p className="text-xs text-green-600 mt-1">+15% from previous period</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.financialSummary.expenses)}</p>
                  <p className="text-xs text-red-600 mt-1">+8% from previous period</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Net Profit</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.financialSummary.profit)}</p>
                  <p className="text-xs text-green-600 mt-1">+22% from previous period</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-500">Outstanding Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.financialSummary.outstanding)}</p>
                  <p className="text-xs text-yellow-600 mt-1">-5% from previous period</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Metrics */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
            Job Metrics
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-gray-900">{reportData.jobMetrics.total}</div>
                  <p className="text-sm text-gray-500 mt-1">Total Jobs</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-green-600">{reportData.jobMetrics.completed}</div>
                  <p className="text-sm text-gray-500 mt-1">Completed Jobs</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-yellow-600">{reportData.jobMetrics.inProgress}</div>
                  <p className="text-sm text-gray-500 mt-1">In Progress Jobs</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-600">{reportData.jobMetrics.scheduled}</div>
                  <p className="text-sm text-gray-500 mt-1">Scheduled Jobs</p>
                </div>
              </div>
              <div className="mt-8 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Jobs by Status</h4>
                  <Button variant="ghost" size="sm" disabled={!isOnline}>View Details</Button>
                </div>
                <div className="bg-gray-100 h-4 rounded-full w-full overflow-hidden">
                  <div 
                    className="h-4 bg-green-500" 
                    style={{ width: `${(reportData.jobMetrics.completed / reportData.jobMetrics.total) * 100}%`, float: 'left' }}
                  ></div>
                  <div 
                    className="h-4 bg-yellow-500" 
                    style={{ width: `${(reportData.jobMetrics.inProgress / reportData.jobMetrics.total) * 100}%`, float: 'left' }}
                  ></div>
                  <div 
                    className="h-4 bg-blue-500" 
                    style={{ width: `${(reportData.jobMetrics.scheduled / reportData.jobMetrics.total) * 100}%`, float: 'left' }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{Math.round((reportData.jobMetrics.completed / reportData.jobMetrics.total) * 100)}% Completed</span>
                  <span>{Math.round((reportData.jobMetrics.inProgress / reportData.jobMetrics.total) * 100)}% In Progress</span>
                  <span>{Math.round((reportData.jobMetrics.scheduled / reportData.jobMetrics.total) * 100)}% Scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Metrics and Technician Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-purple-600" />
              Customer Metrics
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-700">{reportData.customerMetrics.total}</div>
                    <p className="text-sm text-gray-600">Total Customers</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{reportData.customerMetrics.new}</div>
                    <p className="text-sm text-gray-600">New Customers</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{reportData.customerMetrics.returning}</div>
                    <p className="text-sm text-gray-600">Returning Customers</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">{reportData.customerMetrics.satisfaction}/5.0</div>
                    <p className="text-sm text-gray-600">Satisfaction Rating</p>
                  </div>
                </div>
                <Button className="w-full mt-6" disabled={!isOnline}>
                  View Customer Report
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-orange-600" />
              Technician Performance
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-700">{reportData.technicianMetrics.totalJobs}</div>
                    <p className="text-sm text-gray-600">Total Jobs Completed</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{reportData.technicianMetrics.avgTimePerJob}h</div>
                    <p className="text-sm text-gray-600">Avg. Time per Job</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Technician Utilization</p>
                  <div className="flex items-center">
                    <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${reportData.technicianMetrics.utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 ml-2">
                      {reportData.technicianMetrics.utilization}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Top performer: {reportData.technicianMetrics.topPerformer}
                  </p>
                </div>
                
                <Button className="w-full mt-6" disabled={!isOnline}>
                  View Technician Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Report List */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <DocumentChartBarIcon className="h-5 w-5 mr-2 text-gray-600" />
            Available Reports
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-6 w-6 text-blue-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Monthly Performance Report</h4>
                        <p className="text-sm text-gray-500">Overview of jobs, revenue and key metrics</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isOnline}>
                      View Report
                    </Button>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-6 w-6 text-green-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Revenue Analysis</h4>
                        <p className="text-sm text-gray-500">Detailed breakdown of income sources</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isOnline}>
                      View Report
                    </Button>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-6 w-6 text-purple-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Customer Satisfaction Survey</h4>
                        <p className="text-sm text-gray-500">Feedback and ratings from customers</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isOnline}>
                      View Report
                    </Button>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-6 w-6 text-yellow-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Technician Productivity Report</h4>
                        <p className="text-sm text-gray-500">Performance metrics for your team</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled={!isOnline}>
                      View Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
