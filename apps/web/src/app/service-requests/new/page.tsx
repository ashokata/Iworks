'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { serviceRequestService } from '@/services/serviceRequestService';
import { customerService, Customer } from '@/services/customerService';
import { estimateService, Estimate } from '@/services/estimateService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DocumentTextIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
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
  estimateId: string;
  notes: string;
  isServiceAddressSameAsPrimary: boolean;
};

export default function NewServiceRequestPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
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
    estimateId: '',
    notes: '',
    isServiceAddressSameAsPrimary: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEstimateRedirect, setShowEstimateRedirect] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    type: 'SERVICE' as const
  });
  const [pendingAddresses, setPendingAddresses] = useState<Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    type: 'SERVICE';
  }>>([]);
  const [useSameAsPrimary, setUseSameAsPrimary] = useState(false);

  // Fetch customers for selection
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: isAuthenticated,
  });

  // Fetch all estimates for selection
  const { data: estimates, isLoading: isLoadingEstimates } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => estimateService.list(),
    enabled: isAuthenticated,
  });

  // Fetch estimate details when estimateId is provided
  const { data: selectedEstimate, isLoading: isLoadingEstimate } = useQuery({
    queryKey: ['estimate', formData.estimateId],
    queryFn: () => estimateService.getById(formData.estimateId),
    enabled: !!formData.estimateId && formData.estimateId.length > 0,
    retry: false,
  });

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

  // Update selected customer when customerId changes
  useEffect(() => {
    if (formData.customerId && customers) {
      const customer = customers.find((c: Customer) => c.id === formData.customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
      // Reset checkbox when customer is unselected
      setUseSameAsPrimary(false);
    }
  }, [formData.customerId, customers]);

  // Handle useSameAsPrimary checkbox change for immediate UI feedback
  useEffect(() => {
    if (useSameAsPrimary && selectedCustomer) {
      // Find primary address
      const addresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];
      const primaryAddress = addresses.find((addr: any) => addr.type?.toUpperCase() === 'PRIMARY');
      
      if (primaryAddress) {
        console.log('[UseSameAsPrimary] Primary address found:', primaryAddress);
        
        // Check ALL customer addresses for existing SERVICE address with same details
        const allCustomerAddresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];
        console.log('[UseSameAsPrimary] Checking against all addresses:', allCustomerAddresses.length);
        console.log('[UseSameAsPrimary] All addresses:', allCustomerAddresses);
        
        // Normalize primary address for comparison
        const normalizedPrimary = {
          street: (primaryAddress.street || '').trim().toLowerCase(),
          city: (primaryAddress.city || '').trim().toLowerCase(),
          state: (primaryAddress.state || '').trim().toLowerCase(),
          zip: (primaryAddress.zip || '').trim()
        };
        
        const existingServiceAddress = allCustomerAddresses.find((addr: any) => {
          if (addr.type?.toUpperCase() !== 'SERVICE') {
            return false;
          }
          
          // Normalize comparison address
          const normalizedAddr = {
            street: (addr.street || '').trim().toLowerCase(),
            city: (addr.city || '').trim().toLowerCase(),
            state: (addr.state || '').trim().toLowerCase(),
            zip: (addr.zip || '').trim()
          };
          
          const matches = normalizedAddr.street === normalizedPrimary.street &&
            normalizedAddr.city === normalizedPrimary.city &&
            normalizedAddr.state === normalizedPrimary.state &&
            normalizedAddr.zip === normalizedPrimary.zip;
          
          if (matches) {
            console.log('[UseSameAsPrimary] ✓ Found existing SERVICE address:', addr);
          }
          return matches;
        });

        if (existingServiceAddress) {
          // Use existing SERVICE address - NO new address created
          console.log('[UseSameAsPrimary] ✓✓ Using existing SERVICE address ID:', existingServiceAddress.id);
          console.log('[UseSameAsPrimary] NOT creating any new address - reusing existing');
          setFormData(prev => ({ ...prev, serviceAddressId: existingServiceAddress.id }));
          // IMPORTANT: Don't add to pending addresses since it already exists in database
        } else {
          // No matching SERVICE address found - create a pending one
          console.log('[UseSameAsPrimary] ✗ No existing SERVICE address found, creating pending address');
          const newServiceAddress = {
            id: `pending-primary-${Date.now()}`,
            street: primaryAddress.street,
            city: primaryAddress.city,
            state: primaryAddress.state,
            zip: primaryAddress.zip,
            type: 'SERVICE' as const
          };
          setPendingAddresses(prev => {
            // Remove any existing pending-primary addresses to avoid duplicates
            const filtered = prev.filter(addr => !addr.id.startsWith('pending-primary-'));
            return [...filtered, newServiceAddress];
          });
          setFormData(prev => ({ ...prev, serviceAddressId: newServiceAddress.id }));
          console.log('[UseSameAsPrimary] Created pending SERVICE address:', newServiceAddress);
        }
      } else {
        console.log('[UseSameAsPrimary] No primary address found for customer');
      }
    } else if (!useSameAsPrimary) {
      // Clear service address and remove pending-primary addresses when unchecked
      console.log('[UseSameAsPrimary] Checkbox unchecked, clearing addresses');
      setPendingAddresses(prev => prev.filter(addr => !addr.id.startsWith('pending-primary-')));
      setFormData(prev => ({ ...prev, serviceAddressId: '', isServiceAddressSameAsPrimary: false }));
    }
  }, [useSameAsPrimary, selectedCustomer]);

  // Get customer addresses (only SERVICE type) + pending addresses
  const customerAddresses = [
    ...((selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [])
      .filter((addr: any) => addr.type?.toUpperCase() === 'SERVICE'),
    ...pendingAddresses
  ];

  // Track unsaved changes
  useEffect(() => {
    const hasData = formData.customerId || formData.title || formData.description || formData.notes;
    setHasUnsavedChanges(!!hasData);
  }, [formData]);

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
      let finalServiceAddressId = formData.serviceAddressId;
      
      console.log('[ServiceRequest] Starting submission...');
      console.log('[ServiceRequest] formData:', formData);
      console.log('[ServiceRequest] formData.isServiceAddressSameAsPrimary:', formData.isServiceAddressSameAsPrimary);
      console.log('[ServiceRequest] useSameAsPrimary state:', useSameAsPrimary);
      console.log('[ServiceRequest] Pending addresses count:', pendingAddresses.length);
      console.log('[ServiceRequest] Pending addresses:', pendingAddresses);
      console.log('[ServiceRequest] Current serviceAddressId:', formData.serviceAddressId);
      
      // Save any pending addresses first (includes pending-primary addresses from checkbox)
      if (pendingAddresses.length > 0 && selectedCustomer) {
        console.log('[ServiceRequest] Saving pending addresses for customer:', selectedCustomer.id);
        for (const pendingAddr of pendingAddresses) {
          const { id, ...addressData } = pendingAddr;
          console.log('[ServiceRequest] Saving address:', addressData);
          const createdAddress = await customerService.addAddress(selectedCustomer.id, addressData);
          console.log('[ServiceRequest] Address created with ID:', createdAddress.id);
          
          // If this was the selected address, update the ID to the real one
          if (finalServiceAddressId === id) {
            console.log('[ServiceRequest] Updating finalServiceAddressId from', id, 'to', createdAddress.id);
            finalServiceAddressId = createdAddress.id;
          }
        }
        
        // Invalidate customers cache so next time we have fresh data
        console.log('[ServiceRequest] Invalidating customers cache');
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        console.log('[ServiceRequest] No pending addresses to save or no customer selected');
      }
      
      console.log('[ServiceRequest] Final serviceAddressId after processing:', finalServiceAddressId);
      
      const serviceRequestData = {
        customerId: formData.customerId,
        title: formData.title,
        description: formData.description,
        problemType: formData.problemType,
        urgency: formData.urgency,
        status: formData.status,
        createdSource: 'WEB' as const,
        isServiceAddressSameAsPrimary: formData.isServiceAddressSameAsPrimary,
        ...(finalServiceAddressId && { serviceAddressId: finalServiceAddressId }),
        ...(formData.assignedToId && { assignedToId: formData.assignedToId }),
        ...(formData.estimateId && { estimateId: formData.estimateId }),
        ...(formData.notes && { notes: formData.notes }),
      };
      
      console.log('[ServiceRequest] Submitting data:', serviceRequestData);
      await serviceRequestService.create(serviceRequestData);
      
      // Invalidate all service requests queries (list, counts, etc.)
      await queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'service-requests' || 
          query.queryKey[0] === 'service-requests-voice-count' ||
          query.queryKey[0] === 'service-requests-all-count'
      });
      
      setToast({
        message: 'Service request created successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        router.push('/service-requests');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create service request:', error);
      setToast({
        message: error?.message || 'Failed to create service request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || isLoadingCustomers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
                Create Service Request
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Add a new service request to your system
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
                  <span>Creating...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5" />
                  <span>Create Request</span>
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
                  {formData.title || 'New Service Request'}
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
                      label: `${customer.firstName || ''} ${customer.lastName || ''} (${customer.email || ''})`
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
                        {selectedCustomer.firstName || ''} {selectedCustomer.lastName || ''}
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

                {/* Same as Primary Address Checkbox */}
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={useSameAsPrimary}
                      onChange={(e) => {
                        setUseSameAsPrimary(e.target.checked);
                        setFormData(prev => ({ ...prev, isServiceAddressSameAsPrimary: e.target.checked }));
                      }}
                      disabled={!selectedCustomer}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm font-medium ${
                      !selectedCustomer ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'
                    } transition-colors`}>
                      Is Service Address Same as Primary Address
                    </span>
                  </label>
                  {!selectedCustomer && (
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      Select a customer first to enable this option
                    </p>
                  )}
                  {useSameAsPrimary && selectedCustomer && (() => {
                    const addresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];
                    const primaryAddress = addresses.find((addr: any) => addr.type?.toUpperCase() === 'PRIMARY');
                    return primaryAddress ? (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Using Primary Address:</p>
                        <p className="text-sm text-gray-700">
                          {primaryAddress.street}, {primaryAddress.city}, {primaryAddress.state} {primaryAddress.zip}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1 ml-8">
                        No primary address found for this customer
                      </p>
                    );
                  })()}
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
                    disabled={!selectedCustomer || useSameAsPrimary}
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

                <div>
                  <label htmlFor="estimateId" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Estimate (Optional)
                  </label>
                  <SearchableSelect
                    options={[
                      ...estimates?.map((estimate: any) => ({
                        value: estimate.id,
                        label: `${estimate.estimateNumber} - ${estimate.customer.firstName} ${estimate.customer.lastName} ($${Number(estimate.total).toFixed(2)}) - ${estimate.status}`
                      })) || [],
                      {
                        value: '__add_new__',
                        label: '+ Create New Estimate'
                      }
                    ]}
                    value={formData.estimateId}
                    onChange={(value) => {
                      console.log('[Estimate Select] Selected value:', value);
                      if (value === '__add_new__') {
                        console.log('[Estimate Select] Showing modal');
                        setShowEstimateRedirect(true);
                        return;
                      }
                      const event = {
                        target: {
                          name: 'estimateId',
                          value: value
                        }
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleChange(event);
                    }}
                    placeholder="-- Select an estimate --"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Link this service request to an existing estimate
                  </p>
                  
                  {/* Display Estimate Details */}
                  {isLoadingEstimate && formData.estimateId && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-600">Loading estimate details...</p>
                    </div>
                  )}
                  
                  {selectedEstimate && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Estimate Found</p>
                          <p className="text-sm font-semibold text-gray-800">{selectedEstimate.estimateNumber}</p>
                          {selectedEstimate.title && (
                            <p className="text-sm text-gray-700 mt-1">{selectedEstimate.title}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedEstimate.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          selectedEstimate.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                          selectedEstimate.status === 'VIEWED' ? 'bg-purple-100 text-purple-700' :
                          selectedEstimate.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                          selectedEstimate.status === 'EXPIRED' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {selectedEstimate.status}
                        </span>
                      </div>
                      
                      {selectedEstimate.message && (
                        <div className="pt-2 border-t border-green-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Message:</p>
                          <p className="text-sm text-gray-600">{selectedEstimate.message}</p>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Options & Line Items</p>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-bold text-gray-800">${Number(selectedEstimate.total).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {selectedEstimate.options.map((option, optionIdx) => (
                          <div key={option.id} className="mb-3 last:mb-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-800">{option.name}</p>
                                  {option.isRecommended && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                {option.description && (
                                  <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-gray-700 ml-4">${Number(option.total).toFixed(2)}</p>
                            </div>
                            
                            {option.lineItems.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {option.lineItems.map((item) => (
                                  <div key={item.id} className="flex items-start justify-between text-xs">
                                    <div className="flex-1">
                                      <span className="text-gray-700">{item.name}</span>
                                      {item.description && (
                                        <span className="text-gray-500 ml-1">- {item.description}</span>
                                      )}
                                      <span className="text-gray-500 ml-2">
                                        (Qty: {Number(item.quantity)} × ${Number(item.unitPrice).toFixed(2)})
                                      </span>
                                    </div>
                                    <span className="text-gray-600 font-medium ml-2">
                                      ${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.estimateId && !isLoadingEstimate && !selectedEstimate && (
                    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">Estimate not found. Please check the ID.</p>
                    </div>
                  )}
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
                onClick={() => {
                  if (!selectedCustomer || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zip) {
                    setToast({ message: 'Please fill in all address fields', type: 'error' });
                    return;
                  }
                  
                  // Stage address locally with temporary ID
                  const stagedAddress = {
                    id: `pending-${Date.now()}`,
                    ...newAddress
                  };
                  
                  setPendingAddresses([...pendingAddresses, stagedAddress]);
                  
                  // Auto-select the new address
                  const event = {
                    target: {
                      name: 'serviceAddressId',
                      value: stagedAddress.id
                    }
                  } as React.ChangeEvent<HTMLSelectElement>;
                  handleChange(event);
                  
                  setShowAddressModal(false);
                  setNewAddress({ street: '', city: '', state: '', zip: '', type: 'SERVICE' });
                  setToast({ message: 'Address staged (will be saved with service request)', type: 'success' });
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

      {/* Create Estimate Redirect Modal */}
      {showEstimateRedirect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Create New Estimate</h3>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-2">
                    Creating an estimate requires multiple steps including adding options and line items.
                  </p>
                  <p className="text-gray-600 text-sm">
                    You'll be redirected to the estimates page to create a new estimate. After creating it, you can return here and select it from the dropdown.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEstimateRedirect(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Save current form data to sessionStorage so it can be restored
                  sessionStorage.setItem('pendingServiceRequest', JSON.stringify({
                    formData,
                    selectedCustomerId: selectedCustomer?.id,
                    returnUrl: '/service-requests/new'
                  }));
                  router.push('/estimates/new');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Estimates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
