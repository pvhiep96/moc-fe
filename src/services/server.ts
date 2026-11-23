// Gọi API từ phía server (Server Components) luôn lấy dữ liệu mới nhất từ Admin.
import type { Project } from '@/types/project';

// API_INTERNAL_URL: URL backend nhìn từ container Next.js (VD: http://backend:3006/api).
// Không đặt thì dùng NEXT_PUBLIC_API_URL.
const API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

export const REVALIDATE_SECONDS = 0;

export type SiteSettings = {
  hero_decade_num?: string;
  hero_caption_left?: string;
  hero_caption_right?: string;
  hero_caption_bl?: string;
  hero_caption_bc?: string;
  hero_caption_br?: string;
  philosophy_line_1?: string;
  philosophy_line_2?: string;
  philosophy_line_3?: string;
  philosophy_line_4?: string;
  philosophy_line_5?: string;
  orbit_title_line_1?: string;
  orbit_title_line_2?: string;
  orbit_reel_label?: string;
  orbit_animation_style?: string;
  marquee_word_1?: string;
  marquee_word_2?: string;
  works_marquee_style?: string;
  works_top_left_label?: string;
  works_top_quote?: string;
  works_top_right_label?: string;
  selected_works_style?: string;
  works_bottom_left_label?: string;
  works_bottom_quote?: string;
  works_bottom_right_label?: string;
  featured_works_style?: string;
  footer_headline?: string;
  footer_mail_label?: string;
  footer_email?: string;
  footer_facebook?: string;
  footer_instagram?: string;
  footer_youtube?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchProjects(): Promise<Project[] | null> {
  const data = await getJson<Project[]>('/v1/projects');
  if (!Array.isArray(data)) return null;
  return [...data].sort((a, b) => b.id - a.id);
}

export async function fetchProject(id: string): Promise<Project | null> {
  if (!/^\d+$/.test(id)) return null;
  return getJson<Project>(`/v1/projects/${id}`);
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  return getJson<SiteSettings>('/v1/projects/site_settings');
}

/** Toàn bộ nội dung chữ / link / ảnh do admin sửa (xem moc-be config/site_content.yml) */
export async function fetchSiteContent(): Promise<Record<string, unknown> | null> {
  const data = await getJson<Record<string, unknown>>('/v1/site_content');
  return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
}
