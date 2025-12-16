'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WrenchIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column - Blue Side */}
      <div className="bg-blue-600 text-white w-full md:w-1/2 p-8 flex flex-col">
        <div className="flex items-center mb-12">
          <img
            src="/infield-works-logo.png"
            alt="InField Works"
            className="h-12 w-auto mr-3"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-2xl font-bold">InField Works</h1>
            <p className="text-sm">Smart Field Solutions</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Transform Your Field Service Business</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free 15-day trial and discover how InField Works can streamline operations, boost productivity, and delight customers.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Register your company</h3>
                <p className="text-blue-100">Create your organization's account</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Set up admin account</h3>
                <p className="text-blue-100">Create your admin credentials</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium">Start managing your business</h3>
                <p className="text-blue-100">Access all features instantly</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <p className="text-blue-100">Already have an account?</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-2 text-white font-medium underline"
          >
            Sign in to your account
          </button>
        </div>
      </div>
      
      {/* Right Column - Registration Form */}
      <div className="bg-white w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Register Your Company' : 'Create Admin Account'}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === 1 
                ? 'Enter your company details to get started' 
                : 'Set up your administrator account'}
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={step === 1 ? handleNextStep : handleSubmit}>
            {step === 1 ? (
              // Step 1: Company Information
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <BuildingOffice2Icon className="h-5 w-5 mr-1 text-gray-400" />
                      Company Name
                    </div>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Domain
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      value={companyData.domain}
                      onChange={handleCompanyDataChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
                      required
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                      .com
                    </span>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleCompanyDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={companyData.city}
                      onChange={handleCompanyDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={companyData.state}
                      onChange={handleCompanyDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={companyData.zipCode}
                      onChange={handleCompanyDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={companyData.country}
                      onChange={handleCompanyDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={adminData.firstName}
                      onChange={handleAdminDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={adminData.lastName}
                      onChange={handleAdminDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="email"
                    value={adminData.email}
                    onChange={handleAdminDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={adminData.password}
                    onChange={handleAdminDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={adminData.confirmPassword}
                    onChange={handleAdminDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            )}
            
            <div className={`mt-8 ${step === 2 ? 'flex justify-between' : ''}`}>
              {step === 2 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                >
                  Back
                </Button>
              )}
              
              <Button
                type={step === 1 ? 'button' : 'submit'}
                onClick={step === 1 ? handleNextStep : undefined}
                disabled={isSubmitting}
                className={step === 1 ? 'w-full' : ''}
              >
                {step === 1 ? 'Next' : isSubmitting ? 'Registering...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
