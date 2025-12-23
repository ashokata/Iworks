'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';
import {
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserCircleIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ServiceRequestViewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const serviceRequestId = params.id;
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

  // Fetch service request data
  const { data: serviceRequest, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['service-request', serviceRequestId],
    queryFn: () => serviceRequestService.getById(serviceRequestId),
    enabled: !!serviceRequestId,
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
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Fetch</h3>
            <p className="text-sm text-gray-500 mb-4">
              {!isOnline 
                ? 'You are currently offline. Please check your internet connection.' 
                : 'Unable to load service request details from the server. Please try again.'}
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => refetch()} className="w-full">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/service-requests')} className="w-full">
                Back to Service Requests
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Service request not found
  if (!serviceRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Service Request not found</h2>
          <p className="mt-2 text-gray-600">The service request you're looking for doesn't exist or has been removed</p>
          <Button className="mt-4" onClick={() => router.push('/service-requests')}>
            Go to Service Requests
          </Button>
        </div>
      </div>
    );
  }

  // Helper for urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper for status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
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

  const formatProblemType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/service-requests')}
              className="bg-white text-[#1a2a6c] hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Service Request Details</h1>
              <p className="text-sm text-blue-100">
                {serviceRequest.requestNumber || 'No Request Number'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/service-requests/edit/${serviceRequestId}`)}
              className="bg-white text-[#1a2a6c] hover:bg-gray-100"
              disabled={!isOnline}
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-lg font-semibold text-gray-900">{serviceRequest.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{serviceRequest.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Problem Type</label>
                    <p className="text-gray-900">{formatProblemType(serviceRequest.problemType)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Urgency</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor(serviceRequest.urgency)}`}>
                        {serviceRequest.urgency}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(serviceRequest.status)}`}>
                        {serviceRequest.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Source</label>
                    <div className="mt-1">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {serviceRequest.createdSource === 'VOICE_AGENT' ? '📞 Voice Call' : serviceRequest.createdSource}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {serviceRequest.customer.firstName} {serviceRequest.customer.lastName}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Number</label>
                    <p className="text-gray-900">{serviceRequest.customer.customerNumber}</p>
                  </div>

                  {serviceRequest.customer.mobilePhone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {serviceRequest.customer.mobilePhone}
                      </p>
                    </div>
                  )}

                  {serviceRequest.customer.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {serviceRequest.customer.email}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Verification Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        serviceRequest.customer.verificationStatus === 'VERIFIED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {serviceRequest.customer.verificationStatus === 'VERIFIED' ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Unverified
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Link
                    href={`/customers/view/${serviceRequest.customer.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Full Customer Profile →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Service Address */}
            {serviceRequest.serviceAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Service Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-900">{serviceRequest.serviceAddress.street}</p>
                    <p className="text-gray-900">
                      {serviceRequest.serviceAddress.city}, {serviceRequest.serviceAddress.state} {serviceRequest.serviceAddress.zip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned To */}
            {serviceRequest.assignedTo && serviceRequest.assignedTo.user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Assigned Employee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-900 font-medium">
                      {serviceRequest.assignedTo.user.firstName} {serviceRequest.assignedTo.user.lastName}
                    </p>
                    {serviceRequest.assignedTo.jobTitle && (
                      <p className="text-gray-600 text-sm">{serviceRequest.assignedTo.jobTitle}</p>
                    )}
                    {serviceRequest.assignedTo.employeeNumber && (
                      <p className="text-gray-500 text-sm">Employee #: {serviceRequest.assignedTo.employeeNumber}</p>
                    )}
                    <p className="text-gray-600 text-sm flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {serviceRequest.assignedTo.user.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Voice Call Information */}
            {serviceRequest.voiceCallLog && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    Voice Call Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Call ID</label>
                      <p className="text-gray-900 font-mono text-sm">{serviceRequest.voiceCallLog.vapiCallId}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Caller Number</label>
                      <p className="text-gray-900">{serviceRequest.voiceCallLog.callerNumber}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900">
                        {Math.floor(serviceRequest.voiceCallLog.duration / 60)}m {serviceRequest.voiceCallLog.duration % 60}s
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Call Time</label>
                      <p className="text-gray-900">{formatDateTime(serviceRequest.voiceCallLog.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/service-requests/edit/${serviceRequestId}`)}
                  disabled={!isOnline}
                >
                  <PencilSquareIcon className="h-4 w-4 mr-2" />
                  Edit Request
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/customers/view/${serviceRequest.customer.id}`)}
                >
                  <UserCircleIcon className="h-4 w-4 mr-2" />
                  View Customer
                </Button>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900 text-sm">{formatDateTime(serviceRequest.createdAt)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 text-sm">{formatDateTime(serviceRequest.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Status Info */}
            {!isOnline && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center text-yellow-800">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <p className="text-sm font-medium">Offline Mode</p>
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    You are currently offline. Some features may be unavailable.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
