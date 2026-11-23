'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Project } from '@/types/project';
import { getCardImages, hasHoverVideo } from '@/types/project';

const CARD_SIZES = '(max-width: 768px) 50vw, 33vw';

type Props = {
  project: Project;
  priority?: boolean;
};

/**
 * Card project ở trang chủ.
 * - State hover nằm trong card → hover 1 card không re-render cả lưới.
 * - Chỉ tải ảnh đầu tiên; các ảnh còn lại chỉ tải sau lần hover đầu tiên.
 * - Video dọc chỉ được gắn src khi card sắp vào viewport, và chỉ tải metadata.
 */
function ProjectCard({ project, priority = false }: Props) {
  const images = getCardImages(project);
  const showVideo = hasHoverVideo(project);

  const [hovered, setHovered] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Đổi ảnh mỗi giây khi hover
  useEffect(() => {
    if (!hovered || showVideo || images.length < 2) return;
    const timer = setInterval(() => {
      setImageIndex((i) => (i + 1) % images.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [hovered, showVideo, images.length]);

  const handleEnter = () => {
    setHovered(true);
    setHasHovered(true);
    setImageIndex(0);
  };

  const handleLeave = () => {
    setHovered(false);
    setImageIndex(0);
  };

  return (
    <Link
      href={`/projects/${project.id}`}
      data-edit-project={project.id}
      data-edit-project-name={project.name}
      className="relative block aspect-[4/5] overflow-hidden group"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="relative w-full h-full">
        {showVideo ? (
          <HoverVideo src={project.video_vertical!.video_url} playing={hovered} />
        ) : images.length > 0 ? (
          images.map((imageUrl, index) => {
            // Ảnh phụ chỉ render sau khi người dùng hover lần đầu
            if (index > 0 && !hasHovered) return null;
            return (
              <div
                key={imageUrl}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === imageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt={`${project.name} - Image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes={CARD_SIZES}
                  priority={priority && index === 0}
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300"></div>
        )}

        <div
          className={`absolute inset-0 transition-opacity duration-300 flex items-start justify-start ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-14 bg-gradient-to-b from-black/70 to-transparent z-0 pointer-events-none" />
          <h3
            className="text-[#E2BA1C] text-xl pl-3 pt-3 pb-3 font-bold tracking-wider w-full z-10 uppercase relative"
            style={{ fontFamily: "'Lexend Exa', sans-serif" }}
          >
            {project.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function HoverVideo({ src, playing }: { src: string; playing: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  // Chỉ gắn src khi card cách viewport < 1 màn hình
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !inView) return;
    if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, inView]);

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        src={inView ? src : undefined}
        muted
        playsInline
        loop
        preload="metadata"
        className="w-full h-full object-cover"
        onLoadedMetadata={(e) => {
          // Hiển thị frame đầu thay vì màn hình đen
          if (e.currentTarget.currentTime === 0) e.currentTarget.currentTime = 0.1;
        }}
      />
    </div>
  );
}

export default memo(ProjectCard);
