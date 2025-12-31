'use client';

import { useUser, useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const { createOrganization, setActive, organizationList } = useOrganizationList();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    industry: '',
    size: 'small',
  });

  useEffect(() => {
    // Check if user already has an organization
    if (organizationList && organizationList.length > 0) {
      // User already has an org, redirect to dashboard
      router.push('/dashboard');
    }
  }, [organizationList, router]);

  const handleCreateOrganization = async () => {
    setLoading(true);
    setError('');

    try {
      if (!createOrganization) {
        throw new Error('Organization creation not available');
      }

      // Check for organization limit error
      try {
        // Create the organization (this will be the tenant)
        const org = await createOrganization({
          name: orgData.name,
          slug: orgData.slug,
          publicMetadata: {
            industry: orgData.industry,
            size: orgData.size,
            plan: 'trial', // Start with trial plan
            createdAt: new Date().toISOString(),
          },
        });

        // Set the newly created organization as active
        if (setActive) {
          await setActive({ organization: org });
        }

        // Update user metadata with tenant info
        await user?.update({
          publicMetadata: {
            onboardingCompleted: true,
            defaultOrgId: org.id,
          },
        });

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (orgError: any) {
        // Handle organization limit error
        if (orgError.message?.includes('exceeded the maximum number')) {
          console.warn('Organization limit reached, using user metadata as fallback');

          // Fallback: Store tenant data in user metadata instead
          await user?.update({
            publicMetadata: {
              onboardingCompleted: true,
              tenantData: {
                name: orgData.name,
                slug: orgData.slug,
                industry: orgData.industry,
                size: orgData.size,
                plan: 'trial',
                createdAt: new Date().toISOString(),
              },
              // For POC, simulate tenant ID
              tenantId: `tenant-${orgData.slug}-${Date.now()}`,
            },
          });

          setError('Organization limit reached. Using alternative storage for demo purposes.');

          // Still redirect after a delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          throw orgError;
        }
      }
    } catch (err: any) {
      console.error('Error in onboarding:', err);
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to FieldSmartPro!
          </h1>
          <p className="text-gray-600">
            Let's set up your organization to get started
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Organization Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => {
                    setOrgData({
                      ...orgData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC Plumbing Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization ID (slug)
                </label>
                <input
                  type="text"
                  value={orgData.slug}
                  onChange={(e) => setOrgData({ ...orgData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., abc-plumbing"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used in URLs and cannot be changed later
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!orgData.name || !orgData.slug}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Industry & Size
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  value={orgData.industry}
                  onChange={(e) => setOrgData({ ...orgData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an industry</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="hvac">HVAC</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="cleaning">Cleaning Services</option>
                  <option value="general">General Contracting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size
                </label>
                <select
                  value={orgData.size}
                  onChange={(e) => setOrgData({ ...orgData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="small">1-10 employees</option>
                  <option value="medium">11-50 employees</option>
                  <option value="large">51-200 employees</option>
                  <option value="enterprise">200+ employees</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Your organization will be created</li>
                  <li>✓ You'll be set as the admin</li>
                  <li>✓ You can invite team members</li>
                  <li>✓ 14-day free trial will begin</li>
                </ul>
              </div>

              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateOrganization}
                  loading={loading}
                  disabled={loading || !orgData.industry}
                >
                  Create Organization
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            This is a proof of concept showing how Clerk Organizations
            can replace the current tenant system.
          </p>
        </div>
      </div>
    </div>
  );
}