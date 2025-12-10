'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  HomeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
  current: boolean;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { currentTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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

  // Prepare navigation items based on the app structure in src/app directory
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: pathname === '/dashboard' || pathname === '/' },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, current: pathname === '/jobs' || pathname.startsWith('/jobs/') },
    { name: 'Schedule', href: '/scheduler', icon: DocumentTextIcon, current: pathname === '/scheduler' || pathname.startsWith('/scheduler/') },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon, current: pathname === '/customers' || pathname.startsWith('/customers/') },
    { name: 'Technicians', href: '/technicians', icon: UserIcon, current: pathname === '/technicians' || pathname.startsWith('/technicians/') },
    { name: 'Employees', href: '/employees', icon: UserGroupIcon, current: pathname === '/employees' || pathname.startsWith('/employees/') },
    { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, current: pathname === '/invoices' || pathname.startsWith('/invoices/') },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, current: pathname === '/reports' || pathname.startsWith('/reports/') },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: pathname === '/settings' || pathname.startsWith('/settings/') },
  ];

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Do not render navigation on login page or similar pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                {currentTenant ? (
                  <>
                    {currentTenant.logo && (
                      <div className="h-8 w-8 mr-2 relative overflow-hidden rounded">
                        <Image 
                          src={currentTenant.logo} 
                          alt={currentTenant.name} 
                          fill 
                          style={{ objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                    <span 
                      className="font-bold text-xl"
                      style={{ 
                        color: currentTenant?.settings?.theme?.primaryColor || '#3B82F6' 
                      }}
                    >
                      {currentTenant.name}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <img 
                      src="/infield-works-logo.png" 
                      alt="InField Works" 
                      className="h-12 w-auto"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User Actions */}
          <div className="hidden md:ml-6 md:flex md:items-center">
            {!isOnline && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full mr-2">
                Offline Mode
              </span>
            )}
            <button 
              type="button"
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-1" />
              Sign Out
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-base font-medium ${
                item.current
                  ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                  : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="flex items-center px-4">
              {!isOnline && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center px-3 py-2 w-full text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              >
                <ArrowRightStartOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
