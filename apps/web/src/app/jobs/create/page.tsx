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

  // Job basic info
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = useState<'Scheduled' | 'In_Progress' | 'Completed' | 'Canceled'>('Scheduled');
  
  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  
  // Additional fields
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [jobTags, setJobTags] = useState<string[]>([]);
  const [privateNotes, setPrivateNotes] = useState('');
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
    mutationFn: async (jobData: CreateJobRequest) => {
      // Create the job first
      const createdJob = await jobService.createJob(jobData);
      
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
          const pricing = await pricingService.createPricing(pricingData);
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
    if (!scheduledDate) newErrors.scheduledDate = 'Scheduled date is required';

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

    // Prepare job data according to OData schema
    const jobData: CreateJobRequest = {
      title: jobTitle,
      description: privateNotes || undefined,
      status,
      priority,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
      startDate: undefined,
      endDate: undefined,
      location: location || undefined,
      estimatedDuration: undefined, // Will be calculated from line items if needed
      eventAllDay: false,
      assignedTo: assignedTo || undefined,
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/jobs')}
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              New Job
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm rounded-full ${
              status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
              status === 'In_Progress' ? 'bg-yellow-100 text-yellow-800' :
              status === 'Completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status === 'In_Progress' ? 'In Progress' : status === 'Canceled' ? 'Cancelled' : status}
            </span>
            <Button onClick={handleSubmit} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Map/Location */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-gray-100 rounded-lg h-40 flex items-center justify-center mb-3 relative">
              <MapPinIcon className="h-12 w-12 text-gray-400" />
            </div>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center">
              <MapPinIcon className="h-4 w-4 mr-2" />
              LOCATION ON
            </button>
          </div>

          {/* Private Notes */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setActiveSection(activeSection === 'notes' ? null : 'notes')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Private notes</span>
              </div>
              <PlusIcon className="h-5 w-5 text-gray-400" />
            </button>
            {activeSection === 'notes' && (
              <div className="px-4 pb-4">
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                  placeholder="Add private notes..."
                />
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="border-b border-gray-200">
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center">
                <PaperClipIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Attachments</span>
              </div>
              <PlusIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Recurrence */}
          <div className="border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <ArrowPathIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Recurrence</span>
              </div>
              <PencilIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="px-4 pb-4 text-sm text-gray-600">
              <p>Every week on Friday</p>
              <p className="text-xs text-gray-500">Never ending</p>
            </div>
          </div>

          {/* Auto Invoice */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-600 mr-3" />
                <span className="font-medium text-gray-900">Auto invoice</span>
              </div>
              <PencilIcon className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-6">
            {/* Job Title & Basic Info */}
            <div className="mb-6">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="text-2xl font-semibold w-full border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-0 py-2"
                placeholder="Enter job title..."
              />
              {errors.jobTitle && <p className="text-sm text-red-600 mt-1">{errors.jobTitle}</p>}
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter location"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {errors.scheduledDate && <p className="text-xs text-red-600 mt-1">{errors.scheduledDate}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Assigned To *</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Technician name"
                  />
                  {errors.assignedTo && <p className="text-xs text-red-600 mt-1">{errors.assignedTo}</p>}
                </div>
              </div>
            </div>

            {/* Estimates Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Estimates</h3>
                <Button variant="outline" size="sm">
                  + ESTIMATE
                </Button>
              </div>
              <div className="bg-white rounded border border-gray-200 p-3 text-sm text-gray-600">
                No estimates created yet
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Line items</h3>
                <div className="flex space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Services</h4>
                  <button className="text-xs text-blue-600 hover:text-blue-700">SERVICE PRICE BOOK</button>
                </div>
                
                {lineItems.filter(item => item.type === 'service').map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Service name"
                        />
                        <textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1"
                          rows={2}
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Unit price</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div>
                          <label className="text-xs text-gray-500">Total</label>
                          <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <PencilIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          <button onClick={() => removeLineItem(item.id)} className="p-1 hover:bg-gray-200 rounded">
                            <XMarkIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddLineItem('service')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add service
                </button>
              </div>

              {/* Materials */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Materials</h4>
                  <button className="text-xs text-blue-600 hover:text-blue-700">MATERIAL PRICE BOOK</button>
                </div>
                
                {lineItems.filter(item => item.type === 'material').map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Material name"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Unit price</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div>
                          <label className="text-xs text-gray-500">Total</label>
                          <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeLineItem(item.id)} className="p-1 hover:bg-gray-200 rounded">
                          <XMarkIcon className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddLineItem('material')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add material
                </button>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Discount</span>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <span className="font-medium text-red-600">-${discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Tax rate (%)</span>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0%"
                    />
                  </div>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">County</span>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
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
