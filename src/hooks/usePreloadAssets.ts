import { useState, useEffect } from 'react';

interface PreloadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Hook to preload images and videos
 * @param images Array of image URLs to preload
 * @param videos Array of video URLs to preload
 * @param options Options for preloading
 * @returns Object with loading status and progress
 */
export function usePreloadAssets(
  images: string[] = [],
  videos: string[] = [],
  options: PreloadOptions = {}
) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const totalAssets = images.length + videos.length;

  useEffect(() => {
    if (totalAssets === 0) {
      setIsLoading(false);
      setProgress(100);
      if (options.onProgress) options.onProgress(100);
      if (options.onComplete) options.onComplete();
      return;
    }

    let loadedAssets = 0;
    const updateProgress = () => {
      loadedAssets++;
      setLoadedCount(loadedAssets);
      
      const newProgress = Math.round((loadedAssets / totalAssets) * 100);
      setProgress(newProgress);
      
      if (options.onProgress) {
        options.onProgress(newProgress);
      }
      
      if (loadedAssets === totalAssets) {
        setIsLoading(false);
        if (options.onComplete) {
          options.onComplete();
        }
      }
    };

    // Preload images
    images.forEach(src => {
      if (!src) {
        updateProgress();
        return;
      }
      
      const img = new Image();
      img.onload = updateProgress;
      img.onerror = updateProgress; // Count errors as loaded to avoid hanging
      img.src = src;
    });

    // Preload videos
    videos.forEach(src => {
      if (!src) {
        updateProgress();
        return;
      }
      
      const video = document.createElement('video');
      
      // Listen for metadata loaded event
      video.addEventListener('loadedmetadata', updateProgress);
      
      // Handle errors
      video.addEventListener('error', updateProgress);
      
      // Set attributes
      video.preload = 'metadata'; // Just load metadata for faster loading
      video.src = src;
      
      // Start loading
      video.load();
    });

    // Cleanup function
    return () => {
      // No cleanup needed as we're not storing references to the elements
    };
  }, [images, videos, totalAssets, options]);

  return { isLoading, progress, loadedCount, totalAssets };
}
