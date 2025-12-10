'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingService } from '@/services/pricingService';
import { Pricing } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  CurrencyDollarIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  CalculatorIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

export default function PricingDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pricingId = Number(params?.id);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  console.log('[Pricing Details] ========== INIT ==========');
  console.log('[Pricing Details] params:', params);
  console.log('[Pricing Details] pricingId:', pricingId);
  console.log('[Pricing Details] isAuthenticated:', isAuthenticated);
  console.log('[Pricing Details] authLoading:', authLoading);
  console.log('[Pricing Details] ===================================');

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Track online status
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

  // Fetch pricing details - uses cache from pricing list if available
  const { data: pricing, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['pricing', pricingId],
    queryFn: async () => {
      const cachedPricing = queryClient.getQueryData<Pricing[]>(['pricing']);
      if (cachedPricing) {
        const cachedItem = cachedPricing.find(p => p.id === pricingId);
        if (cachedItem) {
          (cachedItem as any)._source = 'cache';
          return cachedItem;
        }
      }
      // Fallback to API
      const fetchedPricing = await pricingService.getPricingById(pricingId);
      (fetchedPricing as any)._source = 'api';
      return fetchedPricing;
    },
    enabled: !!pricingId && isAuthenticated,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  console.log('[Pricing Details] ========== STATE ==========');
  console.log('[Pricing Details] Current pricing state:', pricing);
  console.log('[Pricing Details] isLoading:', isLoading);
  console.log('[Pricing Details] isError:', isError);
  console.log('[Pricing Details] error:', error);
  console.log('[Pricing Details] ============================');

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
              {!isOnline 
                ? 'You are currently offline. Please check your internet connection.' 
                : 'Unable to load pricing details from the server. Please try again.'}
            </p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => refetch()} className="w-full">
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/pricing')} className="w-full">
                Go to Pricing List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // If no pricing data after loading, show not found
  if (!pricing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pricing Not Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              The pricing record you're looking for doesn't exist or has been deleted.
            </p>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" onClick={() => router.push('/pricing')} className="w-full">
                Go to Pricing List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Format date for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not set';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Not set';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {pricing && (
        <div className="fixed top-2 right-2 z-50">
          <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
            Data source: {((pricing as any)._source === 'cache') ? 'Cache' : 'API'}
          </span>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/pricing')}
          >
            ← Back to Pricing
          </Button>
          <div className="flex items-center space-x-3">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <Button 
              onClick={() => router.push(`/pricing/${pricingId}/edit`)}
              disabled={!isOnline}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Pricing
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <Card className="mb-6">
          <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Pricing #{pricing.id}</h1>
                  <p className="text-sm text-gray-500 mt-1">View pricing details and calculations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Amount</div>
                <div className="text-3xl font-bold text-green-600">${pricing.total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SubTotal */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  SubTotal
                </label>
                <div className="flex items-center">
                  <CalculatorIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">
                    ${pricing.subTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Discount
                </label>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-red-600">
                    -${pricing.discount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tax Rate
                </label>
                <span className="text-lg font-semibold text-gray-900">
                  {pricing.taxRate}%
                </span>
              </div>

              {/* Tax Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Tax Amount
                </label>
                <span className="text-lg font-semibold text-gray-900">
                  ${pricing.taxAmount.toFixed(2)}
                </span>
              </div>

              {/* County */}
              {pricing.county && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    County
                  </label>
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">
                      {pricing.county}
                    </span>
                  </div>
                </div>
              )}

              {/* Created Date */}
              {pricing.createdDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Created Date
                  </label>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">
                      {formatDateForDisplay(pricing.createdDate)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Associated Job Card */}
        {pricing.job && (
          <Card>
            <div className="p-6 border-b">
              <div className="flex items-center">
                <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">Associated Job</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Job #{pricing.job.id}</div>
                    <div className="text-lg font-semibold text-gray-900">{pricing.job.title}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/jobs/${pricing.job!.id}`)}
                  >
                    View Job
                  </Button>
                </div>
                {pricing.job.description && (
                  <p className="text-sm text-gray-600 mb-3">{pricing.job.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {pricing.job.status && (
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pricing.job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        pricing.job.status === 'In_Progress' ? 'bg-yellow-100 text-yellow-800' :
                        pricing.job.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pricing.job.status}
                      </span>
                    </div>
                  )}
                  {pricing.job.location && (
                    <div>
                      <span className="text-gray-500">Location: </span>
                      <span className="text-gray-900">{pricing.job.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Calculation Breakdown */}
        <Card className="mt-6">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <CalculatorIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Calculation Breakdown</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Subtotal</span>
                <span className="text-sm font-medium text-gray-900">${pricing.subTotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Discount</span>
                <span className="text-sm font-medium text-red-600">-${pricing.discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Subtotal after discount</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(pricing.subTotal - pricing.discount).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Tax ({pricing.taxRate}%)</span>
                <span className="text-sm font-medium text-gray-900">${pricing.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-green-600">${pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
