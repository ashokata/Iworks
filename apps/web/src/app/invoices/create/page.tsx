'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { invoiceService } from '@/services/invoiceService';
import { customerService } from '@/services/customerService';

interface InvoiceItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
  type: 'service' | 'material' | 'fee';
}

export default function CreateInvoicePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const customerId = searchParams.get('customerId');
  const [isOnline, setIsOnline] = useState(true);

  const [formData, setFormData] = useState({
    jobId: jobId || '',
    customerId: customerId || '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    notes: '',
    taxRate: 7.5, // Default tax rate
    items: [] as InvoiceItemForm[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch customer details if customerId is provided
  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.getCustomerById(customerId || ''),
    enabled: isAuthenticated && !!customerId,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

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

  // Calculate totals whenever items or tax rate changes
  useEffect(() => {
    const newSubtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxableAmount = formData.items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const newTaxAmount = (taxableAmount * formData.taxRate) / 100;
    const newTotal = newSubtotal + newTaxAmount;

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  }, [formData.items, formData.taxRate]);

  // Use generateFromJob mutation
  const createInvoiceMutation = useMutation({
    mutationFn: () => invoiceService.generateFromJob(formData.jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (jobId) {
        queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      }
      router.push(jobId ? `/jobs/${jobId}` : '/invoices');
    },
    onError: (error: any) => {
      console.error('Failed to create invoice:', error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.jobId) {
      newErrors.jobId = 'Job ID is required';
    }

    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.description) {
        newErrors[`item_${i}_description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${i}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${i}_unitPrice`] = 'Price cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      alert('Cannot create invoices while offline. Please check your connection.');
      return;
    }

    if (validateForm()) {
      // Just call the mutation without parameters as it uses jobId from formData
      createInvoiceMutation.mutate();
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addItem = () => {
    const newItem: InvoiceItemForm = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      taxable: true,
      type: 'service',
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number | boolean) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Update the total for the item
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? Number(value) : updatedItems[index].unitPrice;
      updatedItems[index].total = quantity * unitPrice;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
    
    // Clear any error for this field
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`item_${index}_${field}`]: '' }));
    }
  };

  const removeItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
  };

  if (authLoading) {
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
            {!isOnline && (
              <span className="ml-4 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                Offline - Cannot Create Invoice
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-2">
                      Customer *
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="customerId"
                        value={customer ? `${customer.first_name} ${customer.last_name}` : formData.customerId}
                        readOnly={!!customer}
                        onChange={(e) => handleInputChange('customerId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.customerId ? 'border-red-300' : 'border-gray-300'
                        } ${customer ? 'bg-gray-50' : ''}`}
                        placeholder="Customer ID or select customer"
                      />
                      {!customer && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => router.push('/customers?selectForInvoice=true')}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                    {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
                  </div>

                  {/* Job ID */}
                  <div>
                    <label htmlFor="jobId" className="block text-sm font-medium text-gray-700 mb-2">
                      Job ID *
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        id="jobId"
                        value={formData.jobId}
                        readOnly={!!jobId}
                        onChange={(e) => handleInputChange('jobId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.jobId ? 'border-red-300' : 'border-gray-300'
                        } ${jobId ? 'bg-gray-50' : ''}`}
                        placeholder="Job ID"
                      />
                      {!jobId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => router.push('/jobs?selectForInvoice=true')}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                    {errors.jobId && <p className="mt-1 text-sm text-red-600">{errors.jobId}</p>}
                  </div>

                  {/* Due Date */}
                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dueDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      id="taxRate"
                      value={formData.taxRate}
                      step="0.1"
                      min="0"
                      max="100"
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional invoice notes or payment instructions"
                  ></textarea>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Invoice Items</CardTitle>
                <Button type="button" onClick={addItem}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                {errors.items && <p className="mb-4 text-sm text-red-600">{errors.items}</p>}

                {formData.items.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No items added yet. Click "Add Item" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Table Headers */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 rounded-t-md">
                      <div className="col-span-5 text-sm font-medium text-gray-500">Description</div>
                      <div className="col-span-1 text-sm font-medium text-gray-500">Qty</div>
                      <div className="col-span-2 text-sm font-medium text-gray-500">Unit Price</div>
                      <div className="col-span-2 text-sm font-medium text-gray-500">Total</div>
                      <div className="col-span-1 text-sm font-medium text-gray-500">Tax</div>
                      <div className="col-span-1 text-sm font-medium text-gray-500"></div>
                    </div>

                    {/* Items */}
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors[`item_${index}_description`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Item description"
                          />
                          {errors[`item_${index}_description`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_description`]}</p>
                          )}
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              value={item.unitPrice}
                              step="0.01"
                              min="0"
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                              className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`item_${index}_unitPrice`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                          </div>
                          {errors[`item_${index}_unitPrice`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`item_${index}_unitPrice`]}</p>
                          )}
                        </div>
                        <div className="col-span-2 flex items-center">
                          <span className="text-gray-700">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                        </div>
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => updateItem(index, 'taxable', e.target.checked)}
                            className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="text-gray-700">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Tax ({formData.taxRate}%):</span>
                        <span className="text-gray-700">${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createInvoiceMutation.isPending || !isOnline}
                className="px-6"
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
