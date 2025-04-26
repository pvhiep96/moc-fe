'use client';

import { useState, useEffect } from 'react';
import apiConfig from '@/utils/apiConfig';

export default function ApiStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    checking: boolean;
    message: string;
  }>({
    connected: false,
    checking: true,
    message: 'Checking API connection...',
  });

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const result = await apiConfig.checkConnection();
        setStatus({
          connected: result.connected,
          checking: false,
          message: result.message,
        });
      } catch (error) {
        setStatus({
          connected: false,
          checking: false,
          message: 'Error checking API connection',
        });
      }
    };

    checkApiStatus();
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`h-2 w-2 rounded-full ${
          status.checking 
            ? 'bg-yellow-500' 
            : status.connected 
              ? 'bg-green-500' 
              : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-gray-400">
        {status.checking 
          ? 'Checking API...' 
          : status.connected 
            ? `API: Connected (${apiConfig.baseUrl.replace(/^https?:\/\//, '')})` 
            : 'API: Disconnected'
        }
      </span>
    </div>
  );
} 