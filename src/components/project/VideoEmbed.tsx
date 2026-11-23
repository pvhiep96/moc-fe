'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { VideoSource } from '@/utils/media';

// Plyr (~100KB JS + CSS) và YouTube iframe API chỉ được tải khi người dùng bấm play
const PlyrVideoPlayer = dynamic(() => import('@/components/PlyrVideoPlayer'), { ssr: false });

type Props = {
  source: VideoSource;
  title?: string;
  className?: string;
  autoPlay?: boolean;
};

function withAutoPlayParam(url: string, shouldAutoPlay: boolean): string {
  if (!shouldAutoPlay) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('autoplay')) {
      parsed.searchParams.set('autoplay', '1');
    }
    return parsed.toString();
  } catch {
    return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  }
}

/**
 * Video nhúng hỗ trợ phát ngay (autoPlay) hoặc dạng "facade":
 * - YouTube: hiển thị thumbnail + nút play (hoặc phát ngay nếu autoPlay=true).
 * - Google Drive: hiển thị thumbnail Drive + nút play (hoặc nhúng ngay iframe /preview nếu autoPlay=true).
 * - Livid (https://livid.com/): iframe gốc của Livid, tự thêm ?autoplay=1 khi autoPlay=true.
 */
export default function VideoEmbed({
  source,
  title = 'Video',
  className = '',
  autoPlay = false,
}: Props) {
  const [active, setActive] = useState(autoPlay);

  useEffect(() => {
    setActive(autoPlay);
  }, [autoPlay, source]);

  if (source.provider === 'livid') {
    const lividSrc = withAutoPlayParam(source.src, autoPlay || active);
    return (
      <div className={`relative w-full h-full bg-black ${className}`}>
        <iframe
          src={lividSrc}
          title={title}
          loading={autoPlay ? 'eager' : 'lazy'}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  if (source.provider === 'gdrive') {
    if (active) {
      return (
        <div className={`relative w-full h-full bg-black ${className}`}>
          <iframe
            src={withAutoPlayParam(source.src, true)}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label={`Play ${title}`}
        className={`group relative w-full h-full bg-black overflow-hidden cursor-pointer ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://lh3.googleusercontent.com/d/${source.id}=w1280`}
          referrerPolicy="no-referrer"
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </button>
    );
  }

  if (active) {
    // Nếu mở trực tiếp từ nút "Watch Film" (autoPlay=true), nhúng trực tiếp YouTube iframe với autoplay=1
    // để trình duyệt phát ngay lập tức từ thao tác click mà không bị trễ bởi tải chunk JS của Plyr.
    if (autoPlay) {
      return (
        <div className={`relative w-full h-full bg-black ${className}`}>
          <iframe
            src={`https://www.youtube.com/embed/${source.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      );
    }

    return (
      <PlyrVideoPlayer videoId={source.id} playing={true} muted={false} className={`w-full h-full ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play ${title}`}
      className={`group relative w-full h-full bg-black overflow-hidden cursor-pointer ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`}
        srcSet={`https://i.ytimg.com/vi/${source.id}/hqdefault.jpg 480w, https://i.ytimg.com/vi/${source.id}/maxresdefault.jpg 1280w`}
        sizes="(min-width: 768px) 60vw, 100vw"
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
