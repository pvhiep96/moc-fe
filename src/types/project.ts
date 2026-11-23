export type VideoVertical = {
  url: string;
  video_url: string;
  has_uploaded_video: boolean;
  video_type: 'file' | 'youtube' | null;
};

export type OrderedContentItem = {
  id: number;
  type: string; // 'images' | 'description' | 'video'
  position: number;
  image_url?: string;
  content?: string;
  url?: string;
};

export type Project = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  tags?: string[];
  cover_image?: string | null;
  hover_image?: string | null;
  thumbnails?: { id: number; image_url: string }[];
  images: string[];
  video_urls: { url: string }[];
  show_video?: boolean;
  video_vertical?: VideoVertical | null;
  descriptions?: { id: number; content: string; position_display: number }[];
  ordered_content?: OrderedContentItem[];
};

/** Ảnh dùng cho card ở trang chủ: thumbnails → images (tối đa 6) → cover */
export function getCardImages(project: Project): string[] {
  if (project.thumbnails && project.thumbnails.length > 0) {
    return project.thumbnails.map((t) => t.image_url);
  }
  if (project.images && project.images.length > 0) {
    return project.images.slice(0, 6);
  }
  if (project.cover_image) return [project.cover_image];
  return [];
}

export function hasHoverVideo(project: Project): boolean {
  return Boolean(
    project.show_video &&
      project.video_vertical?.has_uploaded_video &&
      project.video_vertical?.video_type === 'file' &&
      project.video_vertical?.video_url
  );
}
