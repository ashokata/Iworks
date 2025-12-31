import { authMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/login',
    '/register',
    '/clerk-sign-in(.*)',
    '/clerk-sign-up(.*)',
    '/api/public(.*)',
    '/_next(.*)',
    '/favicon.ico',
  ],

  // Skip Clerk auth for existing auth system during transition
  ignoredRoutes: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/tenants(.*)',
  ],

  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      // Check if using legacy auth system
      const isLegacyAuth = req.nextUrl.pathname.startsWith('/dashboard') ||
                          req.nextUrl.pathname.startsWith('/jobs') ||
                          req.nextUrl.pathname.startsWith('/customers');

      if (isLegacyAuth) {
        // Let legacy auth handle it for now
        return NextResponse.next();
      }

      // For new Clerk-protected routes, redirect to sign-in
      const signInUrl = new URL('/clerk-sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (auth.userId && (req.nextUrl.pathname === '/clerk-sign-in' ||
                       req.nextUrl.pathname === '/clerk-sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};