import { useState, useEffect } from 'react';

interface VideoCacheOptions {
  maxCacheAge?: number; // Thời gian tối đa (ms) mà cache được coi là hợp lệ
  onCacheHit?: (url: string) => void;
  onCacheMiss?: (url: string) => void;
}

interface CacheEntry {
  timestamp: number;
  version: string;
}

// Phiên bản cache - thay đổi khi cấu trúc cache thay đổi
const CACHE_VERSION = 'v1';
// Khóa lưu trữ trong localStorage
const CACHE_KEY = 'moc_video_cache';
// Thời gian mặc định cache hợp lệ (7 ngày)
const DEFAULT_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Hook để quản lý cache video
 * @param videoUrls Mảng các URL video cần cache
 * @param options Tùy chọn cấu hình cache
 */
export function useVideoCache(
  videoUrls: string[] = [],
  options: VideoCacheOptions = {}
) {
  const [cachedVideos, setCachedVideos] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const maxCacheAge = options.maxCacheAge || DEFAULT_CACHE_AGE;

  // Khởi tạo cache từ localStorage
  useEffect(() => {
    try {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        const cache = JSON.parse(cacheData) as Record<string, CacheEntry>;
        const now = Date.now();
        const validCache: Record<string, boolean> = {};

        // Kiểm tra từng entry trong cache
        Object.entries(cache).forEach(([url, entry]) => {
          // Kiểm tra phiên bản và thời gian
          if (entry.version === CACHE_VERSION && now - entry.timestamp < maxCacheAge) {
            validCache[url] = true;
            if (options.onCacheHit && videoUrls.includes(url)) {
              options.onCacheHit(url);
            }
          } else if (videoUrls.includes(url)) {
            // Cache không hợp lệ hoặc hết hạn
            if (options.onCacheMiss) {
              options.onCacheMiss(url);
            }
          }
        });

        setCachedVideos(validCache);
      } else {
        // Không có cache
        videoUrls.forEach(url => {
          if (options.onCacheMiss) {
            options.onCacheMiss(url);
          }
        });
      }
    } catch (error) {
      // Xử lý lỗi bằng cách coi như không có cache
      videoUrls.forEach(url => {
        if (options.onCacheMiss) {
          options.onCacheMiss(url);
        }
      });
    }

    setIsInitialized(true);
  }, []);

  // Thêm video vào cache
  const addToCache = (url: string) => {
    try {
      // Đọc cache hiện tại
      const cacheData = localStorage.getItem(CACHE_KEY);
      const cache = cacheData ? JSON.parse(cacheData) : {};

      // Cập nhật cache
      cache[url] = {
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      // Lưu lại vào localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

      // Cập nhật state
      setCachedVideos(prev => ({
        ...prev,
        [url]: true
      }));

      return true;
    } catch (error) {
      return false;
    }
  };

  // Xóa video khỏi cache
  const removeFromCache = (url: string) => {
    try {
      // Đọc cache hiện tại
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (!cacheData) return false;

      const cache = JSON.parse(cacheData);

      // Xóa entry
      if (cache[url]) {
        delete cache[url];

        // Lưu lại vào localStorage
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        // Cập nhật state
        setCachedVideos(prev => {
          const newCache = { ...prev };
          delete newCache[url];
          return newCache;
        });

        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // Xóa toàn bộ cache
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedVideos({});
      return true;
    } catch (error) {
      return false;
    }
  };

  // Kiểm tra xem video có trong cache không
  const isVideoCached = (url: string) => {
    return !!cachedVideos[url];
  };

  return {
    isInitialized,
    cachedVideos,
    isVideoCached,
    addToCache,
    removeFromCache,
    clearCache
  };
}
