'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { projectsApi } from '@/services/api';
import LoadingScreen from '@/components/LoadingScreen';
import DynamicMenuButton from '@/components/DynamicMenuButton';
import VideoEmbed from '@/components/project/VideoEmbed';
import GoogleImage from '@/components/GoogleImage';
import { useSiteContent } from '@/content/SiteContentProvider';
import type { OrderedContentItem, Project } from '@/types/project';
import { googleSrcSet, parseVideoSource, sizedImageUrl, type VideoSource } from '@/utils/media';

const MenuOverlay = dynamic(() => import('@/components/MenuOverlay'), { ssr: false });

type ProjectItem =
  | { type: 'image'; src: string; order: number; imageOrder: number }
  | { type: 'description'; content: string; order: number }
  | { type: 'video'; source: VideoSource; order: number };

const IMAGE_WIDTHS = [640, 1080, 1600, 2000];
const IMAGE_SIZES = '(min-width: 768px) 60vw, 100vw';
const DESKTOP_QUERY = '(min-width: 768px)';
// GIF 1x1 trong suốt: dùng trong <picture> để desktop KHÔNG tải ảnh cover của mobile
const BLANK_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Chuyển dữ liệu API thành danh sách item theo thứ tự hiển thị (giữ nguyên logic cũ) */
function buildProjectItems(projectData: Project): ProjectItem[] {
  type RawItem =
    | { type: 'image'; src: string; order: number }
    | { type: 'description'; content: string; order: number }
    | { type: 'video'; source: VideoSource; order: number };
  const raw: RawItem[] = [];
  const projectImages = projectData.images || [];

  if (projectData.ordered_content && projectData.ordered_content.length > 0) {
    projectData.ordered_content.forEach((item: OrderedContentItem) => {
      if (item.type === 'images' && item.image_url) {
        raw.push({ type: 'image', src: item.image_url, order: item.position });
      } else if (item.type === 'description' && item.content) {
        raw.push({ type: 'description', content: item.content, order: item.position });
      } else if (item.type === 'video' && item.url) {
        const source = parseVideoSource(item.url);
        if (source) raw.push({ type: 'video', source, order: item.position });
      }
    });
  } else {
    // Fallback khi API chưa có ordered_content
    if (projectData.descriptions && projectData.descriptions.length > 0) {
      const sortedDescriptions = [...projectData.descriptions].sort((a, b) => a.position_display - b.position_display);
      const maxPosition = Math.max(...sortedDescriptions.map((d) => d.position_display));
      const limitedImages = projectImages.slice(0, maxPosition - 1);
      let imageIndex = 0;
      sortedDescriptions.forEach((desc) => {
        raw.push({ type: 'description', content: desc.content, order: desc.position_display });
        const nextDescPos =
          sortedDescriptions.find((d) => d.position_display > desc.position_display)?.position_display ||
          Number.MAX_SAFE_INTEGER;
        const imagesToAdd = nextDescPos - desc.position_display - 1;
        for (let i = 0; i < imagesToAdd && imageIndex < limitedImages.length; i++) {
          raw.push({ type: 'image', src: limitedImages[imageIndex], order: desc.position_display + i + 1 });
          imageIndex++;
        }
      });
    } else {
      projectImages.slice(0, 10).forEach((src, i) => raw.push({ type: 'image', src, order: i + 1 }));
    }

    raw.sort((a, b) => a.order - b.order);
    let nextOrder = raw.length > 0 ? raw[raw.length - 1].order + 1 : 1;
    (projectData.video_urls || []).forEach((video) => {
      const source = parseVideoSource(video.url);
      if (source) raw.push({ type: 'video', source, order: nextOrder++ });
    });
  }

  raw.sort((a, b) => a.order - b.order);

  // Số thứ tự ảnh (bỏ qua description/video) dùng cho bộ đếm
  let imageCount = 0;
  return raw.map((item): ProjectItem => (item.type === 'image' ? { ...item, imageOrder: ++imageCount } : item));
}

