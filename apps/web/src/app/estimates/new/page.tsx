'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService, Customer } from '@/services/customerService';
import { estimateService } from '@/services/estimateService';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface LineItem {
  id: string;
  type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'OTHER';
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  isTaxable: boolean;
  isOptional: boolean;
}

export default function NewEstimatePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    addressId: '',
    message: '',
    termsAndConditions: '',
    validUntil: '',
    customerCanApprove: false,
    status: 'DRAFT' as const,
    taxRate: 7.5,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [useSameAsPrimary, setUseSameAsPrimary] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: isAuthenticated,
  });

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
    type: string;
  }>>([]);

  const selectedCustomer = customers.find((c: Customer) => c.id === formData.customerId);
  const customerAddresses = [
    ...((selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [])
      .filter((addr: any) => addr.type?.toUpperCase() === 'SERVICE'),
    ...pendingAddresses
  ];

  useEffect(() => {
    if (!formData.customerId) {
      setFormData(prev => ({ ...prev, addressId: '' }));
      setUseSameAsPrimary(false);
    }
  }, [formData.customerId]);

  // Handle useSameAsPrimary checkbox change
  useEffect(() => {
    if (useSameAsPrimary && selectedCustomer) {
      const addresses = (selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [];
      const primaryAddress = addresses.find((addr: any) => addr.type?.toUpperCase() === 'PRIMARY');
      
      if (primaryAddress) {
        // Check if a SERVICE address already exists with same details
        const normalizedPrimary = {
          street: (primaryAddress.street || '').trim().toLowerCase(),
          city: (primaryAddress.city || '').trim().toLowerCase(),
          state: (primaryAddress.state || '').trim().toLowerCase(),
          zip: (primaryAddress.zip || '').trim()
        };
        
        const existingServiceAddress = addresses.find((addr: any) => {
          if (addr.type?.toUpperCase() !== 'SERVICE') return false;
          
          const normalizedAddr = {
            street: (addr.street || '').trim().toLowerCase(),
            city: (addr.city || '').trim().toLowerCase(),
            state: (addr.state || '').trim().toLowerCase(),
            zip: (addr.zip || '').trim()
          };
          
          return normalizedAddr.street === normalizedPrimary.street &&
            normalizedAddr.city === normalizedPrimary.city &&
            normalizedAddr.state === normalizedPrimary.state &&
            normalizedAddr.zip === normalizedPrimary.zip;
        });

        if (existingServiceAddress) {
          // Use existing SERVICE address
          setFormData(prev => ({ ...prev, addressId: existingServiceAddress.id }));
        } else {
          // Create a pending SERVICE address
          const newServiceAddress = {
            id: `pending-primary-${Date.now()}`,
            street: primaryAddress.street,
            city: primaryAddress.city,
            state: primaryAddress.state,
            zip: primaryAddress.zip,
            type: 'SERVICE' as const
          };
          setPendingAddresses(prev => {
            const filtered = prev.filter(addr => !addr.id.startsWith('pending-primary-'));
            return [...filtered, newServiceAddress];
          });
          setFormData(prev => ({ ...prev, addressId: newServiceAddress.id }));
        }
      }
    } else if (!useSameAsPrimary) {
      // Clear pending-primary addresses when unchecked
      setPendingAddresses(prev => prev.filter(addr => !addr.id.startsWith('pending-primary-')));
    }
  }, [useSameAsPrimary, selectedCustomer]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const addService = () => {
    setLineItems([
      ...lineItems,
      {
        id: `service-${Date.now()}`,
        type: 'SERVICE',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        isTaxable: true,
        isOptional: false,
      },
    ]);
  };

  const addMaterial = () => {
    setLineItems([
      ...lineItems,
      {
        id: `material-${Date.now()}`,
        type: 'MATERIAL',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        isTaxable: true,
        isOptional: false,
      },
    ]);
  };

  const addLabor = () => {
    setLineItems([
      ...lineItems,
      {
        id: `labor-${Date.now()}`,
        type: 'LABOR',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        isTaxable: true,
        isOptional: false,
      },
    ]);
  };

  const addEquipment = () => {
    setLineItems([
      ...lineItems,
      {
        id: `equipment-${Date.now()}`,
        type: 'EQUIPMENT',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        isTaxable: true,
        isOptional: false,
      },
    ]);
  };

  const addOther = () => {
    setLineItems([
      ...lineItems,
      {
        id: `other-${Date.now()}`,
        type: 'OTHER',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        isTaxable: true,
        isOptional: false,
      },
    ]);
  };

  const removeLineItem = (itemId: string) => {
    setLineItems(lineItems.filter((item) => item.id !== itemId));
  };

  const updateLineItem = (itemId: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTaxAmount = () => {
    const taxableAmount = lineItems
      .filter(item => item.isTaxable)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return taxableAmount * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setShowValidation(true);
    
    const newErrors: Record<string, string> = {};
    const emptyLineItems = lineItems.filter(item => !item.name || item.name.trim() === '');
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.addressId) newErrors.addressId = 'Service address is required';
    if (emptyLineItems.length > 0) {
      newErrors.lineItems = 'All line items must have a name';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: 'Please fix the validation errors', type: 'error' });
      return;
    }
    
    setErrors({});
    setIsSaving(true);
    
    try {
      let finalAddressId = formData.addressId;

      // Save any pending addresses first
      if (pendingAddresses.length > 0 && selectedCustomer) {
        console.log('[NewEstimate] Saving pending addresses for customer:', selectedCustomer.id);
        for (const pendingAddr of pendingAddresses) {
          const { id, ...addressData } = pendingAddr;
          console.log('[NewEstimate] Saving address:', addressData);
          const createdAddress = await customerService.addAddress(selectedCustomer.id, {
            ...addressData,
            type: addressData.type as any
          });
          console.log('[NewEstimate] Address created with ID:', createdAddress.id);
          
          // If this was the selected address, update the ID to the real one
          if (finalAddressId === id) {
            console.log('[NewEstimate] Updating finalAddressId from', id, 'to', createdAddress.id);
            finalAddressId = createdAddress.id;
          }
        }
        
        // Invalidate customers cache so next time we have fresh data
        console.log('[NewEstimate] Invalidating customers cache');
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      // Prepare estimate data
      const estimateData = {
        customerId: formData.customerId,
        addressId: finalAddressId,
        title: formData.title,
        message: formData.message || undefined,
        termsAndConditions: formData.termsAndConditions || undefined,
        validUntil: formData.validUntil || undefined,
        customerCanApprove: formData.customerCanApprove,
        useSameAsPrimary: useSameAsPrimary,
        status: formData.status,
        taxRate: formData.taxRate,
        lineItems: lineItems.map((item, index) => ({
          type: item.type,
          name: item.name,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          isTaxable: item.isTaxable,
          isOptional: item.isOptional,
          sortOrder: index,
        })),
      };
      
      console.log('[NewEstimate] Creating estimate:', estimateData);
      
      const createdEstimate = await estimateService.create(estimateData);
      
      console.log('[NewEstimate] Created estimate:', createdEstimate);
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      
      setToast({ message: 'Estimate created successfully!', type: 'success' });
      
      // Redirect to estimate details page after a short delay
      setTimeout(() => {
        router.push(`/estimates/${createdEstimate.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('[NewEstimate] Error creating estimate:', error);
      setToast({ 
        message: error.message || 'Failed to create estimate', 
        type: 'error' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const services = lineItems.filter(item => item.type === 'SERVICE');
  const materials = lineItems.filter(item => item.type === 'MATERIAL');
  const labor = lineItems.filter(item => item.type === 'LABOR');
  const equipment = lineItems.filter(item => item.type === 'EQUIPMENT');
  const others = lineItems.filter(item => item.type === 'OTHER');
  const subtotal = calculateSubtotal();
  const taxAmount = calculateTaxAmount();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-white/20"></div>
            <h1 className="text-2xl font-bold text-white">New Estimate</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              formData.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
              formData.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
              formData.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {formData.status.charAt(0) + formData.status.slice(1).toLowerCase()}
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
                  Creating...
                </>
              ) : (
                'Create Estimate'
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
      
      <div className="flex">
        {/* Main Content Area */}
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
                      Estimate Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all placeholder:text-gray-400"
                      placeholder="e.g., HVAC Installation"
                    />
                    {showValidation && errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  {/* Customer */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                      Customer <span className="text-red-600">*</span>
                    </label>
                    <SearchableSelect
                      options={customers.map((c: Customer) => ({
                        value: c.id,
                        label: `${c.firstName} ${c.lastName} (${c.customerNumber})`,
                      }))}
                      value={formData.customerId}
                      onChange={(value) => setFormData({ ...formData, customerId: value, addressId: '' })}
                      placeholder="Select customer"
                      disabled={customersLoading}
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
                        <div className="text-gray-700">
                          <span className="font-semibold">Customer #:</span> {selectedCustomer.customerNumber}
                        </div>
                      </div>
                    </div>
                  )}

              {/* Use Same as Primary Address */}
              <div>
                <label className="inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={useSameAsPrimary}
                    onChange={(e) => setUseSameAsPrimary(e.target.checked)}
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
                  const addresses = selectedCustomer?.addresses || [];
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

              {/* Customer Can Approve */}
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.customerCanApprove}
                    onChange={(e) => setFormData({ ...formData, customerCanApprove: e.target.checked })}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    Customer Can Approve
                  </span>
                </label>
              </div>

              {/* Service Address */}
              <div>
                <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                  Service Address <span className="text-red-600">*</span>
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
                  value={formData.addressId}
                  disabled={!formData.customerId || useSameAsPrimary}
                  onChange={(value) => {
                    if (value === '__add_new__') {
                      setShowAddressModal(true);
                      return;
                    }
                    setFormData({ ...formData, addressId: value });
                  }}
                  placeholder={selectedCustomer ? "-- Select service address --" : "Select a customer first"}
                />
                {showValidation && errors.addressId && <p className="mt-1 text-sm text-red-600">{errors.addressId}</p>}
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                Message / Description
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                placeholder="Add a message for the customer"
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                Terms and Conditions
              </label>
              <textarea
                rows={3}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                placeholder="Enter terms and conditions"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8">
            <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Line Items</h2>

            {showValidation && errors.lineItems && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">{errors.lineItems}</p>
              </div>
            )}

            {/* Services Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1e3a8a]">Services</h3>
                <button
                  type="button"
                  onClick={addService}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1e3a8a] hover:bg-[#1e40af]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Service
                </button>
              </div>

              {services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No services added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((item) => (
                    <div key={item.id} className="border border-blue-100 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#1e3a8a]">Service</h4>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Service Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="e.g., HVAC System Installation"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              &nbsp;
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isTaxable}
                                onChange={(e) => updateLineItem(item.id, 'isTaxable', e.target.checked)}
                                className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                              />
                              <span className="ml-2 text-xs font-semibold text-[#1e3a8a]">
                                Taxable
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="Add description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materials Section */}
            <div className="space-y-4 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1e3a8a]">Materials</h3>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1e3a8a] hover:bg-[#1e40af]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Material
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No materials added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.map((item) => (
                    <div key={item.id} className="border border-blue-100 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#1e3a8a]">Material</h4>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Material Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="e.g., Copper Piping"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              &nbsp;
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isTaxable}
                                  onChange={(e) => updateLineItem(item.id, 'isTaxable', e.target.checked)}
                                  className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                                />
                                <span className="ml-2 text-xs font-semibold text-[#1e3a8a]">
                                  Taxable
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="Add description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Labor Section */}
            <div className="space-y-4 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1e3a8a]">Labor</h3>
                <button
                  type="button"
                  onClick={addLabor}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1e3a8a] hover:bg-[#1e40af]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Labor
                </button>
              </div>

              {labor.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No labor added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {labor.map((item) => (
                    <div key={item.id} className="border border-blue-100 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#1e3a8a]">Labor</h4>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Labor Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="e.g., Installation Labor"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Hours
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Rate per Hour ($)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              &nbsp;
                            </label>
                            <div className="w-full h-[42px] px-3 border border-gray-300 rounded-lg bg-white flex items-center">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isTaxable}
                                  onChange={(e) => updateLineItem(item.id, 'isTaxable', e.target.checked)}
                                  className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                                />
                                <span className="ml-2 text-sm text-[#1e3a8a]">
                                  Taxable
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="Add description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment Section */}
            <div className="space-y-4 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1e3a8a]">Equipment</h3>
                <button
                  type="button"
                  onClick={addEquipment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1e3a8a] hover:bg-[#1e40af]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Equipment
                </button>
              </div>

              {equipment.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No equipment added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {equipment.map((item) => (
                    <div key={item.id} className="border border-blue-100 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#1e3a8a]">Equipment</h4>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Equipment Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="e.g., Excavator Rental"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              &nbsp;
                            </label>
                            <div className="w-full h-[42px] px-3 border border-gray-300 rounded-lg bg-white flex items-center">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isTaxable}
                                  onChange={(e) => updateLineItem(item.id, 'isTaxable', e.target.checked)}
                                  className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                                />
                                <span className="ml-2 text-sm text-[#1e3a8a]">
                                  Taxable
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="Add description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Other Section */}
            <div className="space-y-4 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1e3a8a]">Other</h3>
                <button
                  type="button"
                  onClick={addOther}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#1e3a8a] hover:bg-[#1e40af]"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Other
                </button>
              </div>

              {others.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No other items added yet
                </div>
              ) : (
                <div className="space-y-4">
                  {others.map((item) => (
                    <div key={item.id} className="border border-blue-100 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="text-sm font-semibold text-[#1e3a8a]">Other</h4>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-5">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Item Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="e.g., Miscellaneous Fees"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Unit Price ($)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              &nbsp;
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isTaxable}
                                onChange={(e) => updateLineItem(item.id, 'isTaxable', e.target.checked)}
                                className="h-4 w-4 text-[#1e3a8a] border-gray-300 rounded focus:ring-[#1e3a8a]"
                              />
                              <span className="ml-2 text-xs font-semibold text-[#1e3a8a]">
                                Taxable
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#1e3a8a] mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder="Add description"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotal */}
            <div className="pt-6 border-t border-blue-200">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-[#1e3a8a]">Subtotal</span>
                <span className="font-bold text-[#1e3a8a]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                <span>Tax ({formData.taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-[#1e3a8a] mt-4 pt-4 border-t border-blue-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
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
                  Creating...
                </>
              ) : (
                'Create Estimate'
              )}
            </button>
          </div>
        </form>

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
                    
                    // Stage address locally with temporary ID
                    const stagedAddress = {
                      id: `pending-${Date.now()}`,
                      ...newAddress
                    };
                    
                    setPendingAddresses([...pendingAddresses, stagedAddress]);
                    
                    // Auto-select the new address
                    setFormData({ ...formData, addressId: stagedAddress.id });
                    
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
      </div>
      </div>
    </div>
  );
}


