import { useState, useEffect, useRef } from 'react';
import { useVideoCache } from './useVideoCache';

interface PreloadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  fullVideoPreload?: boolean; // Tùy chọn để preload toàn bộ video thay vì chỉ metadata
  useCache?: boolean; // Tùy chọn để sử dụng cache
}

/**
 * Hook to preload images and videos with caching support
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

  // Tùy chọn mặc định
  const fullVideoPreload = options.fullVideoPreload ?? true; // Mặc định preload toàn bộ video
  const useCache = options.useCache ?? true; // Mặc định sử dụng cache

  // Sử dụng hook cache video
  const videoCache = useVideoCache(videos);

  // Ref để theo dõi video elements đã tạo
  const videoElements = useRef<Record<string, HTMLVideoElement>>({});

  useEffect(() => {
    // Đợi cho đến khi cache được khởi tạo
    if (!videoCache.isInitialized) return;

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

      // Kiểm tra cache nếu được bật
      if (useCache && videoCache.isVideoCached(src)) {
        // Video đã được cache, đánh dấu là đã tải
        updateProgress();
        return;
      }

      const video = document.createElement('video');
      videoElements.current[src] = video;

      // Xử lý sự kiện tải
      if (fullVideoPreload) {
        // Preload toàn bộ video
        video.addEventListener('canplaythrough', () => {
          // Video đã tải đủ để phát mà không bị gián đoạn
          if (useCache) {
            videoCache.addToCache(src);
          }
          updateProgress();
        }, { once: true });
      } else {
        // Chỉ preload metadata
        video.addEventListener('loadedmetadata', () => {
          if (useCache) {
            videoCache.addToCache(src);
          }
          updateProgress();
        }, { once: true });
      }

      // Handle errors
      video.addEventListener('error', () => {
        console.error(`Error loading video: ${src}`);
        updateProgress();
      }, { once: true });

      // Set attributes
      video.muted = true;
      video.preload = fullVideoPreload ? 'auto' : 'metadata';
      video.src = src;

      // Start loading
      video.load();
    });

    // Cleanup function
    return () => {
      // Cleanup video elements
      Object.values(videoElements.current).forEach(video => {
        video.src = '';
        video.load();
      });
      videoElements.current = {};
    };
  }, [images, videos, totalAssets, options, videoCache.isInitialized, fullVideoPreload, useCache]);

  return {
    isLoading,
    progress,
    loadedCount,
    totalAssets,
    cachedVideos: videoCache.cachedVideos,
    clearVideoCache: videoCache.clearCache
  };
}
