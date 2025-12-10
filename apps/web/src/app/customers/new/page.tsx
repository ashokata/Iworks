'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { customerService } from '@/services/customerService';
import { 
  UserCircleIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

type FormData = {
  first_name: string;
  last_name: string;
  type: 'homeowner' | 'business';
  email: string;
  mobile_number: string;
  home_number: string;
  work_number: string;
  company: string;
  job_title: string;
  notifications_enabled: boolean;
  has_improved_card_on_file: boolean;
  is_contractor: boolean;
  notes: string;
  tags: string[];
};

export default function AddPetCustomerPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    type: 'homeowner',
    email: '',
    mobile_number: '',
    home_number: '',
    work_number: '',
    company: '',
    job_title: '',
    notifications_enabled: true,
    has_improved_card_on_file: false,
    is_contractor: false,
    notes: '',
    tags: [],
  });

  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle tag input
  const handleTagsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  };

  // Add a tag
  const handleAddTag = () => {
    if (tagsInput.trim() && !formData.tags.includes(tagsInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagsInput.trim()]
      }));
      setTagsInput('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare customer data (without addresses - they can be added after customer is created)
      const customerData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        home_number: formData.home_number,
        work_number: formData.work_number,
        company: formData.company,
        job_title: formData.job_title,
        notes: formData.notes,
        type: formData.type,
        is_contractor: formData.is_contractor,
      };
      
      // Create customer
      const newCustomer = await customerService.createCustomer(customerData);
      
      // Add tags if any (skip if it fails - tags can be added later)
      if (formData.tags.length > 0) {
        try {
          for (const tag of formData.tags) {
            await customerService.addCustomerTag(newCustomer.id, tag);
          }
        } catch (tagError) {
          console.warn('Failed to add tags, but customer was created:', tagError);
          // Don't fail the whole operation
        }
      }
      
      // Show success toast
      setToast({
        message: 'Customer created successfully!',
        type: 'success'
      });
      
      // Navigate to customer overview page
      setTimeout(() => {
        router.push('/customers');
      }, 1500);
    } catch (error) {
      console.error('Failed to create customer:', error);
      setToast({
        message: 'Failed to create customer. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
          <div className={`flex items-start gap-4 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm min-w-[420px] border ${
            toast.type === 'error' 
              ? 'bg-red-50/95 border-red-200'
              : 'bg-emerald-50/95 border-emerald-200'
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              toast.type === 'error'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-gradient-to-br from-emerald-500 to-green-600'
            }`}>
              {toast.type === 'error' ? (
                <XMarkIcon className="h-6 w-6 text-white" />
              ) : (
                <CheckIcon className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className={`text-sm font-bold ${
                toast.type === 'error' ? 'text-red-900' : 'text-emerald-900'
              }`}>
                {toast.type === 'error' ? '⚠️ Error Occurred' : '✓ Success!'}
              </p>
              <p className={`text-sm mt-1.5 ${
                toast.type === 'error' ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-all hover:rotate-90 duration-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Header with Glass Effect */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push('/customers')}
              className="group flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
            >
              <svg className="h-5 w-5 text-gray-600 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Back</span>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Customer
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Add a new customer to your database</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-blue-700">Draft</span>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5" />
                  <span>Create Customer</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered Card Layout */}
      <div className="container mx-auto px-8 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Customer Preview Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-center">
                <div className="inline-flex p-4 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                  <UserCircleIcon className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {formData.first_name || formData.last_name ? `${formData.first_name} ${formData.last_name}`.trim() : 'New Customer'}
                </h3>
                <p className="text-sm text-indigo-100 capitalize flex items-center justify-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-white/60 mr-2"></span>
                  {formData.type}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Tags Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                      <TagIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                      Tags
                    </label>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={handleTagsInputChange}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 focus:bg-white rounded-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[24px]">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 hover:text-indigo-900 transition-colors"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {formData.tags.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No tags yet</span>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-emerald-600" />
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
                    rows={4}
                    placeholder="Add private notes about this customer..."
                  />
                </div>

                {/* Quick Options */}
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
                    Quick Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="notifications_enabled"
                        checked={formData.notifications_enabled}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        🔔 Enable notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="has_improved_card_on_file"
                        checked={formData.has_improved_card_on_file}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        💳 Card on file
                      </span>
                    </label>
                    
                    <label className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group">
                      <input
                        type="checkbox"
                        name="is_contractor"
                        checked={formData.is_contractor}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        🔨 Contractor
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Personal Information</h2>
                    <p className="text-xs text-blue-100">Basic customer details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                        errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      placeholder="John"
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-600 mt-1.5 flex items-center">
                        <span className="inline-block mr-1">⚠</span> {errors.first_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Customer Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'homeowner' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'homeowner'
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'homeowner' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${formData.type === 'homeowner' ? 'text-blue-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <span className={`font-semibold ${formData.type === 'homeowner' ? 'text-blue-700' : 'text-gray-700'}`}>
                          Homeowner
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: 'business' }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === 'business'
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          formData.type === 'business' ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <BuildingOfficeIcon className={`h-5 w-5 ${formData.type === 'business' ? 'text-purple-600' : 'text-gray-500'}`} />
                        </div>
                        <span className={`font-semibold ${formData.type === 'business' ? 'text-purple-700' : 'text-gray-700'}`}>
                          Business
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <EnvelopeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Contact Details</h2>
                    <p className="text-xs text-emerald-100">How to reach this customer</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border-2 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
                      } rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center">
                      <span className="inline-block mr-1">⚠</span> {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      📱 Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      🏠 Home
                    </label>
                    <input
                      type="text"
                      name="home_number"
                      value={formData.home_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                      💼 Work
                    </label>
                    <input
                      type="text"
                      name="work_number"
                      value={formData.work_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information Card - Conditional */}
            {formData.type === 'business' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Business Information</h2>
                      <p className="text-xs text-purple-100">Company details</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-100"
                        placeholder="Acme Corporation"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                        Job Title
                      </label>
                      <input
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-100"
                        placeholder="Manager"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* End of Right Column */}

        </div>
      </div>
    </div>
  );
}
