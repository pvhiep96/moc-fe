import StudioClient from '@/components/studio/StudioClient';
import { fetchProjects } from '@/services/server';
import './studio/studio.css';

export { metadata } from './metadata';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const projects = await fetchProjects();
  // Nội dung chữ lấy từ SiteContentProvider (app/layout.tsx) → xem trước trực tiếp trong admin
  return <StudioClient projects={projects ?? []} />;
}
