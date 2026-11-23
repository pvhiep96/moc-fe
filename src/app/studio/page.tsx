import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { fetchProjects } from '@/services/server';

export const metadata: Metadata = {
  title: 'All Works & Gallery',
  description:
    'Explore wedding films and photography collections crafted by MOC Nguyen Productions.',
};

export const dynamic = 'force-dynamic';

export default async function StudioGalleryPage() {
  const projects = await fetchProjects();
  return <HomeClient initialProjects={projects} />;
}
