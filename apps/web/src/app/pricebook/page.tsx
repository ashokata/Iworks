'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

// Mock data - Replace with actual API calls
const industries = [
  { id: 'hvac', name: 'HVAC', slug: 'hvac', icon: '❄️', description: 'Heating, Ventilation, and Air Conditioning services' },
  { id: 'plumbing', name: 'Plumbing', slug: 'plumbing', icon: '🔧', description: 'Residential and commercial plumbing services' },
  { id: 'electrical', name: 'Electrical', slug: 'electrical', icon: '⚡', description: 'Electrical installation and repair services' },
  { id: 'landscaping', name: 'Landscaping', slug: 'landscaping', icon: '🌿', description: 'Lawn care and landscape maintenance' },
  { id: 'cleaning', name: 'Cleaning', slug: 'cleaning', icon: '🧹', description: 'Residential and commercial cleaning services' },
];

export default function PricebookPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter industries based on search
  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <BookOpenIcon className="h-8 w-8 mr-3" />
                Pricebook Catalog
              </h1>
              <p className="text-blue-100 mt-1">Browse industry-specific service templates</p>
            </div>
            <Button
              variant="default"
              onClick={() => router.push('/pricebook/manage')}
              className="bg-white text-[#0f118a] hover:bg-gray-100"
            >
              Manage My Catalog
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search industries..."
              className="border border-gray-300 rounded-lg pl-10 pr-3 py-3 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIndustries.map((industry) => (
            <Card
              key={industry.id}
              className="p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
              onClick={() => router.push(`/pricebook/${industry.slug}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-4xl mr-3">{industry.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{industry.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{industry.description}</p>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/pricebook/${industry.slug}`);
                  }}
                >
                  Browse Services
                  <ChevronRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredIndustries.length === 0 && (
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Industries Found</h3>
            <p className="text-gray-500">
              No industries match your search. Try a different search term.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">About Pricebook Templates</h4>
              <p className="text-sm text-blue-700">
                These are industry-standard service catalogs that you can browse and import into your company's pricing.
                Each industry contains pre-configured categories, services, and suggested pricing to help you get started quickly.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
