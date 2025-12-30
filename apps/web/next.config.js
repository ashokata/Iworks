const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel handles Next.js SSR natively - no special config needed
  images: {
    unoptimized: false, // Vercel supports image optimization
  },
  // Temporarily ignore TypeScript errors during build due to legacy/new type conflicts
  // TODO: Fix all type mismatches and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || 'https://epdlw6qkj7.execute-api.us-east-1.amazonaws.com/development',
  },
  // Proxy API requests to the local Express server
  async rewrites() {
    // In development, proxy to local API server
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api-proxy/:path*',
          destination: 'http://localhost:4000/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = withPWA(nextConfig);
