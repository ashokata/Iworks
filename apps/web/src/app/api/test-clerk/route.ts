import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId, sessionId, orgId } = await auth();

  // Public endpoint to test Clerk configuration
  return NextResponse.json({
    message: 'Clerk configuration test',
    config: {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
      secretKey: process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing',
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'Not set',
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'Not set',
    },
    auth: {
      isAuthenticated: !!userId,
      userId: userId || 'Not authenticated',
      sessionId: sessionId || 'No session',
      orgId: orgId || 'No organization',
    },
    instance: {
      domain: 'discrete-mutt-21.clerk.accounts.dev',
      jwksUrl: 'https://discrete-mutt-21.clerk.accounts.dev/.well-known/jwks.json',
    },
  });
}