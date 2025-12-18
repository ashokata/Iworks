'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import {
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { serviceRequestService, ServiceRequest } from '@/services/serviceRequestService';

const urgencyColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

const statusColors = {
  NEW: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  NEW: ExclamationTriangleIcon,
  ASSIGNED: ArrowPathIcon,
  IN_PROGRESS: ArrowPathIcon,
  COMPLETED: CheckCircleIcon,
  CANCELLED: XCircleIcon,
};

export default function ServiceRequestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSource, setFilterSource] = useState<'VOICE_AGENT' | 'ALL'>('VOICE_AGENT');

  const { data, isLoading, error } = useQuery({
    queryKey: ['service-requests', filterSource, currentPage],
    queryFn: () =>
      serviceRequestService.list({
        createdSource: filterSource === 'VOICE_AGENT' ? 'VOICE_AGENT' : undefined,
        page: currentPage,
        pageSize: 20,
      }),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const serviceRequests = data?.serviceRequests || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <PhoneIcon className="h-6 w-6 mr-3" />
                Service Requests
              </h1>
              <p className="text-sm text-blue-100">View service requests created by voice calls and other sources</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilterSource('VOICE_AGENT');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterSource === 'VOICE_AGENT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Voice Agent Requests
            </button>
            <button
              onClick={() => {
                setFilterSource('ALL');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                filterSource === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Requests
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 text-center">
            <p className="text-red-600">Error loading service requests: {(error as Error).message}</p>
          </Card>
        )}

        {/* Service Requests List */}
        {!isLoading && !error && (
          <>
            {serviceRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <PhoneIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Requests Found</h3>
                <p className="text-gray-500">
                  {filterSource === 'VOICE_AGENT'
                    ? 'No service requests have been created via voice calls yet.'
                    : 'No service requests found.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((request: ServiceRequest) => {
                  const StatusIcon = statusIcons[request.status];
                  return (
                    <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{request.title}</h3>
                            {request.requestNumber && (
                              <span className="text-sm text-gray-500">#{request.requestNumber}</span>
                            )}
                            {request.createdSource === 'VOICE_AGENT' && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                📞 Voice Call
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{request.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${urgencyColors[request.urgency]}`}>
                            {request.urgency}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status]}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        {/* Customer Info */}
                        <div className="flex items-start">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {request.customer.firstName} {request.customer.lastName}
                            </p>
                            <p className="text-xs text-gray-500">ID: {request.customer.customerNumber}</p>
                            {request.customer.verificationStatus === 'UNVERIFIED' && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 mt-1">
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-start">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-900">{request.customer.mobilePhone || 'N/A'}</p>
                            {request.customer.email && (
                              <p className="text-xs text-gray-500">{request.customer.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Service Address */}
                        {request.serviceAddress && (
                          <div className="flex items-start">
                            <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-900">{request.serviceAddress.street}</p>
                              <p className="text-xs text-gray-500">
                                {request.serviceAddress.city}, {request.serviceAddress.state} {request.serviceAddress.zip}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Call Info / Timestamp */}
                        <div className="flex items-start">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </p>
                            {request.voiceCallLog && (
                              <p className="text-xs text-gray-500 mt-1">
                                Call duration: {Math.floor(request.voiceCallLog.duration / 60)}m {request.voiceCallLog.duration % 60}s
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Problem Type */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {request.problemType}
                        </span>
                        {request.assignedTo && request.assignedTo.user && (
                          <span className="ml-3 inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            Assigned to: {request.assignedTo.user.firstName || ''} {request.assignedTo.user.lastName || ''}
                            {request.assignedTo.jobTitle && ` (${request.assignedTo.jobTitle})`}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * (pagination.pageSize || 20) + 1} to{' '}
                  {Math.min(currentPage * (pagination.pageSize || 20), pagination.total)} of {pagination.total} requests
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

