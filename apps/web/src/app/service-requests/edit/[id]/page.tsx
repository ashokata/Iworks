'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { serviceRequestService } from '@/services/serviceRequestService';
import { customerService, Customer } from '@/services/customerService';
import { 
  DocumentTextIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type FormData = {
  customerId: string;
  title: string;
  description: string;
  problemType: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  serviceAddressId: string;
  assignedToId: string;
  notes: string;
};

export default function EditServiceRequestPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const serviceRequestId = params.id;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    title: '',
    description: '',
    problemType: 'HVAC',
    urgency: 'MEDIUM',
    status: 'NEW',
    serviceAddressId: '',
    assignedToId: '',
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    type: 'SERVICE' as const
  });

  // Fetch service request data
  const { data: serviceRequest, isLoading: isLoadingRequest } = useQuery({
    queryKey: ['service-request', serviceRequestId],
    queryFn: () => serviceRequestService.getById(serviceRequestId),
    enabled: !!serviceRequestId,
  });

  // Fetch customers for selection
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: isAuthenticated,
  });

  // Populate form with service request data
  useEffect(() => {
    if (serviceRequest) {
      const initialData = {
        customerId: serviceRequest.customer?.id || '',
        title: serviceRequest.title || '',
        description: serviceRequest.description || '',
        problemType: serviceRequest.problemType || 'HVAC',
        urgency: serviceRequest.urgency || 'MEDIUM',
        status: serviceRequest.status || 'NEW',
        serviceAddressId: serviceRequest.serviceAddressId || (serviceRequest.serviceAddress as any)?.id || '',
        assignedToId: serviceRequest.assignedTo?.id || serviceRequest.assignedToId || '',
        notes: (serviceRequest as any).notes || '',
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [serviceRequest]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Track unsaved changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update selected customer when customerId changes
  useEffect(() => {
    if (formData.customerId && customers) {
      const customer = customers.find((c: Customer) => c.id === formData.customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [formData.customerId, customers]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handleSubmit(e as any);
        }
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        if (hasUnsavedChanges) {
          const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
          if (confirmLeave) {
            router.push('/service-requests');
          }
        } else {
          router.push('/service-requests');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving, router]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.problemType) {
      newErrors.problemType = 'Problem type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const serviceRequestData = {
        customerId: formData.customerId,
        title: formData.title,
        description: formData.description,
        problemType: formData.problemType,
        urgency: formData.urgency,
        status: formData.status,
        ...(formData.serviceAddressId && { serviceAddressId: formData.serviceAddressId }),
        ...(formData.assignedToId && { assignedToId: formData.assignedToId }),
        ...(formData.notes && { notes: formData.notes }),
      };
      
      await serviceRequestService.update(serviceRequestId, serviceRequestData);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['service-request', serviceRequestId] });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      
      setToast({
        message: 'Service request updated successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        router.push(`/service-requests/view/${serviceRequestId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to update service request:', error);
      setToast({
        message: error?.message || 'Failed to update service request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || isLoadingRequest || isLoadingCustomers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Service request not found
  if (!serviceRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Service Request not found</h2>
          <p className="mt-2 text-gray-600">The service request you're trying to edit doesn't exist</p>
          <Button className="mt-4" onClick={() => router.push('/service-requests')}>
            Go to Service Requests
          </Button>
        </div>
      </div>
    );
  }

  // Get customer addresses
  const customerAddresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className={`flex items-start gap-4 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[420px] border ${
            toast.type === 'error' 
              ? 'bg-red-50/95 border-red-200'
              : 'bg-emerald-50/95 border-emerald-200'
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              toast.type === 'error'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-gradient-to-br from-emerald-500 to-green-600'
            }`}>
              {toast.type === 'error' ? (
                <XMarkIcon className="h-6 w-6 text-white" />
              ) : (
                <CheckIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-bold ${
                toast.type === 'error' ? 'text-red-900' : 'text-emerald-900'
              }`}>
                {toast.type === 'error' ? '⚠️ Error Occurred' : '✓ Success!'}
              </p>
              <p className={`text-sm mt-1.5 ${
                toast.type === 'error' ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-all hover:rotate-90 duration-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Header with Glass Effect */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/service-requests')}
              className="group flex items-center space-x-2 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-700 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">Back</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Edit Service Request
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {serviceRequest.requestNumber || 'No Request Number'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl border shadow-sm ${
              formData.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
              formData.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200' :
              formData.status === 'CANCELLED' ? 'bg-red-50 border-red-200' :
              formData.status === 'ASSIGNED' ? 'bg-indigo-50 border-indigo-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                formData.status === 'COMPLETED' ? 'bg-green-500' :
                formData.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                formData.status === 'CANCELLED' ? 'bg-red-500' :
                formData.status === 'ASSIGNED' ? 'bg-indigo-500' :
                'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-semibold ${
                formData.status === 'COMPLETED' ? 'text-green-700' :
                formData.status === 'IN_PROGRESS' ? 'text-blue-700' :
                formData.status === 'CANCELLED' ? 'text-red-700' :
                formData.status === 'ASSIGNED' ? 'text-indigo-700' :
                'text-yellow-700'
              }`}>
                {formData.status.replace('_', ' ')}
              </span>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2 px-4 py-2.5 bg-orange-50 border border-orange-300 rounded-xl shadow-sm">
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-sm"></div>
                <span className="text-sm font-semibold text-orange-700">Unsaved Changes</span>
              </div>
            )}
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isSaving ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5" />
                  <span>Save Changes</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Card Layout */}
      <div className="container mx-auto px-8 py-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Service Request Preview Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-28 hover:shadow-2xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-4 shadow-lg relative z-10">
                  <DocumentTextIcon className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                  {formData.title || 'Service Request'}
                </h3>
                <p className="text-sm text-blue-50 capitalize flex items-center justify-center relative z-10">
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 mr-2"></span>
                  {formData.problemType.replace('_', ' ')}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Status Badge */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center mb-2">
                    <CheckIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                    Status
                  </label>
                  <span className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                    formData.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    formData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    formData.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {formData.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Urgency Badge */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center mb-2">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                    Urgency Level
                  </label>
                  <span className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                    formData.urgency === 'EMERGENCY' || formData.urgency === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    formData.urgency === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    formData.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {formData.urgency}
                  </span>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                    Internal Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
                    rows={4}
                    placeholder="Add internal notes about this request..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Selection Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-visible hover:scale-[1.01] relative z-20">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Customer Information</h2>
                    <p className="text-xs text-blue-100">Select customer and service address</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6 bg-gradient-to-b from-gray-50/30 to-white">
                <div className="relative z-10">
                  <label htmlFor="customerId" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Select Customer <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={customers?.map((customer: Customer) => ({
                      value: customer.id,
                      label: `${customer.firstName} ${customer.lastName} (${customer.email})`
                    })) || []}
                    value={formData.customerId}
                    onChange={(value) => {
                      const event = {
                        target: {
                          name: 'customerId',
                          value: value
                        }
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleChange(event);
                    }}
                    placeholder="-- Select a customer --"
                  />
                  {errors.customerId && (
                    <p className="mt-2 text-xs text-red-600 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.customerId}
                    </p>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="mt-2 p-4 bg-blue-50/80 border border-blue-200 rounded-lg backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <UserCircleIcon className="h-4 w-4 mr-2 text-blue-600" />
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </div>
                      {selectedCustomer.mobilePhone && (
                        <div className="flex items-center text-gray-700">
                          <PhoneIcon className="h-4 w-4 mr-2 text-blue-600" />
                          {selectedCustomer.mobilePhone}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Request Details Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-visible hover:scale-[1.01] relative z-10">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Request Details</h2>
                    <p className="text-xs text-blue-100">Service request information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6 bg-gradient-to-b from-gray-50/30 to-white">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="title" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${
                      formData.title.length < 5 ? 'text-gray-400' : 'text-green-600'
                    }`}>
                      {formData.title.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g., HVAC not cooling properly"
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                      errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="description" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-xs ${
                      formData.description.length < 10 ? 'text-gray-400' : 'text-green-600'
                    }`}>
                      {formData.description.length}/500
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Provide detailed information about the service request..."
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="problemType" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      Problem Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="problemType"
                      name="problemType"
                      value={formData.problemType}
                      onChange={handleChange}
                      className="w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer bg-[length:20px] bg-[position:right_12px_center] bg-no-repeat"
                      style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')" }}
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="APPLIANCE">Appliance</option>
                      <option value="GENERAL_MAINTENANCE">General Maintenance</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="urgency" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      Urgency
                    </label>
                    <select
                      id="urgency"
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer bg-[length:20px] bg-[position:right_12px_center] bg-no-repeat"
                      style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')" }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full appearance-none px-4 py-3 pr-10 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer bg-[length:20px] bg-[position:right_12px_center] bg-no-repeat"
                      style={{ backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')" }}
                    >
                      <option value="NEW">New</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="serviceAddressId" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Service Address (Optional)
                  </label>
                  <SearchableSelect
                    options={[
                      ...customerAddresses.map((address: any) => ({
                        value: address.id,
                        label: `${address.street}, ${address.city}, ${address.state} ${address.zip}`
                      })),
                      ...(selectedCustomer ? [{
                        value: '__add_new__',
                        label: '+ Add New Service Address'
                      }] : [])
                    ]}
                    value={formData.serviceAddressId}
                    onChange={(value) => {
                      if (value === '__add_new__') {
                        setShowAddressModal(true);
                        return;
                      }
                      const event = {
                        target: {
                          name: 'serviceAddressId',
                          value: value
                        }
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleChange(event);
                    }}
                    placeholder={selectedCustomer ? "-- Select service address --" : "Select a customer first"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Add Service Address</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter street address"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  City *
                </label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter city"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    State *
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={newAddress.zip}
                    onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setNewAddress({ street: '', city: '', state: '', zip: '', type: 'SERVICE' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedCustomer || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip) {
                    setToast({ message: 'Please fill in all address fields', type: 'error' });
                    return;
                  }
                  
                  try {
                    const createdAddress = await customerService.addAddress(selectedCustomer.id, newAddress);
                    
                    // Update selected customer with new address
                    const updatedCustomer = {
                      ...selectedCustomer,
                      addresses: [...(selectedCustomer.addresses || []), createdAddress]
                    };
                    setSelectedCustomer(updatedCustomer);
                    
                    // Auto-select the new address
                    const event = {
                      target: {
                        name: 'serviceAddressId',
                        value: createdAddress.id
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    handleChange(event);
                    
                    setShowAddressModal(false);
                    setNewAddress({ street: '', city: '', state: '', zip: '', type: 'SERVICE' });
                    setToast({ message: 'Address added successfully', type: 'success' });
                  } catch (error) {
                    console.error('Error adding address:', error);
                    setToast({ message: 'Failed to add address', type: 'error' });
                  }
                }}
                disabled={!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
