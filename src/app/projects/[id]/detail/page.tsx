'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectsApi } from '@/services/api';
import LoadingScreen from '@/components/LoadingScreen';
import Image from 'next/image';
import Link from 'next/link';
import MenuOverlay from '@/components/MenuOverlay';
import DynamicMenuButton from '@/components/DynamicMenuButton';

type Project = {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  hover_image: string;
  images: string[];
  all_images: string[];
  video_urls: { url: string }[];
  descriptions: { id: number; content: string; position_display: number }[];
};

export default function ProjectDetail() {
  const params = useParams();
  const id = params?.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Disable scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (!id) {
          setError('Project ID is missing');
          setLoading(false);
          return;
        }
        const data = await projectsApi.getProjectWithAllImages(Number(id));
        setProject(data);
      } catch (err) {
        setError('Failed to load project');
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div>Project not found</div>;

  // Lightbox controls
  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + project.all_images.length) % project.all_images.length);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % project.all_images.length);

  // VideoBlock giống trang projects/[id]
  const VideoBlock = ({ embedUrl }: { embedUrl: string }) => (
    <div className="w-full py-4 flex justify-center">
      <div className="aspect-video w-full max-w-4xl">
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="shadow-lg"
        ></iframe>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dynamic Menu Button with color changing based on background */}
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Fixed header with logo at the top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm py-4 flex justify-center items-center">
        <Link href="/">
          <Image
            src="/moc_nguyen_production_black.png"
            alt="Moc Productions"
            width={150}
            height={50}
            className="w-[120px] md:w-[150px] cursor-pointer"
            priority
          />
        </Link>
      </div>

      <header className="fixed inset-x-0 pl-8 top-20 z-50 flex items-center justify-between bg-transparent]">
        <div className="hidden md:block">
          <Link
            href={`/projects/${id}`}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-all duration-300"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180 group-hover:-translate-x-1 transition-transform duration-300">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="uppercase tracking-wider">Back to project</span>
          </Link>
        </div>
      </header>

      {/* Nút Back sticky phía dưới bên phải cho mobile */}
      <Link
        href={`/projects/${id}`}
        className="md:hidden fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 text-sm font-medium z-50 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-md"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="uppercase tracking-wider">Back</span>
      </Link>

      <div className="container mx-auto px-4 py-8 pt-[80px] md:pt-[145px]">

      <h1 className="text-3xl font-bold mb-6 mt-6">{project.name}</h1>
      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${activeTab === 'images' ? 'border-black' : 'border-transparent'} hover:cursor-pointer`}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('images')}
        >Ảnh</button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition ${activeTab === 'videos' ? 'border-black' : 'border-transparent'} hover:cursor-pointer`}
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('videos')}
        >Video</button>
      </div>
      {/* Tab content */}
      {activeTab === 'images' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {project.all_images.map((image, idx) => (
            <div key={idx} className="relative aspect-[9/12] cursor-pointer group overflow-hidden project-card" onClick={() => openLightbox(idx)}>
              <img
                src={image}
                alt={`${project.name} - Image ${idx + 1}`}
                className="object-cover w-full h-full project-image transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'videos' && project.video_urls && project.video_urls.length > 0 && (
        <>
          <div className="flex flex-col items-center gap-8 mb-8">
            {project.video_urls.map((video, idx) => {
              const embedUrl = `https://www.youtube.com/embed/${video.url}`;
              return <VideoBlock key={idx} embedUrl={embedUrl} />;
            })}
          </div>
        </>

      )}
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl">&#8592;</button>
          <img
            src={project.all_images[lightboxIndex]}
            alt={`Ảnh ${lightboxIndex + 1}`}
            className="max-h-[100vh] max-w-[100vw] rounded shadow-lg"
            draggable={false}
          />
          <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl">&#8594;</button>
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-2xl bg-black/80 rounded-full p-3 hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer transition"
            aria-label="Đóng xem ảnh lớn"
            autoFocus
            style={{ minWidth: 48, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >&#10005;</button>
        </div>
      )}


      {/* Project Descriptions */}
      {project.descriptions && project.descriptions.length > 0 && (
        <div className="prose max-w-none mt-8">
          {project.descriptions
            .sort((a, b) => a.position_display - b.position_display)
            .map((desc) => (
              <div key={desc.id} className="mb-6" dangerouslySetInnerHTML={{ __html: desc.content }} />
            ))}
        </div>
      )}
      </div>
    </div>
  );
}
