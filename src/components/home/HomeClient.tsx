'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { projectsApi } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
import LoadingScreen from '@/components/LoadingScreen';
import DynamicMenuButton from '@/components/DynamicMenuButton';
import DynamicLogo from '@/components/DynamicLogo';
import ProjectCard from '@/components/home/ProjectCard';
import { useIdleAutoScroll } from '@/hooks/useIdleAutoScroll';
import type { Project } from '@/types/project';

// Menu chỉ cần khi người dùng bấm MENU
const MenuOverlay = dynamic(() => import('@/components/MenuOverlay'), { ssr: false });

// Số card đầu tiên (màn hình đầu) được tải ưu tiên
const PRIORITY_CARDS = 3;

export default function HomeClient({ initialProjects }: { initialProjects: Project[] | null }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects ?? []);
  const [loading, setLoading] = useState(initialProjects === null);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Fallback: server không lấy được dữ liệu → fetch phía client như trước
  useEffect(() => {
    if (initialProjects !== null) return;
    projectsApi
      .getAllProjects()
      .then((data: Project[]) => setProjects([...data].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [initialProjects]);

  useIdleAutoScroll(!loading && !menuOpen);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black fade-in">
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <DynamicLogo width={120} height={40} />

      <main className="w-full">
        <div className="w-full">
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded mx-4 mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-20 border border-gray-200 rounded mx-4">
              <p className="text-gray-500">No projects found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index < PRIORITY_CARDS} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
