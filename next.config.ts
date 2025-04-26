import type { NextConfig } from "next";

// Get API URL from environment variables with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

// The API base URL without the /api part for rewrites
const getApiBaseUrl = () => {
  const url = API_URL.endsWith('/api') 
    ? API_URL.slice(0, -4) 
    : API_URL;
  
  return url;
};

const nextConfig: NextConfig = {
  /* Base config options */
  reactStrictMode: true,
  poweredByHeader: false,
  
  /* Images config */
  images: {
    domains: ['localhost'], // Add your image domains for production
  },
  
  /* API Proxy configuration */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${getApiBaseUrl()}/api/:path*`,
      },
    ];
  },
  
  /* Environment Config */
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
};

// Debug info during build
// console.log(`🔧 Next.js environment: ${process.env.NODE_ENV}`);
// console.log(`🔧 API URL: ${API_URL}`);

export default nextConfig;
