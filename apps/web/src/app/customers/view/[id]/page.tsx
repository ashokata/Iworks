'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { customerService, Customer } from '@/services/customerService';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  TagIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PetCustomerViewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [activeTab, setActiveTab] = useState<'jobs' | 'invoices' | 'notes'>('jobs');
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

  // Fetch customer data
  const { data: customer, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pet-customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
    enabled: !!customerId, // Temporarily force the query for debugging
  });

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
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
                : 'Unable to load customer details from the server. Please try again.'}
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => refetch()} className="w-full">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/customers')} className="w-full">
                Back to Customers
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Customer not found
  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Customer not found</h2>
          <p className="mt-2 text-gray-600">The customer you're looking for doesn't exist or has been removed</p>
          <Button className="mt-4" onClick={() => router.push('/customers')}>
            Go to Customers
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to get primary address
  const getPrimaryAddress = () => {
    // Handle both wrapped and unwrapped address structures
    const addresses = customer.addresses?.data || customer.addresses || [];
    if (!Array.isArray(addresses) || addresses.length === 0) return null;
    const primaryAddress = addresses.find((addr: any) => addr.isPrimary);
    return primaryAddress || addresses[0];
  };

  // Helper for status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Scheduled':
      case 'Pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-full hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </span>
              )}
              <Link
                href={`/customers/edit/${customer.id}`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit Customer
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Customer Information Card - Left Side */}
          <div className="lg:w-1/3">
            <Card className="mb-6">
              <CardHeader className="pb-0">
                <div className="flex justify-between">
                  <CardTitle className="text-xl">Customer Information</CardTitle>
                  {customer.archived && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center mb-6">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    {customer.type === 'business' ? 
                      <BuildingOfficeIcon className="h-10 w-10 text-blue-600" /> :
                      <HomeIcon className="h-10 w-10 text-blue-600" />
                    }
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {customer.display_name}
                    </h2>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        customer.type === 'business' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.type ? (customer.type.charAt(0).toUpperCase() + customer.type.slice(1)) : 'Homeowner'}
                      </span>
                      {customer.is_contractor && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          Contractor
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  {customer.email && (
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.email}</span>
                    </div>
                  )}
                  
                  {customer.mobile_number && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.mobile_number} (Mobile)</span>
                    </div>
                  )}
                  
                  {customer.home_number && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.home_number} (Home)</span>
                    </div>
                  )}
                  
                  {customer.work_number && (
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.work_number} (Work)</span>
                    </div>
                  )}

                  {customer.company && (
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.company}</span>
                    </div>
                  )}
                  
                  {customer.job_title && (
                    <div className="flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-600">{customer.job_title}</span>
                    </div>
                  )}

                  {getPrimaryAddress() && (
                    <div className="flex">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-gray-600">{getPrimaryAddress()?.street}</p>
                        <p className="text-gray-600">
                          {getPrimaryAddress()?.city}, {getPrimaryAddress()?.state} {getPrimaryAddress()?.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(customer.tags?.data || customer.tags || []).length > 0 ? (
                      (customer.tags?.data || customer.tags || []).map((tag: string) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags</span>
                    )}
                  </div>
                </div>

                {customer.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 text-sm">{customer.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Card on File</h3>
                    <span 
                      className={`inline-block py-1 px-2 text-xs rounded-full ${
                        customer.has_improved_card_on_file ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.has_improved_card_on_file ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <span 
                      className={`inline-block py-1 px-2 text-xs rounded-full ${
                        customer.notifications_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.notifications_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Customer since:</span>
                      <span>{formatDate(customer.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last updated:</span>
                      <span>{formatDate(customer.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs and Invoices - Right Side */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'jobs'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('jobs')}
              >
                Jobs
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'invoices'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('invoices')}
              >
                Invoices
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('notes')}
              >
                Activity
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'jobs' ? (
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Jobs</CardTitle>
                    <Button size="sm">
                      Schedule New Job
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <ClockIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data</h3>
                    <p className="text-gray-500 mb-4">No jobs found for this customer</p>
                    <Button size="sm" onClick={() => router.push(`/jobs/create?customerId=${customer.id}`)}>
                      Schedule First Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : activeTab === 'invoices' ? (
              <Card>
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">Invoices</CardTitle>
                    <Button size="sm">
                      Create New Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <EnvelopeIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data</h3>
                    <p className="text-gray-500 mb-4">No invoices found for this customer</p>
                    <Button size="sm" onClick={() => router.push(`/invoices/create?customerId=${customer.id}`)}>
                      Create First Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl">Activity History</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <ClockIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity History</h3>
                    <p className="text-gray-500 mb-4">Activity timeline will appear here once jobs or invoices are created</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
