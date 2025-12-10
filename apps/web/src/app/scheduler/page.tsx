'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';

// This component redirects users to appropriate scheduler view based on their role
export default function SchedulerRedirectPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check user role and redirect accordingly
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'manager') {
      router.push('/scheduler/admin');
    } else if (role === 'technician') {
      router.push('/scheduler/technician');
    } else {
      // Default to technician view for other roles
      router.push('/scheduler/technician');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Redirecting to appropriate scheduler view...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
