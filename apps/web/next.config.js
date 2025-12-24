const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore TypeScript errors during build due to legacy/new type conflicts
  // TODO: Fix all type mismatches and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api-proxy',
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/odata/:path*',
        destination: 'http://localhost:4000/odata/:path*',
      },
      {
        source: '/api-proxy/rest/:path*',
        destination: 'http://localhost:4000/rest/:path*',
      },
      {
        source: '/api-proxy/:path*',
        destination: 'http://localhost:4000/:path*',
      },
    ]
  },
};

module.exports = withPWA(nextConfig);
