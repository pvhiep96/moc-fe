'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePreloadAssets } from '@/hooks/usePreloadAssets';

interface LoadingScreenProps {
  onComplete?: () => void;
  initialProgress?: number;
  simulateApiLoading?: boolean;
  imagesToPreload?: string[];
  videosToPreload?: string[];
  preloadAssets?: boolean;
}

export default function LoadingScreen({
  onComplete,
  initialProgress = 0,
  simulateApiLoading = true,
  imagesToPreload = [],
  videosToPreload = [],
  preloadAssets = false
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [loadingText, setLoadingText] = useState('Initializing...');

  // Use the preload hook if assets are provided
  const preloadResult = usePreloadAssets(
    preloadAssets ? imagesToPreload : [],
    preloadAssets ? videosToPreload : [],
    {
      onProgress: (assetProgress) => {
        // Only update if we're in asset preloading mode
        if (preloadAssets) {
          // Scale asset loading to 30-90% of total progress
          const scaledProgress = 30 + (assetProgress * 0.6);
          setProgress(scaledProgress);
        }
      },
      fullVideoPreload: true, // Preload toàn bộ video
      useCache: true // Sử dụng cache
    }
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Update loading text based on progress
    if (progress < 30) {
      setLoadingText('Initializing...');
    } else if (progress < 60) {
      setLoadingText(preloadAssets ? 'Preloading assets...' : 'Connecting to API...');
    } else if (progress < 80) {
      setLoadingText(preloadAssets ? 'Processing assets...' : 'Loading data...');
    } else if (progress < 95) {
      setLoadingText('Preparing application...');
    } else {
      setLoadingText('Ready!');
    }

    // If we're preloading assets, only simulate the first 30% and last 10%
    if (preloadAssets) {
      if (progress < 30) {
        // Initial loading simulation (0-30%)
        interval = setInterval(() => {
          setProgress((prevProgress) => {
            if (prevProgress >= 30) {
              clearInterval(interval);
              return 30;
            }
            return calculateNextProgress(prevProgress, 0, 30);
          });
        }, 50);
      } else if (progress >= 90 && progress < 100) {
        // Final loading simulation (90-100%)
        interval = setInterval(() => {
          setProgress((prevProgress) => {
            if (prevProgress >= 100) {
              clearInterval(interval);
              if (onComplete) setTimeout(onComplete, 500);
              return 100;
            }
            return calculateNextProgress(prevProgress, 90, 100);
          });
        }, 50);
      } else if (progress >= 100 && onComplete) {
        setTimeout(onComplete, 500);
      }
    } else if (simulateApiLoading) {
      // Original simulation for non-asset loading
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = calculateNextProgress(prevProgress, 0, 100);

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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onComplete, simulateApiLoading, progress, preloadAssets, preloadResult.progress]);

  // When asset preloading is complete, move to final stage
  useEffect(() => {
    if (preloadAssets && !preloadResult.isLoading && progress < 90) {
      setProgress(90);
    }
  }, [preloadResult.isLoading, preloadAssets, progress]);

  // Calculate next progress in a way that simulates realistic loading
  const calculateNextProgress = (current: number, min: number = 0, max: number = 100): number => {
    const range = max - min;
    const normalizedCurrent = current - min;
    const normalizedMax = range;

    let increment;

    // Initial burst of progress (0-30% of range)
    if (normalizedCurrent < normalizedMax * 0.3) {
      increment = range * 0.015;
    }
    // Slow down at 30-50% (simulating API connection)
    else if (normalizedCurrent < normalizedMax * 0.5) {
      increment = range * 0.005;
    }
    // Very slow at 50-80% (simulating data processing)
    else if (normalizedCurrent < normalizedMax * 0.8) {
      increment = range * 0.003;
    }
    // Final push (80-100%)
    else {
      increment = range * 0.008;
    }

    return Math.min(current + increment, max);
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