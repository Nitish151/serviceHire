/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use standalone output only for Docker builds (not Vercel)
  ...(process.env.DOCKER_BUILD === 'true' && { output: 'standalone' }),
  // CRITICAL: Explicitly set the environment variable with fallback
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://slotswapper-backend-sx7f.onrender.com/api',
  },
  // Log during build - Force rebuild v2
  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log('🔧 [BUILD v2] NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL || 'NOT SET - USING FALLBACK');
      console.log('🔧 [BUILD v2] Fallback URL = https://slotswapper-backend-sx7f.onrender.com/api');
    }
    return config;
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
