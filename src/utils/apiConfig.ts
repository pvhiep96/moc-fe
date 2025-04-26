'use client';

import apiClient from '@/lib/axios';

// API configuration with environment-specific settings
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api',
  environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',
  
  // Check if we're in development mode
  isDevelopment: () => {
    return apiConfig.environment === 'development';
  },
  
  // Check if we're in production mode
  isProduction: () => {
    return apiConfig.environment === 'production';
  },
  
  // Helper to check API connection status
  checkConnection: async () => {
    try {
      // Try to ping the API or get a health check endpoint
      const response = await apiClient.get('/health');
      return {
        connected: true,
        status: response.status,
        message: 'Connected to API successfully',
        data: response.data
      };
    } catch (error: any) {
      // Special case: if the health endpoint doesn't exist, try the root
      if (error.response?.status === 404) {
        try {
          const rootResponse = await apiClient.get('/');
          return {
            connected: true,
            status: rootResponse.status,
            message: 'Connected to API (root endpoint)',
            data: null
          };
        } catch (rootError) {
          return {
            connected: false,
            status: null,
            message: 'API root endpoint not accessible',
            error: rootError
          };
        }
      }
      
      return {
        connected: false,
        status: error.response?.status || null,
        message: 'Failed to connect to API',
        error
      };
    }
  },
  
  // Function to get the full URL for an API endpoint
  getUrl: (path: string) => {
    const base = apiConfig.baseUrl.endsWith('/') 
      ? apiConfig.baseUrl.slice(0, -1) 
      : apiConfig.baseUrl;
    
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }
};

export default apiConfig; 