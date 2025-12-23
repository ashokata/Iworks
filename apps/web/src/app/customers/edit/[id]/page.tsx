'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { customerService, Customer } from '@/services/customerService';
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

// Map database address type to frontend address type
const mapDbTypeToAddressType = (dbType: string | undefined): AddressType => {
  if (!dbType) return 'Primary';
  const typeMap: Record<string, AddressType> = {
    'PRIMARY': 'Primary',
    'SERVICE': 'Service',
    'BILLING': 'Billing',
  };
  return typeMap[dbType] || 'Primary';
};

type FormCustomerAddress = {
  id: string;
  addressType?: AddressType;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country?: string;
  isNew?: boolean; // Flag to track newly added addresses (not yet saved to DB)
};

// Generate a proper UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

type FormData = {
  firstName: string;
  lastName: string;
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR';
  email: string;
  mobilePhone: string;
  homePhone: string;
  workPhone: string;
  companyName: string;
  jobTitle: string;
  preferredContactMethod: 'SMS' | 'EMAIL' | 'VOICE' | 'PUSH' | 'IN_APP';
  notificationsEnabled: boolean;
  isContractor: boolean;
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
    firstName: '',
    lastName: '',
    type: 'RESIDENTIAL',
    email: '',
    mobilePhone: '',
    homePhone: '',
    workPhone: '',
    companyName: '',
    jobTitle: '',
    preferredContactMethod: 'SMS',
    notificationsEnabled: false,
    isContractor: false,
    notes: '',
    addresses: [],
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');
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

  // Debounced email validation (only if email changed from original)
  useEffect(() => {
    const validateEmail = async () => {
      // Clear email error if email is empty or being edited
      if (!formData.email) {
        setErrors(prev => {
          if (prev.email) {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          }
          return prev;
        });
        return;
      }

      // Skip if email hasn't changed from original
      if (formData.email === originalEmail) {
        setErrors(prev => {
          if (prev.email) {
            const newErrors = { ...prev };
            delete newErrors.email;
            return newErrors;
          }
          return prev;
        });
        return;
      }

      // Check format first
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        return; // Skip API call if format is invalid
      }

      setIsCheckingEmail(true);
      try {
        const exists = await customerService.checkEmailExists(formData.email);
        if (exists) {
          setErrors(prev => ({
            ...prev,
            email: 'A customer with this email already exists'
          }));
        } else {
          // Clear email error if it exists
          setErrors(prev => {
            if (prev.email) {
              const newErrors = { ...prev };
              delete newErrors.email;
              return newErrors;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    // Debounce the validation by 500ms
    const timeoutId = setTimeout(validateEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email, originalEmail]);

  // Validate mobile phone when preferred contact method changes
  useEffect(() => {
    if ((formData.preferredContactMethod === 'SMS' || formData.preferredContactMethod === 'VOICE') && !formData.mobilePhone.trim()) {
      setErrors(prev => ({ ...prev, mobilePhone: 'Mobile number is required for SMS or Phone contact' }));
    } else {
      // Clear mobile error if contact method changed to EMAIL or mobile is filled
      setErrors(prev => {
        if (prev.mobilePhone) {
          const newErrors = { ...prev };
          delete newErrors.mobilePhone;
          return newErrors;
        }
        return prev;
      });
    }
  }, [formData.preferredContactMethod, formData.mobilePhone]);

  // Fetch customer data - always refetch to get latest addresses
  const { data: customer, isLoading, isError, error, refetch, dataUpdatedAt, isFetching } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId),
    enabled: !!customerId && isAuthenticated,
    staleTime: 0, // Always consider data stale to refetch
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Populate form when customer data is available (including from cache)
  useEffect(() => {
    if (customer) {
      setOriginalEmail(customer.email || '');
      setFormData({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        type: (customer.type?.toUpperCase() || 'RESIDENTIAL') as 'RESIDENTIAL' | 'COMMERCIAL' | 'CONTRACTOR',
        email: customer.email || '',
        mobilePhone: customer.mobilePhone || '',
        homePhone: customer.homePhone || '',
        workPhone: customer.workPhone || '',
        companyName: customer.companyName || '',
        jobTitle: (customer.customFields as any)?.jobTitle || '',
        preferredContactMethod: (customer.preferredContactMethod || 'SMS') as 'SMS' | 'EMAIL' | 'VOICE' | 'PUSH' | 'IN_APP',
        notificationsEnabled: customer.notificationsEnabled ?? false,
        isContractor: (customer.customFields as any)?.isContractor ?? false,
        notes: customer.notes || '',
        addresses: (customer.addresses || []).map((addr: any) => ({
          id: addr.id,
          addressType: addr.addressType || mapDbTypeToAddressType(addr.type) || 'Primary',
          street: addr.street || '',
          street2: addr.streetLine2 || addr.street2 || '',
          city: addr.city || '',
          state: addr.state || '',
          zipCode: addr.zipCode || addr.zip || '',
          county: addr.county || '',
          country: addr.country || 'US',
          isNew: false,
        })),
        tags: (customer.tags || []).map((tag: any) => typeof tag === 'string' ? tag : tag.name || ''),
      });
    }
  }, [customer]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited (except for email - let async validation handle it)
    if (errors[name] && name !== 'email') {
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
          id: generateUUID(), // Proper UUID for the new address
          addressType: defaultType,
          street: '',
          city: '',
          state: '',
          zipCode: '',
          isNew: true, // Flag to indicate this is a new address not yet in DB
        }
      ]
    }));
  };

  const handleRemoveAddress = (index: number) => {
    const addressToRemove = formData.addresses[index];
    const isPrimary = addressToRemove.addressType === 'Primary';
    const isLastAddress = formData.addresses.length === 1;
    const isBilling = addressToRemove.addressType === 'Billing';
    
    // Count billing addresses
    const billingAddresses = formData.addresses.filter(addr => addr.addressType === 'Billing');
    const isLastBillingAddress = isBilling && billingAddresses.length === 1;
    
    // Prevent deletion of the last address
    if (isLastAddress) {
      setToast({
        message: 'Cannot delete the last address. Every customer must have at least one primary address.',
        type: 'error'
      });
      return;
    }
    
    // Prevent deletion of the last billing address
    if (isLastBillingAddress) {
      setToast({
        message: 'Cannot delete the last billing address. Every customer must have at least one billing address.',
        type: 'error'
      });
      return;
    }
    
    // Prevent deletion of primary address if it's not being replaced
    if (isPrimary) {
      setToast({
        message: 'Cannot delete the primary address. Please designate another address as primary first.',
        type: 'error'
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const handleAddressChange = (index: number, field: keyof FormCustomerAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const handleAddressTypeChange = (index: number, newType: AddressType) => {
    // If changing to Primary, unset other primary addresses
    if (newType === 'Primary') {
      const hasPrimary = formData.addresses.some((addr, i) => 
        i !== index && addr.addressType === 'Primary'
      );
      
      if (hasPrimary) {
        setToast({
          message: 'Only one primary address is allowed. The previous primary address will be changed to Service.',
          type: 'success'
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => {
        if (i === index) {
          // Update the selected address
          return { 
            ...addr, 
            addressType: newType
          };
        } else if (newType === 'Primary' && addr.addressType === 'Primary') {
          // If setting a new primary, change existing primary to Service
          return {
            ...addr,
            addressType: 'Service'
          };
        }
        return addr;
      })
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 3) {
      newErrors.firstName = 'First name must be at least 3 characters';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 3) {
      newErrors.lastName = 'Last name must be at least 3 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Mobile phone validation (required if preferred contact method is SMS or VOICE)
    if ((formData.preferredContactMethod === 'SMS' || formData.preferredContactMethod === 'VOICE')) {
      if (!formData.mobilePhone.trim()) {
        newErrors.mobilePhone = 'Mobile number is required for SMS or Phone contact';
      }
    }
    
    // Validate primary address requirement
    const primaryAddresses = formData.addresses.filter(addr => addr.addressType === 'Primary');
    
    // Must have at least one address
    if (formData.addresses.length === 0) {
      newErrors.addresses = 'At least one primary address is required';
      setToast({
        message: 'Every customer must have at least one primary address.',
        type: 'error'
      });
    }
    
    // Must have exactly one primary address
    if (primaryAddresses.length === 0) {
      newErrors.addresses = 'A primary address is required for every customer';
      setToast({
        message: 'Please designate one address as the primary address.',
        type: 'error'
      });
    } else if (primaryAddresses.length > 1) {
      newErrors.addresses = 'Only one primary address is allowed per customer';
      setToast({
        message: 'Only one primary address is allowed. Please designate only one address as primary.',
        type: 'error'
      });
    }
    
    // Validate billing address requirement
    const billingAddresses = formData.addresses.filter(addr => addr.addressType === 'Billing');
    
    if (billingAddresses.length === 0) {
      newErrors.addresses = 'At least one billing address is required';
      setToast({
        message: 'Every customer must have at least one billing address.',
        type: 'error'
      });
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
          firstName: formData.firstName,
          lastName: formData.lastName,
          type: formData.type,
          email: formData.email,
          mobilePhone: formData.mobilePhone,
          homePhone: formData.homePhone,
          workPhone: formData.workPhone,
          companyName: formData.companyName,
          jobTitle: formData.jobTitle,
          preferredContactMethod: formData.preferredContactMethod,
          notificationsEnabled: formData.notificationsEnabled,
          isContractor: formData.isContractor,
          notes: formData.notes
        };
        
        // Update customer
        await customerService.updateCustomer(customerId, customerUpdate);
        
        // Handle address updates
        const existingAddresses = customer.addresses || [];
        const currentAddresses = formData.addresses;
        
        // Delete removed addresses
        for (const existingAddr of existingAddresses) {
          const stillExists = currentAddresses.find(addr => addr.id === existingAddr.id);
          if (!stillExists) {
            try {
              await customerService.deleteCustomerAddress(customerId, String(existingAddr.id));
            } catch (err: any) {
              console.error('Failed to delete address:', err);
              const errorMsg = err?.response?.data?.error || err?.message || 'Failed to delete address';
              setToast({
                message: errorMsg,
                type: 'error'
              });
              setIsSaving(false);
              return; // Stop the update process
            }
          }
        }
        
        // Update existing addresses or create new ones
        for (const addr of currentAddresses) {
          const addressPayload = {
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zip: addr.zipCode, // Map zipCode to zip for backend
            street2: addr.street2,
            county: addr.county,
            country: addr.country || 'US',
            addressType: addr.addressType
          };
          
          if (addr.isNew) {
            // Create new address (isNew flag indicates it hasn't been saved to DB yet)
            try {
              console.log('[Address] Creating new address:', addressPayload);
              await customerService.addCustomerAddress(customerId, addressPayload);
            } catch (err: any) {
              console.error('[Address] Failed to create address:', err);
              const errorMsg = err?.response?.data?.error || err?.message || 'Failed to create address';
              setToast({
                message: errorMsg,
                type: 'error'
              });
              setIsSaving(false);
              return; // Stop the update process
            }
          } else if (addr.id) {
            // Update existing address
            try {
              console.log('[Address] Updating address:', addr.id, addressPayload);
              await customerService.updateCustomerAddress(customerId, String(addr.id), addressPayload);
            } catch (err: any) {
              console.error('[Address] Failed to update address:', err);
              const errorMsg = err?.response?.data?.error || err?.message || 'Failed to update address';
              setToast({
                message: errorMsg,
                type: 'error'
              });
              setIsSaving(false);
              return; // Stop the update process
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
          addresses: formData.addresses, // Store as array, not wrapped in { data: }
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
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      
      // Check if it's a duplicate email error
      const errorMessage = error?.response?.data?.message || error?.message || error?.error;
      if (errorMessage && errorMessage.toLowerCase().includes('email already exists')) {
        setErrors({ email: errorMessage });
        setToast({
          message: errorMessage,
          type: 'error'
        });
      } else {
        setToast({
          message: 'Failed to update customer. Please try again.',
          type: 'error'
        });
      }
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
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Customer'}
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
                        name="notificationsEnabled"
                        checked={formData.notificationsEnabled}
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
                        name="isContractor"
                        checked={formData.isContractor}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={() => {
                        if (!formData.firstName.trim()) {
                          setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
                        } else if (formData.firstName.trim().length < 3) {
                          setErrors(prev => ({ ...prev, firstName: 'First name must be at least 3 characters' }));
                        }
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                        errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center">
                        <span className="inline-block mr-1">⚠</span> {errors.firstName}
                      </p>
                    )}
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={() => {
                        if (!formData.lastName.trim()) {
                          setErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
                        } else if (formData.lastName.trim().length < 3) {
                          setErrors(prev => ({ ...prev, lastName: 'Last name must be at least 3 characters' }));
                        }
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                        errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center">
                        <span className="inline-block mr-1">⚠</span> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Customer Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'RESIDENTIAL' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'RESIDENTIAL'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'RESIDENTIAL' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${formData.type === 'RESIDENTIAL' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span className={`font-semibold text-sm ${formData.type === 'RESIDENTIAL' ? 'text-blue-700' : 'text-gray-700'}`}>
                          Residential
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'COMMERCIAL' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'COMMERCIAL'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'COMMERCIAL' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <BuildingOfficeIcon className={`h-5 w-5 ${formData.type === 'COMMERCIAL' ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <span className={`font-semibold text-sm ${formData.type === 'COMMERCIAL' ? 'text-purple-700' : 'text-gray-700'}`}>
                          Commercial
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'CONTRACTOR' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'CONTRACTOR'
                          ? 'border-orange-500 bg-orange-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'CONTRACTOR' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${formData.type === 'CONTRACTOR' ? 'text-orange-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className={`font-semibold text-sm ${formData.type === 'CONTRACTOR' ? 'text-orange-700' : 'text-gray-700'}`}>
                          Contractor
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
                    Preferred Contact Method
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredContactMethod: 'SMS' }))}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.preferredContactMethod === 'SMS'
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl">💬</span>
                        <span className={`font-semibold text-sm ${formData.preferredContactMethod === 'SMS' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          SMS
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredContactMethod: 'EMAIL' }))}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.preferredContactMethod === 'EMAIL'
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl">📧</span>
                        <span className={`font-semibold text-sm ${formData.preferredContactMethod === 'EMAIL' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          Email
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferredContactMethod: 'VOICE' }))}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.preferredContactMethod === 'VOICE'
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-xl">📞</span>
                        <span className={`font-semibold text-sm ${formData.preferredContactMethod === 'VOICE' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          Phone
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
                
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
                      className={`w-full pl-12 pr-12 py-3 bg-gray-50 border-2 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100`}
                      placeholder="john.doe@example.com"
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
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
                      📱 Mobile {(formData.preferredContactMethod === 'SMS' || formData.preferredContactMethod === 'VOICE') && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="mobilePhone"
                      value={formData.mobilePhone}
                      onChange={handleChange}
                      onBlur={() => {
                        if ((formData.preferredContactMethod === 'SMS' || formData.preferredContactMethod === 'VOICE') && !formData.mobilePhone.trim()) {
                          setErrors(prev => ({ ...prev, mobilePhone: 'Mobile number is required for SMS or Phone contact' }));
                        }
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                        errors.mobilePhone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.mobilePhone && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center">
                        <span className="inline-block mr-1">⚠</span> {errors.mobilePhone}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      🏠 Home
                    </label>
                    <input
                      type="text"
                      name="homePhone"
                      value={formData.homePhone}
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
                      name="workPhone"
                      value={formData.workPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information Card - Conditional */}
            {formData.type === 'COMMERCIAL' && (
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
                        name="companyName"
                        value={formData.companyName}
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
                        name="jobTitle"
                        value={formData.jobTitle}
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
                      <p className="text-xs text-amber-100">Primary address required • Multiple addresses allowed</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                      {formData.addresses.length}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Info banner about primary addresses */}
                {formData.addresses.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-3">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <span className="font-semibold">Required:</span> Every customer must have exactly one primary address. If you select a new primary address, the previous one will automatically be changed to a Service address.
                    </div>
                  </div>
                )}
                
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
                          <div className="flex items-center space-x-3 flex-1">
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
                            {/* Primary Badge */}
                            {address.addressType === 'Primary' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Primary
                              </span>
                            )}
                            {/* Billing Badge */}
                            {address.addressType === 'Billing' && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                </svg>
                                Billing
                              </span>
                            )}
                          </div>
                          {/* Show different UI for primary vs non-primary addresses */}
                          {address.addressType === 'Primary' ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 italic">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <span>Protected</span>
                            </div>
                          ) : address.addressType === 'Billing' && formData.addresses.filter(addr => addr.addressType === 'Billing').length === 1 ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 italic">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <span>Protected</span>
                            </div>
                          ) : formData.addresses.length === 1 ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500 italic">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <span>Protected</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddress(index)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all hover:scale-110"
                              title="Delete address"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
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
