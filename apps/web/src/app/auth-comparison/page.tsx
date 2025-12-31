'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useUser, useAuth as useClerkAuth, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export default function AuthComparisonPage() {
  const legacyAuth = useAuth();
  const clerkAuth = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Authentication System Comparison
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legacy Authentication */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Legacy Authentication (Current)
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                <p className="text-lg font-semibold">
                  {legacyAuth.isAuthenticated ? (
                    <span className="text-green-600">Authenticated</span>
                  ) : (
                    <span className="text-red-600">Not Authenticated</span>
                  )}
                </p>
              </div>

              {legacyAuth.isAuthenticated && legacyAuth.user && (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">User</p>
                    <p className="text-lg">{legacyAuth.user.name}</p>
                    <p className="text-sm text-gray-500">{legacyAuth.user.email}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Tenant ID</p>
                    <p className="text-lg">{legacyAuth.user.tenantId}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Role</p>
                    <p className="text-lg capitalize">{legacyAuth.user.role}</p>
                  </div>

                  <Button
                    variant="danger"
                    onClick={() => legacyAuth.logout()}
                    className="w-full"
                  >
                    Logout (Legacy)
                  </Button>
                </>
              )}

              {!legacyAuth.isAuthenticated && (
                <Link href="/login">
                  <Button variant="primary" className="w-full">
                    Login with Legacy System
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Current Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Custom JWT authentication</li>
                <li>• LocalStorage session management</li>
                <li>• Tenant ID in user object</li>
                <li>• Basic role management</li>
                <li>• API fallback to mock data</li>
              </ul>
            </div>
          </div>

          {/* Clerk Authentication */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Clerk Authentication (New POC)
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                <p className="text-lg font-semibold">
                  <SignedIn>
                    <span className="text-green-600">Authenticated</span>
                  </SignedIn>
                  <SignedOut>
                    <span className="text-red-600">Not Authenticated</span>
                  </SignedOut>
                </p>
              </div>

              <SignedIn>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">User</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg">
                        {clerkUser?.firstName} {clerkUser?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {clerkUser?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">User ID</p>
                  <p className="text-sm font-mono">{clerkUser?.id}</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full"
                >
                  {showDetails ? 'Hide' : 'Show'} Session Details
                </Button>

                {showDetails && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Session Details
                    </p>
                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(clerkAuth.sessionId ? {
                        sessionId: clerkAuth.sessionId,
                        userId: clerkAuth.userId,
                        orgId: clerkAuth.orgId,
                        isLoaded: clerkAuth.isLoaded,
                        isSignedIn: clerkAuth.isSignedIn
                      } : {}, null, 2)}
                    </pre>
                  </div>
                )}
              </SignedIn>

              <SignedOut>
                <Link href="/clerk-sign-in">
                  <Button variant="primary" className="w-full">
                    Sign in with Clerk
                  </Button>
                </Link>
                <Link href="/clerk-sign-up">
                  <Button variant="outline" className="w-full">
                    Sign up with Clerk
                  </Button>
                </Link>
              </SignedOut>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">New Features:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Managed authentication service</li>
                <li>✓ Built-in MFA support</li>
                <li>✓ Social login providers</li>
                <li>✓ Organizations (multi-tenancy)</li>
                <li>✓ Webhook events</li>
                <li>✓ Edge middleware protection</li>
                <li>✓ User profile management</li>
                <li>✓ Passwordless options</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Migration Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            Migration Strategy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
            <div>
              <h4 className="font-medium mb-2">Current Phase (POC):</h4>
              <ul className="space-y-1">
                <li>• Both auth systems running in parallel</li>
                <li>• New routes use Clerk</li>
                <li>• Legacy routes unchanged</li>
                <li>• Testing organization features</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ul className="space-y-1">
                <li>• Map tenants to Clerk organizations</li>
                <li>• Sync user data via webhooks</li>
                <li>• Update API authentication</li>
                <li>• Gradual user migration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/test">
            <Button variant="outline">
              View Test Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}