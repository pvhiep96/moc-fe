import type { Metadata } from 'next';
import ProjectDetailClient from '@/components/project/ProjectDetailClient';
import { fetchProject } from '@/services/server';
import { sizedImageUrl } from '@/utils/media';
import './video.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProject(id);
  const title = project?.name || `Project ${id}`;

  const firstDescription = project?.descriptions?.[0]?.content || project?.description || '';
  const description =
    firstDescription.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 160) ||
    'Project details from Moc Productions';

  const thumbnail = project?.thumbnails?.[0]?.image_url || project?.cover_image || project?.images?.[0];
  const ogImage = thumbnail ? sizedImageUrl(thumbnail, 1200, false) /* JPEG cho Facebook/Zalo */ : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, alt: title }] : [],
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Moc Productions',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await fetchProject(id);
  return <ProjectDetailClient id={id} initialProject={project} />;
}
