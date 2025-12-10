'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { customerService, Customer, CustomerAddress } from '@/services/customerService';
import { 
  UserCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  MapPinIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

type AddressType = 'Primary' | 'Billing' | 'Service';

type FormCustomerAddress = CustomerAddress & {
  addressType?: AddressType;
  street2?: string;
  county?: string;
  country?: string;
};

type FormData = {
  display_name: string;
  type: 'homeowner' | 'business';
  email: string;
  mobile_number: string;
  home_number: string;
  work_number: string;
  company: string;
  job_title: string;
  notifications_enabled: boolean;
  has_improved_card_on_file: boolean;
  is_contractor: boolean;
  notes: string;
  addresses: FormCustomerAddress[];
  tags: string[];
};

export default function PetCustomerEditPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<FormData>({
    display_name: '',
    type: 'homeowner',
    email: '',
    mobile_number: '',
    home_number: '',
    work_number: '',
    company: '',
    job_title: '',
    notifications_enabled: false,
    has_improved_card_on_file: false,
    is_contractor: false,
    notes: '',
    addresses: [],
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

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

  // Fetch customer data with cache-first strategy
  const { data: customer, isLoading, isError, error, refetch, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
    enabled: !!customerId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch if cache exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Populate form when customer data is available (including from cache)
  useEffect(() => {
    if (customer) {
      setFormData({
        display_name: customer.display_name || '',
        type: customer.type || 'homeowner',
        email: customer.email || '',
        mobile_number: customer.mobile_number || '',
        home_number: customer.home_number || '',
        work_number: customer.work_number || '',
        company: customer.company || '',
        job_title: customer.job_title || '',
        notifications_enabled: customer.notifications_enabled || false,
        has_improved_card_on_file: customer.has_improved_card_on_file || false,
        is_contractor: customer.is_contractor || false,
        notes: customer.notes || '',
        addresses: customer.addresses?.data || [],
        tags: customer.tags.data || [],
      });
    }
  }, [customer]);

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

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle tag input
  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  // Add a tag
  const handleAddTag = () => {
    if (tagsInput.trim() && !formData.tags.includes(tagsInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()]
      }));
      setTagsInput('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Address handling functions
  const handleAddAddress = () => {
    if (formData.addresses.length >= 3) {
      setToast({
        message: 'Maximum of 3 addresses allowed',
        type: 'error'
      });
      return;
    }
    
    // Determine smart default type (avoid duplicates)
    const existingTypes = formData.addresses.map(addr => addr.addressType);
    let defaultType: AddressType = 'Primary';
    
    if (!existingTypes.includes('Primary')) {
      defaultType = 'Primary';
    } else if (!existingTypes.includes('Billing')) {
      defaultType = 'Billing';
    } else if (!existingTypes.includes('Service')) {
      defaultType = 'Service';
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          id: `temp-${Date.now()}`,
          addressType: defaultType,
          street: '',
          city: '',
          state: '',
          zipCode: '',
          isPrimary: defaultType === 'Primary'
        }
      ]
    }));
  };

  const handleRemoveAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const handleAddressChange = (index: number, field: keyof CustomerAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const handleAddressTypeChange = (index: number, newType: AddressType) => {
    // Check for duplicate type
    const existingTypes = formData.addresses.map((addr, i) => 
      i !== index ? addr.addressType : null
    );
    
    if (existingTypes.includes(newType)) {
      setToast({
        message: `A ${newType} address already exists. Please choose a different type.`,
        type: 'error'
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { 
          ...addr, 
          addressType: newType,
          isPrimary: newType === 'Primary'
        } : addr
      )
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Validate addresses
    if (formData.addresses.length > 0) {
      formData.addresses.forEach((address, index) => {
        if (!address.street?.trim()) {
          newErrors[`address_${index}_street`] = `Address ${index + 1}: Street is required`;
          setToast({
            message: `Address ${index + 1} (${address.addressType}): Street is required`,
            type: 'error'
          });
        }
        if (!address.city?.trim()) {
          newErrors[`address_${index}_city`] = `Address ${index + 1}: City is required`;
          setToast({
            message: `Address ${index + 1} (${address.addressType}): City is required`,
            type: 'error'
          });
        }
        if (!address.state?.trim()) {
          newErrors[`address_${index}_state`] = `Address ${index + 1}: State is required`;
          setToast({
            message: `Address ${index + 1} (${address.addressType}): State is required`,
            type: 'error'
          });
        }
        if (!address.zipCode?.trim()) {
          newErrors[`address_${index}_zipCode`] = `Address ${index + 1}: ZIP Code is required`;
          setToast({
            message: `Address ${index + 1} (${address.addressType}): ZIP Code is required`,
            type: 'error'
          });
        }
      });
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
      if (customer) {
        // Prepare customer update - only include fields that can be updated
        const customerUpdate = {
          display_name: formData.display_name,
          type: formData.type,
          email: formData.email,
          mobile_number: formData.mobile_number,
          home_number: formData.home_number,
          work_number: formData.work_number,
          company: formData.company,
          job_title: formData.job_title,
          notifications_enabled: formData.notifications_enabled,
          has_improved_card_on_file: formData.has_improved_card_on_file,
          is_contractor: formData.is_contractor,
          notes: formData.notes
        };
        
        // Update customer
        await customerService.updateCustomer(customerId, customerUpdate);
        
        // Handle address updates
        const existingAddresses = customer.addresses?.data || [];
        const currentAddresses = formData.addresses;
        
        // Delete removed addresses
        for (const existingAddr of existingAddresses) {
          const stillExists = currentAddresses.find(addr => addr.id === existingAddr.id);
          if (!stillExists) {
            try {
              await customerService.deleteCustomerAddress(customerId, String(existingAddr.id));
            } catch (err) {
              console.warn('Failed to delete address:', err);
            }
          }
        }
        
        // Update existing addresses or create new ones
        for (const addr of currentAddresses) {
          if (addr.id) {
            // Update existing address - only send fields that can be updated
            try {
              const updatePayload = {
                street: addr.street,
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode,
                street2: addr.street2,
                county: addr.county,
                country: addr.country,
                addressType: addr.addressType,
                isPrimary: addr.isPrimary
              };
              console.log('🔍 Updating address with payload:', updatePayload);
              console.log('🔍 Address ID:', addr.id);
              await customerService.updateCustomerAddress(customerId, String(addr.id), updatePayload);
            } catch (err) {
              console.warn('Failed to update address:', err);
            }
          } else {
            // Create new address
            try {
              await customerService.addCustomerAddress(customerId, addr);
            } catch (err) {
              console.warn('Failed to create address:', err);
            }
          }
        }
        
        setToast({
          message: 'Customer updated successfully!',
          type: 'success'
        });
        
        // Update the customer cache directly instead of invalidating
        // This prevents unnecessary refetch
        const updatedCustomerData = {
          ...customer,
          ...customerUpdate,
          addresses: { ...customer.addresses, data: formData.addresses }
        };
        
        queryClient.setQueryData(['customer', customerId], updatedCustomerData);
        
        // Update the customer in the list cache
        queryClient.setQueryData(['customers'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((c: any) => 
            c.id === customerId ? updatedCustomerData : c
          );
        });
        
        // Navigate back to customer overview page after short delay
        setTimeout(() => {
          router.push('/customers');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      setToast({
        message: 'Failed to update customer. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

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
              Unable to load customer details from the server. Please try again.
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
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/customers')}
              className="group flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
            >
              <svg className="h-5 w-5 text-gray-600 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Back</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Edit Customer
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Update customer information and addresses</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-semibold text-emerald-700">Active</span>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="container mx-auto px-8 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Preview Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-center">
                <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                  <UserCircleIcon className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {formData.display_name || 'Customer'}
                </h3>
                <p className="text-sm text-indigo-100 capitalize flex items-center justify-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 mr-2"></span>
                  {formData.type}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Tags Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                      <TagIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                      Tags
                    </label>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={handleTagsInputChange}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 focus:bg-white rounded-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[24px]">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 hover:text-indigo-900 transition-colors"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No tags yet</span>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
                    rows={4}
                    placeholder="Add private notes about this customer..."
                  />
                </div>

                {/* Quick Options */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
                    Quick Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="notifications_enabled"
                        checked={formData.notifications_enabled}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        🔔 Enable notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="has_improved_card_on_file"
                        checked={formData.has_improved_card_on_file}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        💳 Card on file
                      </span>
                    </label>
                    
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="is_contractor"
                        checked={formData.is_contractor}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        🔨 Contractor
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Personal Information</h2>
                    <p className="text-xs text-blue-100">Customer details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                      errors.display_name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                    } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100`}
                    placeholder="Full name"
                  />
                  {errors.display_name && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.display_name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Customer Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'homeowner' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'homeowner'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'homeowner' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${formData.type === 'homeowner' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span className={`font-semibold ${formData.type === 'homeowner' ? 'text-blue-700' : 'text-gray-700'}`}>
                          Homeowner
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'business' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'business'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'business' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <BuildingOfficeIcon className={`h-5 w-5 ${formData.type === 'business' ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <span className={`font-semibold ${formData.type === 'business' ? 'text-purple-700' : 'text-gray-700'}`}>
                          Business
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Contact Details</h2>
                    <p className="text-xs text-emerald-100">How to reach this customer</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      📱 Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      🏠 Home
                    </label>
                    <input
                      type="text"
                      name="home_number"
                      value={formData.home_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      💼 Work
                    </label>
                    <input
                      type="text"
                      name="work_number"
                      value={formData.work_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information Card - Conditional */}
            {formData.type === 'business' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Business Information</h2>
                      <p className="text-xs text-purple-100">Company details</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-100"
                        placeholder="Acme Corporation"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-100"
                        placeholder="Manager"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MapPinIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Customer Addresses</h2>
                      <p className="text-xs text-amber-100">Manage up to 3 addresses</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                      {formData.addresses.length}/3
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {formData.addresses.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-dashed border-orange-200">
                    <MapPinIcon className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Addresses Yet</h3>
                    <p className="text-sm text-gray-600 mb-4">Add your first address to get started</p>
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add First Address
                    </button>
                  </div>
                ) : (
                  <>
                    {formData.addresses.map((address, index) => (
                      <div key={index} className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-5 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="relative flex-1 max-w-xs">
                            <select
                              value={address.addressType || 'Primary'}
                              onChange={(e) => handleAddressTypeChange(index, e.target.value as AddressType)}
                              className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border-2 border-orange-300 rounded-lg text-sm font-semibold text-orange-900 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all cursor-pointer hover:border-orange-400"
                            >
                              <option value="Primary">📍 Primary Address</option>
                              <option value="Billing">💳 Billing Address</option>
                              <option value="Service">🔧 Service Address</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAddress(index)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all hover:scale-110"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={address.street || ''}
                            onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-white border-2 ${
                              errors[`address_${index}_street`] ? 'border-red-300' : 'border-orange-200 focus:border-orange-500'
                            } rounded-lg text-sm focus:ring-4 focus:ring-orange-100 transition-all`}
                            placeholder="Street Address *"
                          />
                          
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={address.city || ''}
                              onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                              className={`px-4 py-2.5 bg-white border-2 ${
                                errors[`address_${index}_city`] ? 'border-red-300' : 'border-orange-200 focus:border-orange-500'
                              } rounded-lg text-sm focus:ring-4 focus:ring-orange-100 transition-all`}
                              placeholder="City *"
                            />
                            <input
                              type="text"
                              value={address.state || ''}
                              onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                              className={`px-4 py-2.5 bg-white border-2 ${
                                errors[`address_${index}_state`] ? 'border-red-300' : 'border-orange-200 focus:border-orange-500'
                              } rounded-lg text-sm focus:ring-4 focus:ring-orange-100 transition-all`}
                              placeholder="State *"
                            />
                            <input
                              type="text"
                              value={address.zipCode || ''}
                              onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                              className={`px-4 py-2.5 bg-white border-2 ${
                                errors[`address_${index}_zipCode`] ? 'border-red-300' : 'border-orange-200 focus:border-orange-500'
                              } rounded-lg text-sm focus:ring-4 focus:ring-orange-100 transition-all`}
                              placeholder="ZIP *"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formData.addresses.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="w-full p-4 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                      >
                        <div className="flex items-center justify-center text-orange-600 group-hover:text-orange-700">
                          <PlusIcon className="h-5 w-5 mr-2" />
                          <span className="font-semibold">Add Another Address</span>
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {/* End of Left Column */}

        </div>
      </div>
    </div>
  );
}
