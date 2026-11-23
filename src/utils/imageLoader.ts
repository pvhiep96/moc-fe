// Loader toàn cục cho next/image (xem next.config.js → images.loaderFile).
// Ảnh Google Drive được resize ngay trên CDN của Google, nên server Next.js
// không phải tối ưu ảnh (server production chỉ có ~1GB RAM).
// Ảnh local trong /public đã được nén sẵn sang WebP và dùng prop `unoptimized`.
import { isGoogleImage, sizedImageUrl } from './media';

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (isGoogleImage(src)) return sizedImageUrl(src, width);
  return src;
}
