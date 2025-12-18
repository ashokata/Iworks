'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [companyData, setCompanyData] = useState({
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleCompanyDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const validateCompanyData = () => {
    if (!companyData.name) return 'Company name is required';
    if (!companyData.domain) return 'Domain is required';
    if (!companyData.email || !companyData.email.includes('@')) return 'Valid email is required';
    return null;
  };

  const validateAdminData = () => {
    if (!adminData.firstName || !adminData.lastName) return 'Full name is required';
    if (!adminData.email || !adminData.email.includes('@')) return 'Valid email is required';
    if (!adminData.password) return 'Password is required';
    if (adminData.password !== adminData.confirmPassword) return 'Passwords do not match';
    if (adminData.password.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const handleNextStep = () => {
    const error = validateCompanyData();
    if (error) {
      setError(error);
      return;
    }
    
    setError('');
    setStep(2);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate admin data
    const error = validateAdminData();
    if (error) {
      setError(error);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Import the apiClient
      const { apiClient } = await import('@/services/apiClient');

      // Call the register endpoint
      const response = await apiClient.post('/api/tenants/register', {
        company: {
          name: companyData.name,
          domain: companyData.domain,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
          city: companyData.city,
          state: companyData.state,
          zipCode: companyData.zipCode,
          country: companyData.country,
          industry: companyData.domain.split('.')[0],
          size: '1-10'
        },
        admin: {
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          email: adminData.email,
          password: adminData.password
        }
      });

      console.log('[Registration] Success:', response);

      // Redirect to success page with the tenant name
      router.push(`/register/success?tenantName=${encodeURIComponent(companyData.name)}`);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Column - Content Centered */}
      <div className="bg-gradient-to-br from-[#1a2a6c] via-[#1a2a6c] to-[#1e40af] text-white w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Content Section - Centered */}
        <div className="relative z-10 max-w-lg w-full space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Transform Your Field Service Business
            </h1>
            <p className="text-blue-100 text-lg md:text-xl leading-relaxed">
              Start your free 15-day trial and discover how InField Works can streamline operations, boost productivity, and delight customers.
            </p>
          </div>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= 1 ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10'
                }`}>
                  {step > 1 ? <CheckIcon className="h-6 w-6 text-white" /> : '1'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Register your company</h3>
                <p className="text-blue-100 text-sm">Create your organization's account</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= 2 ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10'
                }`}>
                  {step > 2 ? <CheckIcon className="h-6 w-6 text-white" /> : '2'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Set up admin account</h3>
                <p className="text-blue-100 text-sm">Create your administrator credentials</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= 3 ? 'bg-white bg-opacity-30' : 'bg-white bg-opacity-10'
                }`}>
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Start managing your business</h3>
                <p className="text-blue-100 text-sm">Access all features instantly</p>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-white border-opacity-20">
            <p className="text-blue-100 text-sm mb-3">Trusted by leading service companies</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="px-3 py-1 bg-white bg-opacity-10 rounded-full backdrop-blur-sm">TechServe</span>
              <span className="px-3 py-1 bg-white bg-opacity-10 rounded-full backdrop-blur-sm">RepairPro</span>
              <span className="px-3 py-1 bg-white bg-opacity-10 rounded-full backdrop-blur-sm">FixItNow</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Registration Form */}
      <div className="bg-white w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative">
        {/* Logo - Top Right */}
        <div className="absolute top-4 right-8 md:top-6 md:right-12 z-10">
          <img 
            src="/infield-works-logo.png" 
            alt="InField Works" 
            className="h-10 md:h-12"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        
        <div className="max-w-md w-full pt-6 md:pt-8">
          <div className="mb-8 pr-16 md:pr-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Register Your Company' : 'Create Admin Account'}
            </h2>
            <p className="text-gray-600">
              {step === 1 
                ? 'Enter your company details to get started' 
                : 'Set up your administrator account'}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-start mb-6">
              <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-5">
            {step === 1 ? (
              // Step 1: Company Information
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-5 w-5 mr-2 text-gray-400" />
                      Company Name
                    </div>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="domain" className="block text-sm font-semibold text-gray-700">
                    Company Domain
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      value={companyData.domain}
                      onChange={handleCompanyDataChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="yourcompany"
                      required
                    />
                    <span className="inline-flex items-center px-4 py-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-lg">
                      .com
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Company Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleCompanyDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="contact@yourcompany.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={companyData.city}
                      onChange={handleCompanyDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={companyData.state}
                      onChange={handleCompanyDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="State"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={companyData.zipCode}
                      onChange={handleCompanyDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="12345"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={companyData.country}
                      onChange={handleCompanyDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              // Step 2: Admin Information
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={adminData.firstName}
                      onChange={handleAdminDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="John"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={adminData.lastName}
                      onChange={handleAdminDataChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="adminEmail" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    value={adminData.email}
                    onChange={handleAdminDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="admin@yourcompany.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={adminData.password}
                    onChange={handleAdminDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={adminData.confirmPassword}
                    onChange={handleAdminDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a2a6c] focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className={`pt-6 ${step === 2 ? 'flex justify-between items-center' : ''}`}>
              {step === 2 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="px-6"
                >
                  Back
                </Button>
              )}
              
              <Button
                type={step === 1 ? 'button' : 'submit'}
                onClick={step === 1 ? handleNextStep : undefined}
                disabled={isSubmitting}
                className={`${step === 1 ? 'w-full' : ''} bg-[#1a2a6c] hover:bg-[#1e40af] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]`}
                loading={isSubmitting}
              >
                {step === 1 ? 'Continue' : isSubmitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="font-semibold text-[#1a2a6c] hover:text-[#1e40af] transition-colors">
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
