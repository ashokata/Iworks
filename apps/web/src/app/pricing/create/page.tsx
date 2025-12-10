'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { pricingService } from '@/services/pricingService';
import { CreatePricingRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  CurrencyDollarIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

export default function CreatePricingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  // Pricing fields
  const [subTotal, setSubTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [county, setCounty] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  
  // Calculated fields
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  
  // UI state
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

  // Auto-calculate totals when values change
  useEffect(() => {
    const calculated = pricingService.calculatePricing(subTotal, discount, taxRate);
    setTaxAmount(calculated.taxAmount);
    setTotal(calculated.total);
  }, [subTotal, discount, taxRate]);

  const createPricingMutation = useMutation({
    mutationFn: (pricingData: CreatePricingRequest) => pricingService.createPricing(pricingData),
    onSuccess: (createdPricing) => {
      console.log('[Pricing Create] Pricing created successfully:', createdPricing);
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      router.push('/pricing');
    },
    onError: (error: any) => {
      console.error('[Pricing Create] Failed to create pricing:', error);
      alert(`Failed to create pricing: ${error?.message || 'Unknown error'}`);
    },
  });

  const handleSubmit = async () => {
    if (!isOnline) {
      alert('Cannot create pricing while offline. Please check your connection.');
      return;
    }

    // Validation
    const newErrors: Record<string, string> = {};
    if (subTotal <= 0) newErrors.subTotal = 'SubTotal must be greater than 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare pricing data
    const pricingData: CreatePricingRequest = {
      subTotal,
      discount,
      taxRate,
      taxAmount,
      total,
      county: county || undefined,
      jobId: jobId ? Number(jobId) : undefined,
    };

    console.log('[Pricing Create] Submitting pricing data:', pricingData);
    createPricingMutation.mutate(pricingData);
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pricing')}
          >
            ← Back to Pricing
          </Button>
        </div>

        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Pricing</h1>
                <p className="text-sm text-gray-500 mt-1">Enter pricing details and calculations</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Job Association (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Job ID (Optional)
              </label>
              <input
                type="number"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Job ID to associate"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if not associated with a job</p>
            </div>

            {/* SubTotal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SubTotal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={subTotal}
                  onChange={(e) => setSubTotal(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              {errors.subTotal && <p className="text-sm text-red-600 mt-1">{errors.subTotal}</p>}
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* County */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                County
              </label>
              <input
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter county name"
              />
            </div>

            {/* Calculated Values Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
              <div className="flex items-center mb-3">
                <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-sm font-semibold text-blue-900">Calculated Totals</h3>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">${subTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Discount:</span>
                <span className="text-sm font-medium text-red-600">-${discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Tax Amount ({taxRate}%):</span>
                <span className="text-sm font-medium text-gray-900">${taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => router.push('/pricing')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPricingMutation.isPending || !isOnline}
            >
              {createPricingMutation.isPending ? 'Creating...' : 'Create Pricing'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
