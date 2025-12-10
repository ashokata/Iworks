import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { QueryProvider } from '@/providers/QueryProvider';
import SidebarLayout from '@/components/SidebarLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InField Works',
  description: 'Professional Field Service Management Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="InField Works" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <TenantProvider>
            <QueryProvider>
              <SidebarLayout>
                {children}
              </SidebarLayout>
            </QueryProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
