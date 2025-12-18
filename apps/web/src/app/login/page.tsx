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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Column - Content Centered */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
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
              Empower Your Field Service Team
            </h1>
            <p className="text-blue-100 text-lg md:text-xl leading-relaxed">
              Streamline operations, boost productivity, and deliver exceptional service with our comprehensive field management platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-Time Scheduling</h3>
                <p className="text-blue-100 text-sm">Intelligent dispatch and route optimization</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Customer Portal</h3>
                <p className="text-blue-100 text-sm">Transparent communication and updates</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant Invoicing</h3>
                <p className="text-blue-100 text-sm">Generate and send invoices on the go</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Mobile Ready</h3>
                <p className="text-blue-100 text-sm">Access everything from any device</p>
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
      
      {/* Right Column - Login Form */}
      <div className="bg-white w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center relative">
        {/* Logo - Top Right */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12">
          <img 
            src="/infield-works-logo.png" 
            alt="InField Works" 
            className="h-14 md:h-16"
            onError={(e) => {
              // Fallback to text if logo not found
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const textFallback = target.nextElementSibling as HTMLElement;
              if (textFallback) {
                textFallback.style.display = 'block';
              }
            }}
          />
          <div className="hidden">
            <h1 className="text-2xl font-bold text-gray-900">InField Works</h1>
            <p className="text-gray-600 text-xs">Smart Field Solutions</p>
          </div>
        </div>
        
        <div className="max-w-md w-full">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to continue to your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-md flex items-start">
                <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Register your company
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
