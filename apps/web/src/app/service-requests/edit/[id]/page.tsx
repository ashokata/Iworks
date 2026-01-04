'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { serviceRequestService } from '@/services/serviceRequestService';
import { customerService, Customer } from '@/services/customerService';
import { estimateService, Estimate } from '@/services/estimateService';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

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
    estimateId: '',
    notes: '',
    isServiceAddressSameAsPrimary: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
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
  const [pendingAddresses, setPendingAddresses] = useState<Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    type: 'SERVICE';
  }>>([]);
  const [useSameAsPrimary, setUseSameAsPrimary] = useState(false);
  const prevCustomerIdRef = useRef<string | null>(null);

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

  // Populate form with service request data
  useEffect(() => {
    if (serviceRequest) {
      console.log('[EditServiceRequest] Loading service request:', serviceRequest);
      console.log('[EditServiceRequest] serviceAddressId:', serviceRequest.serviceAddressId);
      console.log('[EditServiceRequest] serviceAddress:', serviceRequest.serviceAddress);
      
      const initialData = {
        customerId: serviceRequest.customer?.id || '',
        title: serviceRequest.title || '',
        description: serviceRequest.description || '',
        problemType: serviceRequest.problemType || 'HVAC',
        urgency: serviceRequest.urgency || 'MEDIUM',
        status: serviceRequest.status || 'NEW',
        serviceAddressId: serviceRequest.serviceAddressId || (serviceRequest.serviceAddress as any)?.id || '',
        assignedToId: serviceRequest.assignedTo?.id || serviceRequest.assignedToId || '',
        estimateId: (serviceRequest as any).estimateId || '',
        notes: (serviceRequest as any).notes || '',
        isServiceAddressSameAsPrimary: (serviceRequest as any).isServiceAddressSameAsPrimary || false,
      };
      console.log('[EditServiceRequest] Setting formData.serviceAddressId to:', initialData.serviceAddressId);
      console.log('[EditServiceRequest] Setting isServiceAddressSameAsPrimary to:', initialData.isServiceAddressSameAsPrimary);
      setFormData(initialData);
      setOriginalData(initialData);
      setUseSameAsPrimary(initialData.isServiceAddressSameAsPrimary);
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
      
      // Only reset checkbox if customer actually changed (not during initial load)
      if (prevCustomerIdRef.current !== null && prevCustomerIdRef.current !== formData.customerId) {
        console.log('[CustomerChange] Customer changed, resetting checkbox');
        setUseSameAsPrimary(false);
        setFormData(prev => ({ ...prev, serviceAddressId: '', isServiceAddressSameAsPrimary: false }));
      }
      
      // Update the ref with current customer ID
      prevCustomerIdRef.current = formData.customerId;
    } else {
      setSelectedCustomer(null);
      // Reset checkbox when customer is unselected
      setUseSameAsPrimary(false);
      setFormData(prev => ({ ...prev, serviceAddressId: '', isServiceAddressSameAsPrimary: false }));
      prevCustomerIdRef.current = null;
    }
  }, [formData.customerId, customers]);

  // Handle useSameAsPrimary checkbox change for immediate UI feedback
  useEffect(() => {
    if (useSameAsPrimary && selectedCustomer) {
      // Check if current serviceAddressId is already a valid SERVICE address for this customer
      const addresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];
      const currentAddressIsValid = addresses.some((addr: any) => 
        addr.id === formData.serviceAddressId && addr.type?.toUpperCase() === 'SERVICE'
      );
      
      // If we already have a valid SERVICE address, don't change it
      if (currentAddressIsValid && formData.serviceAddressId) {
        console.log('[UseSameAsPrimary] Already have valid SERVICE address:', formData.serviceAddressId);
        return;
      }
      
      // Find primary address
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
          setFormData(prev => ({ ...prev, serviceAddressId: existingServiceAddress.id, isServiceAddressSameAsPrimary: true }));
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
          setFormData(prev => ({ ...prev, serviceAddressId: newServiceAddress.id, isServiceAddressSameAsPrimary: true }));
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
  }, [useSameAsPrimary]); // Only depend on useSameAsPrimary, NOT selectedCustomer

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
      setShowValidation(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      let finalServiceAddressId = formData.serviceAddressId;
      
      console.log('[ServiceRequest] Starting submission...');
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
        isServiceAddressSameAsPrimary: formData.isServiceAddressSameAsPrimary,
        ...(finalServiceAddressId && { serviceAddressId: finalServiceAddressId }),
        ...(formData.assignedToId && { assignedToId: formData.assignedToId }),
        ...(formData.estimateId && { estimateId: formData.estimateId }),
        ...(formData.notes && { notes: formData.notes }),
      };
      
      console.log('[ServiceRequest] ===== UPDATE SUBMISSION =====');
      console.log('[ServiceRequest] formData.isServiceAddressSameAsPrimary:', formData.isServiceAddressSameAsPrimary);
      console.log('[ServiceRequest] formData.serviceAddressId:', formData.serviceAddressId);
      console.log('[ServiceRequest] finalServiceAddressId:', finalServiceAddressId);
      console.log('[ServiceRequest] useSameAsPrimary state:', useSameAsPrimary);
      console.log('[ServiceRequest] serviceRequestData:', serviceRequestData);
      console.log('[ServiceRequest] ================================');
      await serviceRequestService.update(serviceRequestId, serviceRequestData);
      
      // Invalidate all service request related queries
      queryClient.invalidateQueries({ queryKey: ['service-request', serviceRequestId] });
      await queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'service-requests' || 
          query.queryKey[0] === 'service-requests-voice-count' ||
          query.queryKey[0] === 'service-requests-all-count'
      });
      
      setToast({
        message: 'Service request updated successfully!',
        type: 'success'
      });
      
      setTimeout(() => {
        router.push('/service-requests');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a8a]"></div>
      </div>
    );
  }

  // Service request not found
  if (!serviceRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Service Request not found</h2>
          <p className="mt-2 text-gray-600">The service request you're trying to edit doesn't exist</p>
          <button 
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => router.push('/service-requests')}
          >
            Go to Service Requests
          </button>
        </div>
      </div>
    );
  }

  // Get customer addresses (only SERVICE type) + pending addresses
  const customerAddresses = [
    ...((selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [])
      .filter((addr: any) => addr.type?.toUpperCase() === 'SERVICE'),
    ...pendingAddresses
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] border-b border-[#172554] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-white/20"></div>
            <h1 className="text-2xl font-bold text-white">Edit Service Request</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              formData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              formData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
              formData.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {formData.status.replace('_', ' ')}
            </div>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 hover:bg-gray-50 shadow-md hover:shadow-lg"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Service Request'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex">
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8 pb-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all placeholder:text-gray-400"
                      placeholder="e.g., HVAC not cooling properly"
                    />
                    {showValidation && errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  {/* Customer */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Customer <span className="text-red-600">*</span>
                    </label>
                    <SearchableSelect
                      options={(customers || []).map((c: Customer) => ({
                        value: c.id,
                        label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : c.mobilePhone ? ` (${c.mobilePhone})` : ''}`,
                      }))}
                      value={formData.customerId}
                      onChange={(value) => {
                        const event = {
                          target: { name: 'customerId', value: value }
                        } as React.ChangeEvent<HTMLSelectElement>;
                        handleChange(event);
                      }}
                      placeholder="Select customer"
                      disabled={isLoadingCustomers}
                    />
                    {showValidation && errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
                  </div>

                  {/* Display selected customer info */}
                  {selectedCustomer && (
                    <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-700">
                          <span className="font-semibold">Name:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </div>
                        {selectedCustomer.email && (
                          <div className="text-gray-700">
                            <span className="font-semibold">Email:</span> {selectedCustomer.email}
                          </div>
                        )}
                        {selectedCustomer.mobilePhone && (
                          <div className="text-gray-700">
                            <span className="font-semibold">Phone:</span> {selectedCustomer.mobilePhone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                    placeholder="Describe the service request..."
                  />
                  {showValidation && errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Request Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Problem Type */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Problem Type
                    </label>
                    <select
                      name="problemType"
                      value={formData.problemType}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] appearance-none bg-white"
                      style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical</option>
                      <option value="GENERAL">General</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Urgency Level
                    </label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] appearance-none bg-white"
                      style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] appearance-none bg-white"
                      style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%236b7280%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                    >
                      <option value="NEW">New</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Address */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Service Address</h2>
                
                <div className="space-y-6">
                  {/* Use Same as Primary Address */}
                  <div>
                    <label className="inline-flex items-center cursor-pointer group">
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
                      <span className={`ml-2 text-sm font-medium ${
                        !selectedCustomer ? 'text-gray-400' : 'text-gray-700 group-hover:text-blue-600'
                      } transition-colors`}>
                        Use Same as Primary Address
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

                  {/* Service Address Select */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Service Address
                    </label>
                    <SearchableSelect
                      options={[
                        ...customerAddresses.map((address: any) => ({
                          value: address.id,
                          label: `${address.street}, ${address.city}, ${address.state} ${address.zip}${address.id.startsWith('pending') ? ' (pending)' : ''}`
                        })),
                        ...(selectedCustomer ? [{
                          value: '__add_new__',
                          label: '+ Add New Service Address'
                        }] : [])
                      ]}
                      value={formData.serviceAddressId}
                      disabled={!formData.customerId || useSameAsPrimary}
                      onChange={(value) => {
                        if (value === '__add_new__') {
                          setShowAddressModal(true);
                          return;
                        }
                        const event = {
                          target: { name: 'serviceAddressId', value: value }
                        } as React.ChangeEvent<HTMLSelectElement>;
                        handleChange(event);
                      }}
                      placeholder={selectedCustomer ? "-- Select service address --" : "Select a customer first"}
                    />
                  </div>
                </div>
              </div>


              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Additional Information</h2>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                    placeholder="Add internal notes..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Service Address Modal */}
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
                    alert('Please fill in all address fields');
                    return;
                  }
                  
                  const stagedAddress = {
                    id: `pending-${Date.now()}`,
                    ...newAddress
                  };
                  
                  setPendingAddresses([...pendingAddresses, stagedAddress]);
                  
                  const event = {
                    target: { name: 'serviceAddressId', value: stagedAddress.id }
                  } as React.ChangeEvent<HTMLSelectElement>;
                  handleChange(event);
                  
                  setShowAddressModal(false);
                  setNewAddress({ street: '', city: '', state: '', zip: '', type: 'SERVICE' });
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