export default function ProjectDetailClient({ id, initialProject }: { id: string; initialProject: Project | null }) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [loading, setLoading] = useState(initialProject === null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Fallback: server không lấy được dữ liệu → fetch phía client
  useEffect(() => {
    if (initialProject !== null) return;
    projectsApi
      .getProject(Number(id) || id)
      .then((data: Project) => setProject(data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id, initialProject]);

  const items = useMemo(() => (project ? buildProjectItems(project) : []), [project]);
  const projectName = project?.name ? project.name.toUpperCase() : `Project ${id}`;
  const { t, e } = useSiteContent();
  const coverImage = project?.images?.[0];

  // Khóa cuộn dọc của body trên desktop
  useEffect(() => {
    document.body.classList.add('horizontal-scroll');
    return () => document.body.classList.remove('horizontal-scroll');
  }, []);

  // Desktop: lăn chuột dọc → cuộn ngang; tự cuộn khi người dùng không thao tác
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || loading) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let frame = 0;
    let lastTime = 0;
    let position = 0;
    let finished = false; // đã tới cuối → tắt auto-scroll vĩnh viễn

    const maxScroll = () => slider.scrollWidth - slider.clientWidth;

    const tick = (time: number) => {
      const dt = lastTime ? Math.min(time - lastTime, 100) : 0;
      lastTime = time;
      const max = maxScroll();
      const speed = Math.max(40, max / 120); // ~2 phút cho toàn bộ dải ảnh
      position = Math.min(max, position + (speed * dt) / 1000);
      slider.scrollTo({ left: position, behavior: 'instant' });
      if (position >= max - 1) {
        finished = true;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const startAutoScroll = () => {
      if (finished || !desktop.matches) return;
      position = slider.scrollLeft;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    };

    const onActivity = (delay = 3000) => {
      cancelAnimationFrame(frame);
      if (idleTimer) clearTimeout(idleTimer);
      if (!finished) idleTimer = setTimeout(startAutoScroll, delay);
    };
    const handleActivity = () => onActivity();

    const handleWheel = (e: WheelEvent) => {
      onActivity();
      if (!desktop.matches) return;
      e.preventDefault();
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.deltaY;
      // Touchpad: delta nhỏ & liên tục → cuộn tức thì; chuột: cuộn mượt theo nấc
      const isTouchpad = e.deltaMode === 0 && Math.abs(delta) < 40;
      slider.scrollBy({
        left: horizontal ? delta : delta * (isTouchpad ? 1.5 : 3),
        behavior: isTouchpad ? 'instant' : 'smooth',
      });
    };

    const handleScroll = () => {
      if (slider.scrollLeft >= maxScroll() - 5) finished = true;
    };

    const activityEvents = ['mousemove', 'click', 'touchstart', 'keydown'] as const;
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    window.addEventListener('wheel', handleWheel, { passive: false });
    slider.addEventListener('scroll', handleScroll, { passive: true });
    onActivity(5000);

    return () => {
      cancelAnimationFrame(frame);
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
      window.removeEventListener('wheel', handleWheel);
      slider.removeEventListener('scroll', handleScroll);
    };
  }, [loading]);

  // Bộ đếm ảnh: số thứ tự lớn nhất trong các ảnh đang hiển thị ≥ 30%
  // (IntersectionObserver thay cho 2 interval 300ms + getBoundingClientRect liên tục)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || items.length === 0) return;
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const order = Number((entry.target as HTMLElement).dataset.order);
          if (entry.intersectionRatio >= 0.3) visible.add(order);
          else visible.delete(order);
        });
        if (visible.size > 0) setCurrentIndex(Math.max(...visible));
      },
      { root: window.matchMedia(DESKTOP_QUERY).matches ? slider : null, threshold: [0, 0.3, 0.6, 1] }
    );
    slider.querySelectorAll<HTMLElement>('[data-countable="true"]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white">
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm py-4 flex justify-center items-center">
        <Link href="/">
          <Image
            unoptimized
            priority
            src="/moc-logo.webp"
            alt="Moc Productions"
            width={150}
            height={79}
            className="w-[120px] md:w-[150px] h-auto cursor-pointer"
          />
        </Link>
      </div>

      <header className="fixed inset-x-0 pl-8 top-20 z-50 flex items-center justify-between bg-transparent">
        <div className="hidden md:block">
          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-all duration-300"
          >
            <ArrowIcon className="transform rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="uppercase tracking-wider" {...e('project_back_label')}>{t('project_back_label')}</span>
          </Link>
        </div>
        <div className="hidden md:block pr-8">
          <Link
            href={`/projects/${id}/detail`}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-all duration-300"
          >
            <span className="uppercase tracking-wider" {...e('project_view_detail_label')}>{t('project_view_detail_label')}</span>
            <ArrowIcon className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </header>

      <Link
        href="/"
        className="md:hidden fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 text-sm font-medium z-50 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-md"
      >
        <ArrowIcon size={20} className="transform rotate-180" />
        <span className="uppercase tracking-wider">Back</span>
      </Link>

      <Link
        href={`/projects/${id}/detail`}
        className="md:hidden fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 text-sm font-medium z-50 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-md"
      >
        <span className="uppercase tracking-wider" {...e('project_view_detail_label')}>{t('project_view_detail_label')}</span>
        <ArrowIcon size={20} />
      </Link>

      <main className="pt-[80px] md:h-screen md:pt-[120px]">
        {/* Mobile: ảnh cover + tên project (desktop nhận GIF rỗng nên không tải ảnh này) */}
        {coverImage && (
          <div className="md:hidden w-full relative">
            <picture>
              <source media={DESKTOP_QUERY} srcSet={BLANK_GIF} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sizedImageUrl(coverImage, 1080)}
                srcSet={googleSrcSet(coverImage, IMAGE_WIDTHS)}
                sizes="100vw"
                alt="Project cover"
                referrerPolicy="no-referrer"
                fetchPriority="high"
                className="w-full object-contain"
              />
            </picture>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-white px-4 mb-4" style={{ fontFamily: "'Lexend Exa', sans-serif" }}>
                  {projectName}
                </h1>
                <div className="text-sm text-white animate-bounce" {...e('project_scroll_hint')}>{t('project_scroll_hint')} ↓</div>
              </div>
            </div>
          </div>
        )}

        {/* 1 DOM duy nhất cho cả 2 layout: desktop cuộn ngang, mobile xếp dọc */}
        <div
          ref={sliderRef}
          data-edit-project={project?.id ?? id}
          data-edit-project-name={project?.name}
          className="flex flex-col pb-[45px] w-full md:flex-row md:overflow-x-auto md:overflow-y-hidden md:h-[calc(100vh-120px)] md:px-4 md:gap-16 md:pt-[25px] md:pb-[25px] horizontal-scroll-container"
        >
          <div className="hidden md:flex h-full flex-shrink-0 items-center justify-center">
            <h1 className="text-5xl font-bold text-black text-center" style={{ fontFamily: "'Lexend Exa', sans-serif" }}>
              {projectName}
            </h1>
          </div>

          {items.map((item, index) => {
            if (item.type === 'description') {
              return (
                <div
                  key={`desc-${index}`}
                  className="w-full py-8 px-4 md:w-auto md:p-0 md:h-full md:flex-shrink-0 md:relative md:flex md:items-center md:justify-center"
                >
                  <div
                    className="text-black text-xl md:text-2xl font-medium max-w-3xl mx-auto font-mon-cheri md:max-w-md md:mx-0"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              );
            }

            if (item.type === 'video') {
              return (
                <div
                  key={`video-${index}`}
                  data-type="video"
                  className="w-full py-4 md:w-auto md:py-0 md:h-full md:flex-shrink-0 md:relative md:flex md:items-center md:justify-center"
                >
                  <div className="aspect-video w-full max-w-4xl mx-auto md:h-full md:max-h-[80vh] md:w-auto md:max-w-none md:mx-0 video-container">
                    <VideoEmbed source={item.source} title={`${projectName} video`} />
                  </div>
                </div>
              );
            }

            return (
              <ProjectImage
                key={`img-${index}`}
                src={item.src}
                order={item.imageOrder}
                alt={`Project item ${item.imageOrder}`}
                eager={item.imageOrder <= 2}
              />
            );
          })}
        </div>

        <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-black hidden md:block">
          <span {...e('project_scroll_hint')}>{t('project_scroll_hint')}</span>
          <span className="ml-2 inline-block animate-bounce">→</span>
        </div>

        <div className="hidden md:flex fixed bottom-8 left-8 z-50 bg-white text-black px-4 py-2 rounded-full font-medium items-center shadow-md pointer-events-none">
          <span key={currentIndex} id="image-counter" className="text-3xl font-light counter-pop">
            {currentIndex}
          </span>
        </div>
      </main>
    </div>
  );
}

/**
 * Ảnh trong dải cuộn: lazy-load, srcset resize qua Google CDN, tự retry khi Google trả 429.
 * Giữ chỗ (min-width/min-height) khi chưa tải để các ảnh phía sau không "dồn"
 * vào viewport và bị tải cùng lúc.
 */
function ProjectImage({ src, order, alt, eager }: { src: string; order: number; alt: string; eager: boolean }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      data-order={order}
      data-type="image"
      data-countable="true"
      className={`w-full relative md:w-auto md:h-full md:flex-shrink-0 md:flex md:items-center md:justify-center ${
        loaded ? '' : 'min-h-[50vh] md:min-h-0 md:min-w-[40vw] bg-neutral-100'
      }`}
    >
      <GoogleImage
        src={src}
        widths={IMAGE_WIDTHS}
        sizes={IMAGE_SIZES}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={order === 1 ? 'high' : undefined}
        decoding="async"
        onSettled={() => setLoaded(true)}
        className="w-full object-contain md:w-auto md:max-h-full md:max-w-full"
      />
    </div>
  );
}

function ArrowIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
