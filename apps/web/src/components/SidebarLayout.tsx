'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import Link from 'next/link';
import Image from 'next/image';
import styles from './sidebar.module.css';
import {
  BriefcaseIcon,
  UserGroupIcon,
  UserIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { ChatButton } from '@/components/AIChat';
// Import custom icon if needed
// import HomeIconCustom from '@/components/icons/HomeIcon';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
  current: boolean;
}

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { currentTenant } = useTenant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

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

  // Prepare navigation items based on the app structure
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: pathname === '/dashboard' || pathname === '/' },
    { name: 'AI Chat', href: '/chat', icon: ChatBubbleLeftRightIcon, current: pathname === '/chat' },
    { name: 'Jobs', href: '/jobs', icon: BriefcaseIcon, current: pathname === '/jobs' || pathname.startsWith('/jobs/') },
    { name: 'Schedule', href: '/schedule', icon: CalendarIcon, current: pathname === '/schedule' || pathname.startsWith('/schedule/') },
    { name: 'Dispatch', href: '/dispatch', icon: CalendarIcon, current: pathname === '/dispatch' },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon, current: pathname === '/customers' || pathname.startsWith('/customers/') },
    { name: 'Technicians', href: '/technicians', icon: UserIcon, current: pathname === '/technicians' || pathname.startsWith('/technicians/') },
    { name: 'Employees', href: '/employees', icon: UserGroupIcon, current: pathname === '/employees' || pathname.startsWith('/employees/') },
    { name: 'Pricebook', href: '/pricebook', icon: BookOpenIcon, current: pathname === '/pricebook' || (pathname.startsWith('/pricebook/') && !pathname.startsWith('/pricebook/manage')) },
    { name: 'Manage Catalog', href: '/pricebook/manage', icon: WrenchScrewdriverIcon, current: pathname === '/pricebook/manage' || pathname.startsWith('/pricebook/manage/') },
    { name: 'Service Requests', href: '/service-requests', icon: PhoneIcon, current: pathname === '/service-requests' },
    { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, current: pathname === '/invoices' || pathname.startsWith('/invoices/') },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, current: pathname === '/reports' || pathname.startsWith('/reports/') },
    { name: 'Permissions', href: '/settings/permissions', icon: ShieldCheckIcon, current: pathname === '/settings/permissions' || pathname.startsWith('/settings/permissions/') },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: pathname === '/settings' || pathname.startsWith('/settings/') },
  ];

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Don't render sidebar on login page or similar pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)} 
          ></div>
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0f118a]">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-0">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-3 text-sm font-bold ${
                      item.current
                        ? `bg-blue-700 text-white border-l-4 border-white ${styles.navLinkActive}`
                        : `text-white hover:bg-blue-800 hover:text-white hover:shadow-inner ${styles.navLinkShine}`
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        item.current ? 'text-white' : 'text-blue-200 group-hover:text-white'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-blue-800 p-4">
              {!isOnline && (
                <div className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Offline Mode
                </div>
              )}
              <button 
                onClick={handleLogout}
                className="flex-1 flex items-center px-4 py-2 text-sm font-bold text-white hover:text-blue-200"
              >
                <ArrowRightStartOnRectangleIcon className="mr-3 h-5 w-5 text-blue-200" aria-hidden="true" />
                <span className="flex-1">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:z-10 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-56'}`}>
        <div className={`flex flex-col ${isCollapsed ? 'w-16' : 'w-56'} transition-all duration-300`}>
          {/* Sidebar component */}
          <div className="flex flex-col h-full bg-[#0f118a] overflow-y-auto">
            <div className="flex-grow flex flex-col">
              <nav className="flex-1 bg-[#0f118a] space-y-0 pt-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-bold transition-all ${
                      item.current
                        ? `bg-blue-700 text-white ${!isCollapsed && 'border-l-4 border-white'} ${styles.navLinkActive}`
                        : `text-white hover:bg-blue-800 hover:text-white hover:shadow-inner ${styles.navLinkShine}`
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <item.icon
                      className={`${isCollapsed ? 'mr-0' : 'mr-3'} h-5 w-5 ${
                        item.current ? 'text-white' : 'text-blue-200 group-hover:text-white'
                      } transition-all`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && <span className="transition-opacity duration-300">{item.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 border-t border-blue-800 mt-auto">
              {/* Toggle button */}
              <button
                onClick={toggleCollapse}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-bold text-white hover:bg-blue-800 transition-all`}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronDoubleRightIcon className="h-5 w-5 text-blue-200" aria-hidden="true" />
                ) : (
                  <>
                    <ChevronDoubleLeftIcon className="mr-3 h-5 w-5 text-blue-200" aria-hidden="true" />
                    <span className="flex-1 text-left">Collapse</span>
                  </>
                )}
              </button>

              <div className={`flex items-center ${isCollapsed ? 'p-2' : 'p-4'} transition-all`}>
                <div className="w-full">
                  {!isOnline && !isCollapsed && (
                    <div className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full mb-2">
                      Offline Mode
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-2'} py-2 text-sm font-bold text-white hover:text-blue-200 w-full transition-all`}
                    title={isCollapsed ? 'Sign Out' : ''}
                  >
                    <ArrowRightStartOnRectangleIcon className={`${isCollapsed ? 'mr-0' : 'mr-3'} h-5 w-5 text-blue-200 transition-all`} aria-hidden="true" />
                    {!isCollapsed && <span className="flex-1 transition-opacity duration-300">Sign Out</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col h-screen w-0 flex-1 ${isCollapsed ? 'md:ml-16' : 'md:ml-56'} transition-all duration-300 overflow-y-auto`}>
        {/* Top header - visible on all screen sizes */}
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            {/* Logo and title - shown on all devices */}
            <div className="flex items-center gap-3 ml-2 md:ml-0">
              <Image
                src="/infield-works-logo.png"
                alt="InField Works"
                width={200}
                height={60}
                className="h-auto w-auto max-h-12"
                priority
              />
            </div>
          </div>
          
          {/* User welcome section */}
          <div className="flex items-center">
            {!isOnline && (
              <span className="px-2 py-1 mr-3 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Offline Mode
              </span>
            )}
            <div className="text-sm text-gray-600 mr-2">
              {user && `Welcome, ${user.name || 'Alex Johnson'}`}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 relative">
          {children}
        </main>
      </div>

      {/* AI Chat Button - Floating on all pages */}
      <ChatButton />
    </div>
  );
}
