'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Mock data - Replace with actual API calls using pricebookService
const mockCategories = {
  hvac: [
    {
      id: '1',
      name: 'Installation',
      description: 'HVAC system installation services',
      services: [
        { id: 's1', name: 'Central AC Installation - Standard', unitPrice: 3500, estimatedDuration: 480 },
        { id: 's2', name: 'Furnace Installation - Standard', unitPrice: 2800, estimatedDuration: 360 },
      ],
    },
    {
      id: '2',
      name: 'Repair & Service',
      description: 'HVAC repair and maintenance services',
      services: [
        { id: 's3', name: 'AC Repair - Diagnostic & Fix', unitPrice: 150, estimatedDuration: 90 },
      ],
    },
  ],
  plumbing: [
    {
      id: '3',
      name: 'Installation',
      description: 'Plumbing installation services',
      services: [
        { id: 's4', name: 'Water Heater Installation - 50 Gallon', unitPrice: 850, estimatedDuration: 180 },
      ],
    },
  ],
};

export default function PricebookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1']));
  const [importing, setImporting] = useState(false);

  // Unwrap the params promise using React.use()
  const { slug } = use(params);

  const categories = mockCategories[slug as keyof typeof mockCategories] || [];

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleImport = async () => {
    setImporting(true);
    // TODO: Call pricebookService.importPricebook({ tenantId, industrySlug: slug })
    setTimeout(() => {
      setImporting(false);
      alert('Pricebook imported successfully!');
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a2a6c] to-[#1e40af] text-white p-3 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="bg-white text-[#1a2a6c] hover:bg-gray-100 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Industries
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold capitalize">{slug} Services</h1>
                <p className="text-sm text-blue-100">{categories.length} categories available</p>
              </div>
            </div>
            <Button
              variant="success"
              onClick={handleImport}
              disabled={importing}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Import to My Catalog
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories */}
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              {/* Category Header */}
              <div
                className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {expandedCategories.has(category.id) ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{category.services.length} services</span>
                </div>
              </div>

              {/* Services List */}
              {expandedCategories.has(category.id) && (
                <div className="divide-y divide-gray-200">
                  {category.services.map((service) => (
                    <div key={service.id} className="p-4 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900">{service.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                              ${service.unitPrice.toFixed(2)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {service.estimatedDuration} mins
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found for this industry.</p>
          </div>
        )}
      </main>
    </div>
  );
}
