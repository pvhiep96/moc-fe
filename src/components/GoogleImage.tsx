'use client';

import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { googleSrcSet, sizedImageUrl } from '@/utils/media';

// Google Drive (lh3) thỉnh thoảng trả 429 khi bị gọi nhiều request song song → thử lại vài lần
const MAX_RETRIES = 2;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'onLoad' | 'onError'> & {
  src: string;
  /** width cho thuộc tính src (fallback) */
  width?: number;
  /** các width cho srcSet; bỏ trống = chỉ dùng src */
  widths?: number[];
  /** gọi khi ảnh đã tải xong hoặc đã hết lượt thử lại */
  onSettled?: (ok: boolean) => void;
  /** ẩn ảnh (opacity 0) cho tới khi tải xong, tránh hiện icon ảnh vỡ */
  hideUntilLoaded?: boolean;
};

/** <img> cho ảnh Google Drive: resize qua CDN của Google, tự retry khi lỗi */
export default function GoogleImage({
  src,
  width = 1600,
  widths,
  onSettled,
  hideUntilLoaded = false,
  style,
  alt = '',
  ...rest
}: Props) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Ảnh có thể đã nằm trong cache trước khi React gắn onLoad
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
      onSettled?.(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleError = () => {
    if (attempt < MAX_RETRIES) {
      // Lệch width 1px → URL khác nên trình duyệt sẽ tải lại thay vì dùng kết quả lỗi
      setTimeout(() => setAttempt((a) => a + 1), 1500 * (attempt + 1));
    } else {
      onSettled?.(false);
    }
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      {...rest}
      alt={alt}
      // Google Drive chặn (429) request có Referer từ domain lạ → không gửi Referer
      referrerPolicy="no-referrer"
      src={sizedImageUrl(src, width + attempt)}
      srcSet={widths ? googleSrcSet(src, widths.map((w) => w + attempt)) : undefined}
      onLoad={() => {
        setLoaded(true);
        onSettled?.(true);
      }}
      onError={handleError}
      style={
        hideUntilLoaded
          ? { ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }
          : style
      }
    />
  );
}
