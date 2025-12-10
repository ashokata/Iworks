'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  BellIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  CreditCardIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [isOnline, setIsOnline] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Mock profile data
  const profile = {
    name: 'John Smith',
    email: 'john.smith@infieldworks.com',
    phone: '(555) 123-4567',
    role: 'Administrator',
    company: {
      name: 'InField Works Services',
      address: '123 Service Road, Tech City, TS 54321',
      phone: '(555) 987-6543',
      website: 'www.infieldworks.com'
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Helper for tabs
  const tabs = [
    { id: 'account', label: 'Account', icon: UserCircleIcon },
    { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'mobile', label: 'Mobile App', icon: DevicePhoneMobileIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'billing', label: 'Billing', icon: CreditCardIcon },
    { id: 'templates', label: 'Templates', icon: DocumentDuplicateIcon },
    { id: 'integrations', label: 'Integrations', icon: ArrowPathIcon }
  ];

  const handleSave = () => {
    if (!isOnline) return;
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f118a] to-[#1e40af] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-blue-100 mt-1">Configure your account and preferences</p>
            </div>
            <div className="flex items-center space-x-3">
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon
                        className={`mr-3 h-5 w-5 ${
                          activeTab === tab.id ? 'text-blue-500' : 'text-gray-400'
                        }`}
                        aria-hidden="true"
                      />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Information */}
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Profile Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              defaultValue={profile.name}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="role"
                              id="role"
                              defaultValue={profile.role}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                              disabled
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                          </label>
                          <div className="mt-1">
                            <input
                              id="email"
                              name="email"
                              type="email"
                              defaultValue={profile.email}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              defaultValue={profile.phone}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Photo */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Profile Photo</h3>
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <UserCircleIcon className="h-14 w-14 text-gray-400" />
                        </div>
                        <div className="ml-5">
                          <Button variant="outline" disabled={!isOnline}>
                            Change Photo
                          </Button>
                          <p className="mt-1 text-sm text-gray-500">
                            JPG, GIF or PNG. 1MB max.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Preferences */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Email Preferences</h3>
                      <div className="space-y-4">
                        <div className="relative flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="email-job-updates"
                              name="email-job-updates"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="email-job-updates" className="font-medium text-gray-700">
                              Job updates
                            </label>
                            <p className="text-gray-500">Get notified when a job is assigned or updated</p>
                          </div>
                        </div>
                        <div className="relative flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="email-reminders"
                              name="email-reminders"
                              type="checkbox"
                              defaultChecked
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="email-reminders" className="font-medium text-gray-700">
                              Reminders
                            </label>
                            <p className="text-gray-500">Get reminders about upcoming jobs and deadlines</p>
                          </div>
                        </div>
                        <div className="relative flex items-start">
                          <div className="flex h-5 items-center">
                            <input
                              id="email-reports"
                              name="email-reports"
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="email-reports" className="font-medium text-gray-700">
                              Weekly Reports
                            </label>
                            <p className="text-gray-500">Receive weekly summary reports every Monday</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="border-t border-gray-200 pt-6 flex justify-end">
                      <Button
                        onClick={handleSave}
                        disabled={!isOnline || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Company Settings */}
            {activeTab === 'company' && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Company Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Company Information</h3>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                          <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                            Company Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="company-name"
                              id="company-name"
                              defaultValue={profile.company.name}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="address"
                              id="address"
                              defaultValue={profile.company.address}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="company-phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              name="company-phone"
                              id="company-phone"
                              defaultValue={profile.company.phone}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                            Website
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="website"
                              id="website"
                              defaultValue={profile.company.website}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Company Logo</h3>
                      <div className="flex items-center">
                        <div className="h-16 w-16 bg-gray-200 flex items-center justify-center overflow-hidden rounded">
                          <BuildingOfficeIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="ml-5">
                          <Button variant="outline" disabled={!isOnline}>
                            Upload Logo
                          </Button>
                          <p className="mt-1 text-sm text-gray-500">
                            SVG, PNG or JPG. Square format recommended.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="border-t border-gray-200 pt-6 flex justify-end">
                      <Button
                        onClick={handleSave}
                        disabled={!isOnline || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">Configure how and when you receive notifications.</p>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Job Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">New job assignments</p>
                              <p className="text-xs text-gray-500">Get notified when you are assigned to a job</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id="job-email"
                                  name="job-notification"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="job-email" className="ml-2 text-sm text-gray-500">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="job-push"
                                  name="job-notification"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="job-push" className="ml-2 text-sm text-gray-500">
                                  <BellIcon className="h-4 w-4" />
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Job updates</p>
                              <p className="text-xs text-gray-500">Get notified when a job is modified</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id="update-email"
                                  name="update-notification"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="update-email" className="ml-2 text-sm text-gray-500">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="update-push"
                                  name="update-notification"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="update-push" className="ml-2 text-sm text-gray-500">
                                  <BellIcon className="h-4 w-4" />
                                </label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Job completion</p>
                              <p className="text-xs text-gray-500">Get notified when a job is marked as completed</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id="completion-email"
                                  name="completion-notification"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="completion-email" className="ml-2 text-sm text-gray-500">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="completion-push"
                                  name="completion-notification"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="completion-push" className="ml-2 text-sm text-gray-500">
                                  <BellIcon className="h-4 w-4" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-medium text-gray-900 mb-3">Customer Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">New customers</p>
                              <p className="text-xs text-gray-500">Get notified when a new customer is added</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id="customer-email"
                                  name="customer-notification"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="customer-email" className="ml-2 text-sm text-gray-500">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="customer-push"
                                  name="customer-notification"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="customer-push" className="ml-2 text-sm text-gray-500">
                                  <BellIcon className="h-4 w-4" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-medium text-gray-900 mb-3">System Notifications</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">System updates</p>
                              <p className="text-xs text-gray-500">Get notified about system updates and maintenance</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <input
                                  id="system-email"
                                  name="system-notification"
                                  type="checkbox"
                                  defaultChecked
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="system-email" className="ml-2 text-sm text-gray-500">
                                  <EnvelopeIcon className="h-4 w-4" />
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  id="system-push"
                                  name="system-notification"
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="system-push" className="ml-2 text-sm text-gray-500">
                                  <BellIcon className="h-4 w-4" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <div className="border-t border-gray-200 pt-6 flex justify-end">
                        <Button
                          onClick={handleSave}
                          disabled={!isOnline || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other Tabs */}
            {activeTab !== 'account' && activeTab !== 'company' && activeTab !== 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {tabs.find(tab => tab.id === activeTab)?.label || 'Settings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Cog6ToothIcon className="h-16 w-16 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Settings in development</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This settings section is still under development
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => setActiveTab('account')}>
                        Go Back to Account Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
