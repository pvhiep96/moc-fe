'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  onComplete?: () => void;
  initialProgress?: number;
  simulateApiLoading?: boolean;
}

export default function LoadingScreen({ 
  onComplete, 
  initialProgress = 0,
  simulateApiLoading = true 
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [loadingText, setLoadingText] = useState('Initializing...');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Update loading text based on progress
    if (progress < 30) {
      setLoadingText('Initializing...');
    } else if (progress < 60) {
      setLoadingText('Connecting to API...');
    } else if (progress < 80) {
      setLoadingText('Loading data...');
    } else if (progress < 95) {
      setLoadingText('Preparing application...');
    } else {
      setLoadingText('Ready!');
    }
    
    if (simulateApiLoading) {
      // Simulate realistic API loading with non-linear progress
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = calculateNextProgress(prevProgress);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            if (onComplete) setTimeout(onComplete, 500); // Give time to see 100%
            return 100;
          }
          return newProgress;
        });
      }, 50);
    } else {
      // Simple linear progress
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            if (onComplete) onComplete();
            return 100;
          }
          return prevProgress + 1;
        });
      }, 25);
    }
    
    return () => clearInterval(interval);
  }, [onComplete, simulateApiLoading, progress]);
  
  // Calculate next progress in a way that simulates realistic loading
  const calculateNextProgress = (current: number): number => {
    // Initial burst of progress (0-30%)
    if (current < 30) {
      return current + 1.5;
    }
    // Slow down at 30-50% (simulating API connection)
    else if (current < 50) {
      return current + 0.5;
    }
    // Very slow at 50-80% (simulating data processing)
    else if (current < 80) {
      return current + 0.3;
    }
    // Final push (80-100%)
    else {
      return current + 0.8;
    }
  };
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center justify-center max-w-lg px-4">
        <div className="mb-20 loading-animation">
          <Image 
            src="/moc_nguyen_production_black.png"
            alt="MOC Production Logo"
            width={600}
            height={200}
            priority
            className="w-auto h-auto"
          />
          <p className="text-center text-xl mt-4 font-light tracking-widest">STUDIO</p>
        </div>
        
        <div className="w-full h-px bg-gray-200 relative">
          <div 
            className="absolute top-0 left-0 h-px bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-4 flex justify-between w-full">
          <span className="text-lg font-medium">{Math.round(progress)}%</span>
          <span className="text-sm text-gray-500">{loadingText}</span>
        </div>
      </div>
    </div>
  );
} 