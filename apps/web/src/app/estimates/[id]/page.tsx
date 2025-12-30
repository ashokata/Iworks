'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estimateService, Estimate } from '@/services/estimateService';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

// Helper to format decimal values from Prisma
const formatCurrency = (value: any): string => {
  const num = typeof value === 'number' ? value : parseFloat(value?.toString() || '0');
  return num.toFixed(2);
};

export default function EstimateDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const estimateId = params.id;
  const queryClient = useQueryClient();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const { data: estimate, isLoading, error } = useQuery({
    queryKey: ['estimate', estimateId],
    queryFn: () => estimateService.getById(estimateId),
    enabled: isAuthenticated && !!estimateId,
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await estimateService.delete(estimateId);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setToast({ message: 'Estimate deleted successfully', type: 'success' });
      setTimeout(() => {
        router.push('/estimates');
      }, 1000);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete estimate', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus: 'SENT' | 'APPROVED' | 'DECLINED') => {
    setIsUpdatingStatus(true);
    try {
      let updatedEstimate;
      if (newStatus === 'SENT') {
        updatedEstimate = await estimateService.send(estimateId);
      } else if (newStatus === 'APPROVED') {
        updatedEstimate = await estimateService.approve(estimateId);
      } else {
        updatedEstimate = await estimateService.decline(estimateId);
      }
      
      queryClient.setQueryData(['estimate', estimateId], updatedEstimate);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setToast({ message: `Estimate ${newStatus.toLowerCase()} successfully`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update estimate status', type: 'error' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Estimate Not Found</h2>
            <p className="text-gray-600 mb-4">The estimate you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => router.push('/estimates')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Estimates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'VIEWED':
        return 'bg-purple-100 text-purple-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`rounded-lg px-6 py-4 shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/estimates')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Estimates
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {estimate.title || `Estimate ${estimate.estimateNumber}`}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Created on {new Date(estimate.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(estimate.status)}`}>
                {estimate.status}
              </span>
              
              {/* Edit Button */}
              <button
                onClick={() => router.push(`/estimates/edit/${estimateId}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              {estimate.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange('SENT')}
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Estimate
                </button>
              )}
              
              {(estimate.status === 'SENT' || estimate.status === 'VIEWED') && (
                <>
                  <button
                    onClick={() => handleStatusChange('APPROVED')}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange('DECLINED')}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Decline
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Customer & Address Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">
                  {estimate.customer.firstName} {estimate.customer.lastName}
                </p>
              </div>
              {estimate.customer.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{estimate.customer.email}</p>
                </div>
              )}
              {estimate.customer.mobilePhone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-base text-gray-900">{estimate.customer.mobilePhone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Customer Number</p>
                <p className="text-base text-gray-900">{estimate.customer.customerNumber}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Address</h2>
            <div className="space-y-1">
              <p className="text-base text-gray-900">{estimate.address.street}</p>
              <p className="text-base text-gray-900">
                {estimate.address.city}, {estimate.address.state} {estimate.address.zip}
              </p>
            </div>
            
            {estimate.validUntil && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="text-base text-gray-900">
                  {new Date(estimate.validUntil).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {estimate.message && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Message</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{estimate.message}</p>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Line Items</h2>

          {/* Services */}
          {estimate.lineItems && estimate.lineItems.filter((item: any) => item.type === 'SERVICE').length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Services</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {estimate.lineItems.filter((item: any) => item.type === 'SERVICE').map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {item.isOptional && (
                                <span className="text-xs text-gray-500 italic">Optional</span>
                              )}
                              {item.isTaxable && (
                                <span className="text-xs text-green-600">Taxable</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          ${formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ${formatCurrency(parseFloat(item.quantity?.toString() || '0') * parseFloat(item.unitPrice?.toString() || '0'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Materials */}
          {estimate.lineItems && estimate.lineItems.filter((item: any) => item.type === 'MATERIAL').length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Materials</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {estimate.lineItems.filter((item: any) => item.type === 'MATERIAL').map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {item.isOptional && (
                                <span className="text-xs text-gray-500 italic">Optional</span>
                              )}
                              {item.isTaxable && (
                                <span className="text-xs text-green-600">Taxable</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          ${formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ${formatCurrency(parseFloat(item.quantity?.toString() || '0') * parseFloat(item.unitPrice?.toString() || '0'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${formatCurrency(estimate.subtotal)}</span>
                </div>
                {parseFloat(estimate.discountAmount?.toString() || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-red-600">-${formatCurrency(estimate.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({formatCurrency(estimate.taxRate)}%):</span>
                  <span className="text-gray-900">${formatCurrency(estimate.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-blue-600">${formatCurrency(estimate.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estimate Total Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Estimate Total</h2>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">${formatCurrency(estimate.total)}</p>
              {estimate.lineItems && estimate.lineItems.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">{estimate.lineItems.length} line item{estimate.lineItems.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {estimate.termsAndConditions && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Terms and Conditions</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{estimate.termsAndConditions}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Confirm Delete</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this estimate? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Estimate:</strong> {estimate.title || estimate.estimateNumber}
              </p>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Estimate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
