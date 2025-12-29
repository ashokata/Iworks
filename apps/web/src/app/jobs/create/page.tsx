'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jobService } from '@/services/jobService';
import { pricingService } from '@/services/pricingService';
import { CreateJobRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  MapPinIcon, 
  PlusIcon, 
  CheckIcon,
  TagIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface LineItem {
  id: string;
  type: 'service' | 'material';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function CreateJobPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  // Job basic info - Required fields
  const [jobTitle, setJobTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Scheduled' | 'In_Progress' | 'Completed' | 'Canceled'>('Scheduled');
  
  // Scheduling fields
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [arrivalWindowStart, setArrivalWindowStart] = useState('');
  const [arrivalWindowEnd, setArrivalWindowEnd] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState(60); // default 60 minutes
  
  // Optional fields
  const [jobTypeId, setJobTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]); // Array of employee IDs
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  
  // Financial fields (for pricing, not job)
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [county, setCounty] = useState('');
  
  // UI state
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

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

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      // Create the job first
      const createdJob = await jobService.createJob(jobData as any);
      
      // Create pricing record if there are line items
      if (lineItems.length > 0 && subtotal > 0) {
        try {
          console.log('[Job Create] ========== CREATING PRICING ==========');
          console.log('[Job Create] Job ID:', createdJob.id);
          console.log('[Job Create] Input values:', { subtotal, discount, taxRate, county });
          
          // Use calculatePricing to get proper tax and total amounts
          const calculatedPricing = pricingService.calculatePricing(subtotal, discount, taxRate);
          console.log('[Job Create] Calculated pricing:', calculatedPricing);
          
          const pricingData = {
            subTotal: calculatedPricing.subTotal,
            discount: calculatedPricing.discount,
            taxRate: calculatedPricing.taxRate,
            taxAmount: calculatedPricing.taxAmount,
            total: calculatedPricing.total,
            county: county || undefined,
            jobId: createdJob.id,
          };
          
          console.log('[Job Create] Frontend pricing data object:', JSON.stringify(pricingData, null, 2));
          const pricing = await pricingService.createPricing(pricingData as any);
          console.log('[Job Create] Pricing created successfully:', pricing.id);
        } catch (pricingError: any) {
          console.error('[Job Create] Failed to create pricing:', pricingError);
          // Don't fail the whole operation if pricing fails
          alert('Job created but pricing creation failed. You can add pricing later.');
        }
      }
      
      return createdJob;
    },
    onSuccess: (createdJob) => {
      console.log('[Job Create] Job created successfully:', createdJob);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      router.push('/jobs');
    },
    onError: (error: any) => {
      console.error('[Job Create] Failed to create job:', error);
      alert(`Failed to create job: ${error?.message || 'Unknown error'}`);
    },
  });

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountedSubtotal = subtotal - discount;
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + taxAmount;

  const handleAddLineItem = (type: 'service' | 'material') => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      type,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setLineItems([...lineItems, newItem]);
    if (type === 'service') setShowAddService(false);
    if (type === 'material') setShowAddMaterial(false);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      alert('Cannot create jobs while offline. Please check your connection.');
      return;
    }

    // Validation
    const newErrors: Record<string, string> = {};
    if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!scheduledStart) newErrors.scheduledStart = 'Scheduled start time is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Map line items to JobLineItem format
    const mappedLineItems = lineItems.map(item => ({
      itemType: item.type === 'service' ? 'Service' : 'Product' as 'Service' | 'Product',
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    // Map priority to backend enum format
    const priorityMap: Record<string, string> = {
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
      'Critical': 'URGENT'
    };

    // Use test UUIDs if fields are empty (for development/testing)
    const testCustomerId = '00000000-0000-0000-0000-000000000001';
    const testAddressId = '00000000-0000-0000-0000-000000000002';

    // Prepare job data according to Prisma schema
    const jobData: any = {
      title: jobTitle,
      // Use actual values if provided, otherwise use test UUIDs
      customerId: customerId.trim() || testCustomerId,
      addressId: addressId.trim() || testAddressId,
      jobTypeId: jobTypeId || undefined,
      status,
      priority: priorityMap[priority] || 'MEDIUM',
      source: 'MANUAL',
      description: description || undefined,
      internalNotes: internalNotes || undefined,
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : new Date().toISOString(),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      arrivalWindowStart: arrivalWindowStart ? new Date(arrivalWindowStart).toISOString() : undefined,
      arrivalWindowEnd: arrivalWindowEnd ? new Date(arrivalWindowEnd).toISOString() : undefined,
      estimatedDuration: estimatedDuration,
      lineItems: mappedLineItems.length > 0 ? mappedLineItems : undefined,
    };

    console.log('[Job Create] Submitting job data:', jobData);
    console.log('[Job Create] Line items:', mappedLineItems.length, 'items');
    if (mappedLineItems.length > 0) {
      console.log('[Job Create] Services:', mappedLineItems.filter(i => i.itemType === 'Service').length);
      console.log('[Job Create] Products:', mappedLineItems.filter(i => i.itemType === 'Product').length);
    }
    createJobMutation.mutate(jobData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/jobs')}
              className="text-white hover:bg-white/10 rounded-lg px-3 py-2 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div className="h-8 w-px bg-white/20"></div>
            <h1 className="text-2xl font-bold text-white">New Job</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
              status === 'In_Progress' ? 'bg-yellow-100 text-yellow-800' :
              status === 'Completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status === 'In_Progress' ? 'In Progress' : status === 'Canceled' ? 'Cancelled' : status}
            </div>
            <button
              onClick={handleSubmit}
              disabled={createJobMutation.isPending}
              className="inline-flex items-center px-6 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 hover:bg-gray-50 shadow-md hover:shadow-lg"
            >
              {createJobMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8 pb-16">
            {/* Job Title & Basic Info Card */}
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-blue-100 p-8">
              <h2 className="text-xl font-bold text-[#1e3a8a] mb-6 pb-4 border-b border-blue-200">Job Information</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#1e3a8a] mb-2">
                  Job Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all placeholder:text-gray-400"
                  placeholder="Enter job title"
                />
                {errors.jobTitle && <p className="text-sm text-red-600 mt-2">{errors.jobTitle}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Customer</label>
                  <input
                    type="text"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                    placeholder="Select customer"
                  />
                  {errors.customerId && <p className="text-xs text-red-600 mt-1">{errors.customerId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Service Address</label>
                  <input
                    type="text"
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                    placeholder="Select address"
                  />
                  {errors.addressId && <p className="text-xs text-red-600 mt-1">{errors.addressId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Job Type</label>
                  <select
                    value={jobTypeId}
                    onChange={(e) => setJobTypeId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  >
                    <option value="">Select job type</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="installation">Installation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">
                    Scheduled Start <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  />
                  {errors.scheduledStart && <p className="text-xs text-red-600 mt-1">{errors.scheduledStart}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Scheduled End</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Arrival Window Start</label>
                  <input
                    type="datetime-local"
                    value={arrivalWindowStart}
                    onChange={(e) => setArrivalWindowStart(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Arrival Window End</label>
                  <input
                    type="datetime-local"
                    value={arrivalWindowEnd}
                    onChange={(e) => setArrivalWindowEnd(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Est. Duration (min)</label>
                  <input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                    rows={3}
                    placeholder="Job description..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#1e3a8a] mb-2">Internal Notes</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                    rows={3}
                    placeholder="Internal notes (not visible to customer)..."
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#1e3a8a]">Line items</h3>
              </div>

              {/* Services */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-[#1e3a8a]">Services</h4>
                  <button className="text-sm font-medium text-[#1e3a8a] hover:text-blue-700">SERVICE PRICE BOOK</button>
                </div>
                
                {lineItems.filter(item => item.type === 'service').map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3 border border-blue-200">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                          placeholder="Service name"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                          rows={2}
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit price</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-3 flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                          <p className="text-base font-semibold text-gray-900">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1.5 hover:bg-gray-200 rounded">
                            <PencilIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button onClick={() => removeLineItem(item.id)} className="p-1.5 hover:bg-gray-200 rounded">
                            <XMarkIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddLineItem('service')}
                  className="text-sm font-medium text-[#1e3a8a] hover:text-blue-700 flex items-center mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add service
                </button>
              </div>

              {/* Materials */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-[#1e3a8a]">Materials</h4>
                  <button className="text-sm font-medium text-[#1e3a8a] hover:text-blue-700">MATERIAL PRICE BOOK</button>
                </div>
                
                {lineItems.filter(item => item.type === 'material').map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 mb-3 border border-blue-200">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                          placeholder="Material name"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit price</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-3 flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                          <p className="text-base font-semibold text-gray-900">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeLineItem(item.id)} className="p-1.5 hover:bg-gray-200 rounded">
                          <XMarkIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddLineItem('material')}
                  className="text-sm font-medium text-[#1e3a8a] hover:text-blue-700 flex items-center mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add material
                </button>
              </div>

              {/* Totals */}
              <div className="border-t border-blue-200 pt-6 mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#1e3a8a] font-medium">Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-[#1e3a8a] font-medium">Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <span className="font-semibold text-red-600">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-3">
                    <span className="text-[#1e3a8a] font-medium">Tax rate (%)</span>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] placeholder:text-gray-400"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0%"
                    />
                  </div>
                  <span className="font-semibold text-gray-900">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">County</span>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded placeholder:text-gray-400"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
