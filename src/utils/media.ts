// Helpers cho ảnh Google Drive (lh3) và video nhúng (YouTube / Livid / Google Drive Video)

const GOOGLE_IMAGE_HOST = /(^|\.)googleusercontent\.com$/;

/**
 * Ảnh từ backend có dạng https://lh3.googleusercontent.com/d/<id>=s0
 * `=s0` nghĩa là tải ẢNH GỐC (đo thực tế: 16.5MB/ảnh). Đổi sang `=w<width>` để Google
 * trả về ảnh đã resize đúng kích thước cần hiển thị.
 */
export function sizedImageUrl(url: string | null | undefined, width: number, webp = true): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!GOOGLE_IMAGE_HOST.test(parsed.hostname)) return url;
    const base = url.replace(/=[a-z0-9-]+$/i, '');
    // -rw: Google trả về WebP (nhỏ hơn JPEG ~15-30%)
    return `${base}=w${Math.round(width)}${webp ? '-rw' : ''}`;
  } catch {
    return url;
  }
}

export function isGoogleImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return GOOGLE_IMAGE_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** srcSet cho <img> thường (khi không dùng next/image) */
export function googleSrcSet(url: string, widths: number[]): string | undefined {
  if (!isGoogleImage(url)) return undefined;
  return widths.map((w) => `${sizedImageUrl(url, w)} ${w}w`).join(', ');
}

export type VideoSource =
  | { provider: 'youtube'; id: string }
  | { provider: 'livid'; src: string }
  | { provider: 'gdrive'; id: string; src: string };

export function getYouTubeId(url: string): string {
  if (!url) return '';
  if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?/\s]*).*/);
  return match && match[2] && match[2].length === 11 ? match[2] : '';
}

export function getGoogleDriveVideoId(url: string): string {
  if (!url) return '';
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : '';
}

/**
 * Livid (livid.com) – nhúng bằng iframe `https://livid.com/embed/...`.
 * Chấp nhận:
 * - Nguyên đoạn `<iframe src="https://livid.com/embed/...">`
 * - Link embed trực tiếp `https://livid.com/embed/<id>`
 * - Link chia sẻ / xem video `https://livid.com/v/<id>`, `https://livid.com/watch/<id>`, `https://livid.com/videos/<id>`, `https://livid.com/<id>`
 */
export function getLividEmbedUrl(input: string): string {
  if (!input) return '';
  const fromIframe = input.match(/src=["']([^"']+)["']/i);
  const raw = (fromIframe ? fromIframe[1] : input).trim();
  try {
    const parsed = new URL(raw);
    if (!/(^|\.)livid\.com$/i.test(parsed.hostname)) return '';
    parsed.protocol = 'https:';

    if (parsed.pathname.startsWith('/embed/')) {
      return parsed.toString();
    }

    // Tự động chuyển link share/watch của Livid sang /embed/<id>
    const cleanedPath = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (!cleanedPath) return '';

    const segments = cleanedPath.split('/');
    const videoSlug =
      segments.length >= 2 && ['v', 'watch', 'video', 'videos', 'e'].includes(segments[0].toLowerCase())
        ? segments.slice(1).join('/')
        : cleanedPath;

    if (!videoSlug) return '';
    parsed.pathname = `/embed/${videoSlug}`;
    return parsed.toString();
  } catch {
    return '';
  }
}

export function parseVideoSource(url: string): VideoSource | null {
  const livid = getLividEmbedUrl(url);
  if (livid) return { provider: 'livid', src: livid };
  const gdriveId = getGoogleDriveVideoId(url);
  if (gdriveId) {
    return {
      provider: 'gdrive',
      id: gdriveId,
      src: `https://drive.google.com/file/d/${gdriveId}/preview`,
    };
  }
  const id = getYouTubeId(url);
  if (id) return { provider: 'youtube', id };
  return null;
}
