'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { WrenchIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('[Login Page] Attempting login with:', { email: formData.username });
      
      // Authenticate with API - tenant will be automatically identified from user credentials
      const success = await login(formData.username, formData.password);

      console.log('[Login Page] Login result:', success);

      if (!success) {
        setError('Invalid email or password. Please check your credentials and try again.');
      }
      // Note: tenant ID is automatically set in the AuthContext after successful login
      // The router will redirect to /dashboard if login is successful (handled by useEffect)
    } catch (err: any) {
      console.error('[Login Page] Login error:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column - Blue Side */}
      <div className="bg-blue-600 text-white w-full md:w-1/2 p-8 flex flex-col">
        <div className="flex items-center mb-6">
          {/* InField Works Logo */}
          <img 
            src="/infield-works-logo.png" 
            alt="InField Works" 
            className="h-12 mr-3"
            onError={(e) => {
              // Fallback to text if logo not found
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-2xl font-bold">InField Works</h1>
            <p className="text-sm">Smart Field Solutions</p>
          </div>
        </div>
        
        <div className="mt-12 space-y-8">
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-white mr-4 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">Streamline Your Operations</h2>
              <p className="text-blue-100 mt-1">Manage your field service team efficiently with real-time scheduling and dispatching.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-white mr-4 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">Increase Productivity</h2>
              <p className="text-blue-100 mt-1">Optimize routes and reduce travel time with our intelligent scheduling system.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-white mr-4 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">Enhance Customer Satisfaction</h2>
              <p className="text-blue-100 mt-1">Provide accurate arrival times and professional service with our customer portal.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckIcon className="h-6 w-6 text-white mr-4 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-lg">Simplify Invoicing</h2>
              <p className="text-blue-100 mt-1">Generate and send invoices instantly upon job completion.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-auto">
          <p className="text-blue-100 mb-4">Join thousands of service businesses already using InField Works</p>
          <div className="flex space-x-4">
            <span className="text-white">TechServe</span>
            <span className="text-white">RepairPro</span>
            <span className="text-white">FixItNow</span>
          </div>
        </div>
      </div>
      
      {/* Right Column - Login Form */}
      <div className="bg-white w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Log in to your account to manage your field service operations</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot Password?
              </a>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Sign In
            </Button>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                <span>Or continue with</span>
              </p>
              <div className="flex justify-center mt-4 space-x-4">
                <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Button
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Button
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Button
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p>
                Don't have an account? 
                <a href="/register" className="ml-1 font-medium text-blue-600 hover:text-blue-500">
                  Register your company
                </a>
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700">
                <strong>Test Credentials:</strong>
                <div className="mt-2 grid grid-cols-1 gap-y-3">
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>InField Works:</strong><br />
                    Username: iw_admin<br />
                    Password: password123
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Acme Corporation:</strong><br />
                    Username: acme_admin<br />
                    Password: password123
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100">
                    <strong>Globex Inc:</strong><br />
                    Username: globex_admin<br />
                    Password: password123
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
