import axios from 'axios';

// Get API URL from environment variables with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';
const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_ENV === 'development' || process.env.NODE_ENV === 'development';

// For debugging in development mode
if (IS_DEVELOPMENT && typeof window !== 'undefined') {
  console.log(`🔌 API connected to: ${API_URL}`);
}

// Create a base axios instance for the moc-be API
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development
    // if (IS_DEVELOPMENT && typeof window !== 'undefined') {
    //   console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
    // }

    return config;
  },
  (error) => {
    if (IS_DEVELOPMENT && typeof window !== 'undefined') {
      console.error('❌ Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    // if (IS_DEVELOPMENT && typeof window !== 'undefined') {
    //   console.log(`✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
    //     status: response.status,
    //     data: response.data
    //   });
    // }
    return response;
  },
  async (error) => {
    // Handle error cases
    if (error.response) {
      // Log error responses in development
      if (IS_DEVELOPMENT && typeof window !== 'undefined') {
        console.error(`❌ Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response.status,
          data: error.response.data
        });
      }

      // Handle 500 Internal Server Error
      if (error.response.status >= 500) {
        console.error('Server error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Network or timeout error
      if (IS_DEVELOPMENT && typeof window !== 'undefined') {
        console.error('❌ Network Error: No response received', error.request);
      }
    } else {
      // Something happened in setting up the request
      if (IS_DEVELOPMENT && typeof window !== 'undefined') {
        console.error('❌ Error:', error.message);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
