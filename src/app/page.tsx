'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { projectsApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorHandler";
import LoadingScreen from '@/components/LoadingScreen';
import dynamic from 'next/dynamic';

// Metadata is defined in app/page.metadata.ts

// Lazy load components to avoid SSR issues
const PlyrVideoPlayer = dynamic(() => import('@/components/PlyrVideoPlayer'), { ssr: false });
const MenuOverlay = dynamic(() => import('@/components/MenuOverlay'), { ssr: false });
const DynamicMenuButton = dynamic(() => import('@/components/DynamicMenuButton'), { ssr: false });
const DynamicLogo = dynamic(() => import('@/components/DynamicLogo'), { ssr: false });

type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  tags: string[];
  cover_image?: string; // Main project image
  hover_image?: string; // Image to show on hover
  images: string[]; // All project images
  video_urls: { url: string }[]; // Project videos
  show_video?: boolean; // Whether to show video instead of images on home page
  video_vertical: { url: string }; // Vertical video for home page
};

// Function to extract YouTube video ID from various URL formats
const getYouTubeId = (url: string): string => {
  // Try to match ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  // Return the ID if found, otherwise return the original string
  // (might be a direct ID already)
  return (match && match[2].length === 11) ? match[2] : url;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverStates, setHoverStates] = useState<{[key: number]: number}>({});
  const hoverTimersRef = useRef<{[key: number]: NodeJS.Timeout}>({});
  const videoPlayersRef = useRef<{[key: number]: any}>({});
  const videoTimestamps = useRef<{[key: number]: number}>({});
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserActiveRef = useRef(true);
  const scrollPositionRef = useRef(0);
  const scrollDirectionRef = useRef<'down' | 'up'>('down');
  const mainRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);

    // YouTube API is loaded automatically by ReactPlayer

    return () => {
      // Clean up
    };
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsApi.getAllProjects();
        setProjects(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setProjectsLoading(false);
      }
    };

    if (mounted) {
      fetchProjects();
    }
  }, [mounted]);

  // Setup auto-scrolling
  useEffect(() => {
    if (!mounted || projectsLoading) return;

    const startAutoScroll = () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);

      autoScrollRef.current = setInterval(() => {
        if (!isUserActiveRef.current && mainRef.current) {
          // Get current scroll position
          const currentPosition = window.scrollY;
          const maxScroll = document.body.scrollHeight - window.innerHeight - 10;

          // Check if we need to reverse direction
          if (currentPosition >= maxScroll && scrollDirectionRef.current === 'down') {
            scrollDirectionRef.current = 'up';
          } else if (currentPosition <= 10 && scrollDirectionRef.current === 'up') {
            scrollDirectionRef.current = 'down';
          }

          // Scroll based on direction
          if (scrollDirectionRef.current === 'down') {
            window.scrollTo({
              top: currentPosition + 1,
              behavior: 'auto'
            });
          } else {
            window.scrollTo({
              top: currentPosition - 1,
              behavior: 'auto'
            });
          }
        }
      }, 30);
    };

    const resetInactivityTimer = () => {
      isUserActiveRef.current = true;

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        isUserActiveRef.current = false;
      }, 3000); // Start auto-scrolling after 3 seconds of inactivity
    };

    // Track user activity
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Track scroll position to detect user scrolling
    const handleScroll = () => {
      const currentPosition = window.scrollY;

      // If scroll position changed significantly, consider user active
      if (Math.abs(currentPosition - scrollPositionRef.current) > 5) {
        resetInactivityTimer();
      }

      scrollPositionRef.current = currentPosition;
    };

    // Start auto-scroll initially
    startAutoScroll();
    resetInactivityTimer();

    // Add event listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Cleanup
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mounted, projectsLoading]);

  // Cleanup hover timers on unmount
  useEffect(() => {
    return () => {
      // Clear all hover timers when component unmounts
      Object.values(hoverTimersRef.current).forEach(timer => clearInterval(timer));
    };
  }, []);

  // Get high quality thumbnail URL for YouTube video
  const getHighQualityThumbnail = (videoId: string) => {
    // Use maxresdefault for highest quality, fallback to hqdefault
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Function to handle mouse enter on a project card
  const handleMouseEnter = (projectId: number, imageCount: number, hasVideo: boolean, videoUrl?: string) => {
    // Handle image rotation for projects with multiple images
    if (imageCount > 1) {
      // Clear any existing timer for this project
      if (hoverTimersRef.current[projectId]) {
        clearInterval(hoverTimersRef.current[projectId]);
      }

      // Start with index 0
      setHoverStates(prev => ({ ...prev, [projectId]: 0 }));

      // Set up an interval to cycle through images
      const timer = setInterval(() => {
        setHoverStates(prev => {
          const currentIndex = prev[projectId] ?? 0;
          const nextIndex = (currentIndex + 1) % imageCount;
          return { ...prev, [projectId]: nextIndex };
        });
      }, 1000); // Change image every second

      hoverTimersRef.current[projectId] = timer;
    } else {
      // Just set hover state for the project
      setHoverStates(prev => ({ ...prev, [projectId]: 0 }));
    }

    // Handle video
    if (hasVideo && videoUrl) {
      // videoUrl là ID trực tiếp từ API
      if (videoPlayersRef.current[projectId]) {
        try {
          const player = videoPlayersRef.current[projectId];
          // Resume from saved timestamp if available
          const timestamp = videoTimestamps.current[projectId] || 0;

          try {
            // Kiểm tra xem player có phương thức seek không
            if (typeof player.seek === 'function') {
              player.seek(timestamp);
            } else if ('currentTime' in player) {
              // Fallback: Sử dụng thuộc tính currentTime
              player.currentTime = timestamp;
            }
          } catch (err) {
            // console.warn('Could not seek to timestamp:', err);
          }

          try {
            // Kiểm tra xem player có phương thức play không
            if (typeof player.play === 'function') {
              player.play();
            } else {
              // Fallback: Thử cách khác nếu không có phương thức play
              const iframe = player.elements?.container?.querySelector('iframe');
              if (iframe) {
                // Thêm tham số autoplay=1 vào URL của iframe
                let src = iframe.src;
                if (!src.includes('autoplay=1')) {
                  src = src.replace('autoplay=0', 'autoplay=1');
                  if (!src.includes('autoplay=')) {
                    src += '&autoplay=1';
                  }
                  iframe.src = src;
                }
              }
            }
          } catch (err) {
            // console.error('Failed to play video:', err);
          }
        } catch (e) {
          // console.error('Failed to access player:', e);
        }
      }
    }
  };

  // Function to handle mouse leave
  const handleMouseLeave = (projectId: number, hasVideo: boolean) => {
    // Clear the timer and reset state
    if (hoverTimersRef.current[projectId]) {
      clearInterval(hoverTimersRef.current[projectId]);
      delete hoverTimersRef.current[projectId];
    }

    setHoverStates(prev => {
      const newState = { ...prev };
      delete newState[projectId];
      return newState;
    });

    // Handle video pause and save timestamp
    if (hasVideo) {
      try {
        const player = videoPlayersRef.current[projectId];
        if (player) {
          // Save current timestamp before pausing
          try {
            // Kiểm tra xem player có thuộc tính currentTime không
            if ('currentTime' in player) {
              videoTimestamps.current[projectId] = player.currentTime;
            } else if (typeof player.getCurrentTime === 'function') {
              // Fallback: Sử dụng phương thức getCurrentTime nếu có
              videoTimestamps.current[projectId] = player.getCurrentTime();
            }
          } catch (err) {
            // Ignore if currentTime is not available
            // console.warn('Could not save timestamp:', err);
          }

          // Pause the video
          try {
            // Kiểm tra xem player có phương thức pause không
            if (typeof player.pause === 'function') {
              player.pause();
            } else {
              // Fallback: Thử cách khác nếu không có phương thức pause
              const iframe = player.elements?.container?.querySelector('iframe');
              if (iframe) {
                // Lưu URL hiện tại và thay thế autoplay=1 bằng autoplay=0
                let src = iframe.src;
                src = src.replace('autoplay=1', 'autoplay=0');
                iframe.src = src;
              }
            }
          } catch (err) {
            // console.error('Failed to pause video:', err);
          }
        }
      } catch (e) {
        // console.error('Failed to access player:', e);
      }
    }
  };

  // Handle loading states
  if (!mounted) {
    return (
      <LoadingScreen />
    );
  }

  if (initialLoading && projectsLoading) {
    return (
      <LoadingScreen
        onComplete={() => {
          setInitialLoading(false);
          setTimeout(() => setContentReady(true), 300); // Add slight delay for smoother transition
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black fade-in">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dynamic Menu Button with color changing based on background */}
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Dynamic Logo at top left corner */}
      <DynamicLogo width={120} height={40} />

      {/* Main Content */}
      <main ref={mainRef} className="w-full">
        {/* Projects Gallery Grid */}
        <div className="w-full">
          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded mx-4 mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {projectsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((placeholder) => (
                <div
                  key={placeholder}
                  className="relative block aspect-square overflow-hidden bg-gray-100 animate-pulse"
                >
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 border border-gray-200 rounded mx-4">
              <p className="text-gray-500">No projects found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3">
              {projects.map((project) => {
                // Limit to max 6 images for carousel
                const projectImages = project.images && project.images.length > 0
                  ? project.images.slice(0, 6)
                  : (project.cover_image ? [project.cover_image] : []);
                const imageCount = projectImages.length;
                const currentImageIndex = hoverStates[project.id] || 0;
                const hasVideos = project.video_urls && project.video_urls.length > 0;
                const shouldShowVideo = project.show_video && hasVideos;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="relative block aspect-[9/12] overflow-hidden group"
                    onMouseEnter={() => handleMouseEnter(
                      project.id,
                      imageCount,
                      Boolean(shouldShowVideo),
                      shouldShowVideo ? project.video_vertical.url : undefined
                    )}
                    onMouseLeave={() => handleMouseLeave(project.id, Boolean(shouldShowVideo))}
                  >
                    <div className="relative w-full h-full">
                      {shouldShowVideo ? (
                        // Video container
                        <div className="absolute inset-0 bg-black">
                          {hoverStates[project.id] !== undefined ? (
                            // Show video with PlyrVideoPlayer on hover
                            <div className="w-full h-full">
                              <PlyrVideoPlayer
                                videoId={project.video_vertical.url} // API trả về trực tiếp ID của video
                                playing={true}
                                muted={true}
                                onReady={(player) => {
                                  videoPlayersRef.current[project.id] = player;
                                }}
                              />
                            </div>
                          ) : (
                            // Show high quality thumbnail when not hovering
                            <div className="absolute inset-0">
                              <Image
                                src={getHighQualityThumbnail(project.video_vertical.url)} // API trả về trực tiếp ID của video
                                alt={`${project.name} video thumbnail`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                                quality={95}
                                priority
                              />

                            </div>
                          )}
                        </div>
                      ) : projectImages.length > 0 ? (
                        <>
                          {/* Cycle through images on hover or show first image */}
                          {projectImages.map((imageUrl, index) => (
                            <div
                              key={index}
                              className={`absolute inset-0 transition-opacity duration-500 ${
                                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                              }`}
                            >
                              <Image
                                src={imageUrl}
                                alt={`${project.name} - Image ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                                priority={index === 0}
                              />
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300"></div>
                      )}
                      {/* Project name - controlled by hover state */}
                      <div className={`absolute inset-0 transition-opacity duration-300 flex items-end justify-start ${hoverStates[project.id] !== undefined ? 'opacity-100' : 'opacity-0'}`}>
                        <h3 className="text-white text-xl pl-3 pb-3 font-light tracking-wider w-full bg-[linear-gradient(0deg,rgba(0,0,0,0.5),transparent)] z-10">{project.name}</h3>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
