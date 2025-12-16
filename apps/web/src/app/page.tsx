'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  WrenchIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  StarIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  TruckIcon,
  SparklesIcon,
  HomeIcon,
  KeyIcon,
  CogIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useEffect } from 'react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Fallback (shouldn't reach here due to useEffect redirect)
  return null;
}

function LandingPage() {
  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="/infield-works-logo.png"
                alt="InField Works"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition">Features</a>
              <a href="#industries" className="text-gray-700 hover:text-blue-600 transition">Industries</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition">Testimonials</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition">Pricing</a>
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <StarIcon className="h-4 w-4 mr-2" />
                Built by Field Service Experts
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Grow Your Business, Not Your To-Do List
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The complete field service management platform that helps you schedule jobs, dispatch teams, manage customers, and get paid faster—all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg inline-flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </Link>
                <Link
                  href="/login"
                  className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-blue-600 hover:text-blue-600 transition font-semibold text-lg inline-flex items-center justify-center"
                >
                  Login to Dashboard
                </Link>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  15-day free trial
                </div>
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition duration-300">
                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">Your Dashboard Preview</span>
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">HVAC Repair</p>
                        <p className="text-xs text-gray-600">9:00 AM - Technician</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Plumbing Service</p>
                        <p className="text-xs text-gray-600">11:30 AM - Technician</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Electrical Install</p>
                        <p className="text-xs text-gray-600">2:00 PM - Technician</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white text-center">
                    <CalendarIcon className="h-8 w-8 mb-2 mx-auto" />
                    <p className="text-xs font-medium">Schedule</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white text-center">
                    <UserGroupIcon className="h-8 w-8 mb-2 mx-auto" />
                    <p className="text-xs font-medium">Customers</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-white text-center">
                    <ChartBarIcon className="h-8 w-8 mb-2 mx-auto" />
                    <p className="text-xs font-medium">Reports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="bg-blue-600 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <CalendarIcon className="h-12 w-12 mx-auto mb-3" />
              <p className="text-xl font-bold mb-2">Smart Scheduling</p>
              <p className="text-blue-100 text-sm">Optimize your team's time</p>
            </div>
            <div>
              <UserGroupIcon className="h-12 w-12 mx-auto mb-3" />
              <p className="text-xl font-bold mb-2">Customer Management</p>
              <p className="text-blue-100 text-sm">Keep clients happy</p>
            </div>
            <div>
              <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3" />
              <p className="text-xl font-bold mb-2">Fast Payments</p>
              <p className="text-blue-100 text-sm">Get paid instantly</p>
            </div>
            <div>
              <ChartBarIcon className="h-12 w-12 mx-auto mb-3" />
              <p className="text-xl font-bold mb-2">Business Insights</p>
              <p className="text-blue-100 text-sm">Make data-driven decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Field Service Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From scheduling and dispatching to invoicing and payments, InField Works has all the tools you need to grow your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600 mb-4">
                Intelligent job scheduling with drag-and-drop calendar, automated dispatch, and real-time updates for your entire team.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Drag-and-drop calendar</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Automated dispatch</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Route optimization</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Management</h3>
              <p className="text-gray-600 mb-4">
                Complete customer profiles with service history, notes, and automated communication to keep customers informed.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Customer portal</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Service history tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Automated notifications</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Invoicing & Payments</h3>
              <p className="text-gray-600 mb-4">
                Generate professional invoices instantly and accept payments on the spot with integrated payment processing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Instant invoicing</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Mobile payments</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Payment reminders</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition">
              <div className="bg-orange-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <ChartBarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics & Reports</h3>
              <p className="text-gray-600 mb-4">
                Make data-driven decisions with comprehensive reports on revenue, team performance, and customer satisfaction.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Revenue tracking</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Performance metrics</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                  <span>Custom reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Built for Every Field Service Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're in HVAC, plumbing, electrical, or any other field service, InField Works adapts to your business needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'HVAC', icon: FireIcon },
              { name: 'Plumbing', icon: WrenchIcon },
              { name: 'Electrical', icon: BoltIcon },
              { name: 'Landscaping', icon: TruckIcon },
              { name: 'Cleaning', icon: SparklesIcon },
              { name: 'Pest Control', icon: BeakerIcon },
              { name: 'Roofing', icon: HomeIcon },
              { name: 'Handyman', icon: WrenchScrewdriverIcon },
              { name: 'Pool Service', icon: BeakerIcon },
              { name: 'Appliance Repair', icon: CogIcon },
              { name: 'Locksmith', icon: KeyIcon },
              { name: 'Garage Door', icon: HomeIcon }
            ].map((industry) => (
              <div key={industry.name} className="bg-gray-50 rounded-lg p-6 text-center hover:bg-blue-50 hover:shadow-md transition cursor-pointer">
                <industry.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="font-medium text-gray-900">{industry.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose InField Works?
            </h2>
            <p className="text-xl text-gray-600">
              Built with modern technology and designed specifically for field service businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <BoltIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Lightning Fast</h3>
              <p className="text-gray-700 text-center">
                Built with the latest technology for blazing fast performance. No more waiting for pages to load.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-green-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <DevicePhoneMobileIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Mobile First</h3>
              <p className="text-gray-700 text-center">
                Designed for technicians on the go. Access everything you need from your smartphone or tablet.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="bg-purple-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Easy to Use</h3>
              <p className="text-gray-700 text-center">
                Intuitive interface that your team will love. Get started in minutes, not weeks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Take Your Business On The Go
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our mobile app gives your technicians everything they need in the field—job details, customer info, navigation, and the ability to collect payments.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-lg p-2 mr-4">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Works Offline</h3>
                    <p className="text-gray-600">Access job details even without internet connection</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-lg p-2 mr-4">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Real-Time Updates</h3>
                    <p className="text-gray-600">Sync changes instantly across all devices</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 rounded-lg p-2 mr-4">
                    <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Mobile Payments</h3>
                    <p className="text-gray-600">Get paid on the spot with mobile card readers</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-lg p-6">
                <div className="text-center mb-6">
                  <DevicePhoneMobileIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile App Coming Soon</h3>
                  <p className="text-gray-600">Available on iOS and Android</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-gray-900">✓ GPS Navigation</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-gray-900">✓ Digital Forms</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-gray-900">✓ Photo Capture</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-sm text-gray-900">✓ E-Signatures</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business. All plans include a 15-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <p className="text-gray-600 mb-4">Perfect for small teams</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">Up to 2 users</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Job scheduling & dispatch</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Customer management</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Basic invoicing</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Mobile app access</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-600 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <p className="text-gray-600 mb-4">For growing businesses</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-blue-600">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">Up to 10 users</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Everything in Starter, plus:</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced scheduling & routing</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Payment processing</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Customer portal</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Analytics & reports</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 hover:border-blue-500 transition">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-4">For large organizations</p>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">$249</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">Unlimited users</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 font-medium">Everything in Professional, plus:</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Advanced permissions</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Custom training</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">24/7 phone support</span>
                </li>
              </ul>

              <Link
                href="/register"
                className="block w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-center"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-12">
            All plans include a 15-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Field Service Business?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Start your free 15-day trial today—no credit card required. See the difference modern technology makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-10 py-4 rounded-lg hover:bg-gray-100 transition font-bold text-lg inline-flex items-center justify-center shadow-lg"
            >
              Get Started Free
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="bg-blue-500 text-white px-10 py-4 rounded-lg hover:bg-blue-400 transition font-bold text-lg inline-flex items-center justify-center"
            >
              Login to Dashboard
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-blue-100">
            <div className="flex items-center">
              <CheckIcon className="h-6 w-6 mr-2" />
              <span>15-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-6 w-6 mr-2" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <CheckIcon className="h-6 w-6 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-white">InField Works</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete field service management platform for growing businesses.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Mobile App</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 InField Works. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
