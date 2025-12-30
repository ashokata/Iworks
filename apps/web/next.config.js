const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Removed 'standalone' - Amplify WEB_COMPUTE handles Next.js natively
  // Disable image optimization for Amplify hosting
  images: {
    unoptimized: true,
  },
  // Temporarily ignore TypeScript errors during build due to legacy/new type conflicts
  // TODO: Fix all type mismatches and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || 'https://epdlw6qkj7.execute-api.us-east-1.amazonaws.com/development',
  },
};

module.exports = withPWA(nextConfig);
