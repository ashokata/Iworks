'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
  isSelected: boolean;
}

interface Option {
  id: string;
  name: string;
  description: string;
  isRecommended: boolean;
  discountType: 'NONE' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  lineItems: LineItem[];
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
    status: 'DRAFT' as const,
    taxRate: 7.5,
  });

  const [options, setOptions] = useState<Option[]>([
    {
      id: `option-${Date.now()}`,
      name: 'Option 1',
      description: '',
      isRecommended: true,
      discountType: 'NONE',
      discountValue: 0,
      lineItems: [],
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
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

  // Fetch customers
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAllCustomers(),
    enabled: isAuthenticated,
  });

  const selectedCustomer = customers?.find((c: Customer) => c.id === formData.customerId);

  // Get customer addresses (only SERVICE type addresses) + pending addresses
  const customerAddresses = [
    ...((selectedCustomer?.addresses as any)?.data || selectedCustomer?.addresses || [])
      .filter((addr: any) => addr.type?.toUpperCase() === 'SERVICE'),
    ...pendingAddresses
  ];

  useEffect(() => {
    console.log('[Estimates New] Customers data:', customers);
    console.log('[Estimates New] Customers count:', customers.length);
    console.log('[Estimates New] Loading customers:', isLoadingCustomers);
    console.log('[Estimates New] Selected customer:', selectedCustomer);
    console.log('[Estimates New] Customer addresses:', customerAddresses);
  }, [customers, isLoadingCustomers, selectedCustomer, customerAddresses]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Clear address when customer changes
  useEffect(() => {
    if (!formData.customerId) {
      setFormData(prev => ({ ...prev, addressId: '' }));
    }
  }, [formData.customerId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: `option-${Date.now()}`,
        name: `Option ${options.length + 1}`,
        description: '',
        isRecommended: false,
        discountType: 'NONE',
        discountValue: 0,
        lineItems: [],
      },
    ]);
  };

  const removeOption = (optionId: string) => {
    if (options.length === 1) {
      alert('You must have at least one option');
      return;
    }
    setOptions(options.filter((opt) => opt.id !== optionId));
  };

  const updateOption = (optionId: string, field: string, value: any) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    );
  };

  const addLineItem = (optionId: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              lineItems: [
                ...opt.lineItems,
                {
                  id: `item-${Date.now()}`,
                  type: 'SERVICE' as const,
                  name: '',
                  description: '',
                  quantity: 1,
                  unitPrice: 0,
                  unitCost: 0,
                  isTaxable: true,
                  isOptional: false,
                  isSelected: true,
                },
              ],
            }
          : opt
      )
    );
  };

  const removeLineItem = (optionId: string, itemId: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              lineItems: opt.lineItems.filter((item) => item.id !== itemId),
            }
          : opt
      )
    );
  };

  const updateLineItem = (
    optionId: string,
    itemId: string,
    field: string,
    value: any
  ) => {
    setOptions(
      options.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              lineItems: opt.lineItems.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : opt
      )
    );
  };

  const calculateOptionTotal = (option: Option) => {
    const subtotal = option.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    
    let discountAmount = 0;
    if (option.discountType === 'PERCENTAGE') {
      discountAmount = subtotal * (option.discountValue / 100);
    } else if (option.discountType === 'FIXED_AMOUNT') {
      discountAmount = option.discountValue;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxableAmount = option.lineItems
      .filter((item) => item.isTaxable)
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    
    const taxAmount = (taxableAmount - (taxableAmount / subtotal) * discountAmount) * (formData.taxRate / 100);
    const total = afterDiscount + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  };

  const calculateEstimateTotal = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let total = 0;

    options.forEach((option) => {
      const optionTotals = calculateOptionTotal(option);
      subtotal += optionTotals.subtotal;
      discountAmount += optionTotals.discountAmount;
      taxAmount += optionTotals.taxAmount;
      total += optionTotals.total;
    });

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setShowValidation(true);
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.addressId) newErrors.addressId = 'Address is required';
    
    // Check for duplicate option names
    const optionNames = options.map(opt => opt.name.trim().toLowerCase()).filter(name => name);
    const duplicateOptionNames = optionNames.filter((name, index) => optionNames.indexOf(name) !== index);
    if (duplicateOptionNames.length > 0) {
      newErrors.duplicateOptions = `Duplicate option names found: ${[...new Set(duplicateOptionNames)].join(', ')}`;
    }
    
    options.forEach((option, idx) => {
      if (!option.name) newErrors[`option-${idx}-name`] = 'Option name is required';
      if (option.lineItems.length === 0) {
        newErrors[`option-${idx}-items`] = 'At least one line item is required';
      }
      
      // Check for duplicate line item names within the same option
      const lineItemNames = option.lineItems.map(item => item.name.trim().toLowerCase()).filter(name => name);
      const duplicateLineItems = lineItemNames.filter((name, index) => lineItemNames.indexOf(name) !== index);
      if (duplicateLineItems.length > 0) {
        newErrors[`option-${idx}-duplicate-items`] = `Duplicate line items in ${option.name}: ${[...new Set(duplicateLineItems)].join(', ')}`;
      }
      
      option.lineItems.forEach((item, itemIdx) => {
        if (!item.name) newErrors[`item-${idx}-${itemIdx}-name`] = 'Item name is required';
      });
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: 'Please fix validation errors', type: 'error' });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Handle pending addresses first
      let finalAddressId = formData.addressId;
      
      if (finalAddressId.startsWith('pending-')) {
        const pendingAddr = pendingAddresses.find(addr => addr.id === finalAddressId);
        if (pendingAddr && selectedCustomer) {
          const createdAddress = await customerService.addAddress(
            selectedCustomer.id,
            pendingAddr.street,
            pendingAddr.city,
            pendingAddr.state,
            pendingAddr.zip,
            pendingAddr.type
          );
          finalAddressId = createdAddress.id;
        }
      }
      
      // Prepare estimate data
      const estimateData = {
        customerId: formData.customerId,
        addressId: finalAddressId,
        title: formData.title,
        message: formData.message || undefined,
        termsAndConditions: formData.termsAndConditions || undefined,
        validUntil: formData.validUntil || undefined,
        status: formData.status,
        taxRate: formData.taxRate,
        options: options.map((option, optionIndex) => ({
          name: option.name,
          description: option.description || undefined,
          isRecommended: option.isRecommended,
          discountType: option.discountType,
          discountValue: option.discountValue,
          sortOrder: optionIndex,
          lineItems: option.lineItems.map((item, itemIndex) => ({
            type: item.type,
            name: item.name,
            description: item.description || undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            isTaxable: item.isTaxable,
            isOptional: item.isOptional,
            isSelected: item.isSelected,
            sortOrder: itemIndex,
          })),
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

  const totals = calculateEstimateTotal();

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
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Estimate</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details to create a new estimate
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimate Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Kitchen Renovation"
                />
                {showValidation && errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer * {isLoadingCustomers && <span className="text-xs text-gray-500">(Loading...)</span>}
                </label>
                <SearchableSelect
                  options={customers?.map((customer: Customer) => ({
                    value: customer.id,
                    label: `${customer.firstName || ''} ${customer.lastName || ''} (${customer.email || customer.customerNumber || ''})`
                  })) || []}
                  value={formData.customerId}
                  onChange={(value) => setFormData({ ...formData, customerId: value, addressId: '' })}
                  placeholder={isLoadingCustomers ? "Loading customers..." : "-- Select a customer --"}
                  disabled={isLoadingCustomers}
                />
                {showValidation && errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
                {!isLoadingCustomers && customers.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">No customers found. Please add customers first.</p>
                )}
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

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Address *
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
                  onChange={(value) => {
                    if (value === '__add_new__') {
                      setShowAddressModal(true);
                      return;
                    }
                    setFormData({ ...formData, addressId: value });
                  }}
                  disabled={!formData.customerId || !selectedCustomer}
                  placeholder={
                    !formData.customerId 
                      ? "Select a customer first" 
                      : "-- Select an address --"
                  }
                />
                {showValidation && errors.addressId && <p className="mt-1 text-sm text-red-600">{errors.addressId}</p>}
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message / Description
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a message for the customer"
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms and Conditions
              </label>
              <textarea
                rows={3}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter terms and conditions"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Options</h2>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Option
              </button>
            </div>

            {/* Duplicate Options Error */}
            {showValidation && errors.duplicateOptions && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">{errors.duplicateOptions}</p>
              </div>
            )}

            {options.map((option, optionIdx) => {
              const optionTotals = calculateOptionTotal(option);
              
              return (
                <div key={option.id} className="bg-white shadow rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option Name *
                        </label>
                        <input
                          type="text"
                          value={option.name}
                          onChange={(e) => updateOption(option.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Standard Package"
                        />
                        {showValidation && errors[`option-${optionIdx}-name`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`option-${optionIdx}-name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={option.description}
                          onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief description"
                        />
                      </div>
                    </div>

                    {options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={option.isRecommended}
                        onChange={(e) => updateOption(option.id, 'isRecommended', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Recommended Option
                      </label>
                    </div>

                    <div>
                      <select
                        value={option.discountType}
                        onChange={(e) => updateOption(option.id, 'discountType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="NONE">No Discount</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED_AMOUNT">Fixed Amount</option>
                      </select>
                    </div>

                    {option.discountType !== 'NONE' && (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={option.discountValue}
                          onChange={(e) => updateOption(option.id, 'discountValue', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          placeholder={option.discountType === 'PERCENTAGE' ? 'Discount %' : 'Discount $'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
                      <button
                        type="button"
                        onClick={() => addLineItem(option.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Item
                      </button>
                    </div>

                    {showValidation && errors[`option-${optionIdx}-items`] && (
                      <p className="mb-2 text-sm text-red-600">{errors[`option-${optionIdx}-items`]}</p>
                    )}

                    {/* Duplicate Line Items Error */}
                    {showValidation && errors[`option-${optionIdx}-duplicate-items`] && (
                      <div className="mb-2 bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-600 font-medium">{errors[`option-${optionIdx}-duplicate-items`]}</p>
                      </div>
                    )}

                    {option.lineItems.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-500">No items added. Click "Add Item" to start.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {option.lineItems.map((item, itemIdx) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-12 gap-3">
                              {/* Type */}
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={item.type}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'type', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="SERVICE">Service</option>
                                  <option value="MATERIAL">Material</option>
                                  <option value="LABOR">Labor</option>
                                  <option value="EQUIPMENT">Equipment</option>
                                  <option value="OTHER">Other</option>
                                </select>
                              </div>

                              {/* Name */}
                              <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'name', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="Item name"
                                />
                              </div>

                              {/* Description */}
                              <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="Description"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Unit Price */}
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="0.00"
                                />
                              </div>

                              {/* Delete */}
                              <div className="col-span-1 flex items-end justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeLineItem(option.id, item.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="mt-2 flex items-center space-x-4">
                              <label className="flex items-center text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={item.isTaxable}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'isTaxable', e.target.checked)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1"
                                />
                                Taxable
                              </label>
                              <label className="flex items-center text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={item.isOptional}
                                  onChange={(e) => updateLineItem(option.id, item.id, 'isOptional', e.target.checked)}
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1"
                                />
                                Optional
                              </label>
                              <span className="text-xs font-medium text-gray-700">
                                Total: ${(item.quantity * item.unitPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Option Totals */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-end space-x-8 text-sm">
                      <div className="space-y-1 text-right">
                        <p className="text-gray-600">Subtotal:</p>
                        <p className="text-gray-600">Discount:</p>
                        <p className="text-gray-600">Tax:</p>
                        <p className="text-lg font-semibold text-gray-900">Total:</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-gray-900">${optionTotals.subtotal.toFixed(2)}</p>
                        <p className="text-red-600">-${optionTotals.discountAmount.toFixed(2)}</p>
                        <p className="text-gray-900">${optionTotals.taxAmount.toFixed(2)}</p>
                        <p className="text-lg font-semibold text-blue-600">${optionTotals.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estimate Total */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimate Total</h3>
            <div className="flex justify-end space-x-12">
              <div className="space-y-2 text-right">
                <p className="text-gray-700">Subtotal:</p>
                <p className="text-gray-700">Total Discount:</p>
                <p className="text-gray-700">Total Tax:</p>
                <p className="text-2xl font-bold text-gray-900">Grand Total:</p>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-gray-900 font-medium">${totals.subtotal.toFixed(2)}</p>
                <p className="text-red-600 font-medium">-${totals.discountAmount.toFixed(2)}</p>
                <p className="text-gray-900 font-medium">${totals.taxAmount.toFixed(2)}</p>
                <p className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  );
}
