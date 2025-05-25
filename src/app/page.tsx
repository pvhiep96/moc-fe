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
  video_vertical: {
    url: string;
    video_url: string;
    has_uploaded_video: boolean;
    video_type: 'file' | 'youtube' | null;
  }; // Vertical video for home page
};



export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverStates, setHoverStates] = useState<{[key: number]: number}>({});
  const [assetsToPreload, setAssetsToPreload] = useState<{images: string[], videos: string[]}>({
    images: [],
    videos: []
  });
  const hoverTimersRef = useRef<{[key: number]: NodeJS.Timeout}>({});
  const videoPlayersRef = useRef<{[key: number]: any}>({});
  const videoTimestamps = useRef<{[key: number]: number}>({});
  const videoTimestampTimersRef = useRef<{[key: number]: NodeJS.Timeout}>({});
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserActiveRef = useRef(true);
  const scrollPositionRef = useRef(0);
  const scrollDirectionRef = useRef<'down' | 'up'>('down');
  const mainRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);

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

        // Collect assets to preload
        const imagesToPreload: string[] = [];
        const videosToPreload: string[] = [];

        // Limit to first 6 projects to avoid loading too many assets
        const projectsToPreload = data.slice(0, 6);

        projectsToPreload.forEach((project: Project) => {
          // Add cover image and first 2 images from each project
          if (project.cover_image) {
            imagesToPreload.push(project.cover_image);
          }

          if (project.images && project.images.length > 0) {
            // Add first 2 images from each project
            project.images.slice(0, 2).forEach((img: string) => {
              if (img && !imagesToPreload.includes(img)) {
                imagesToPreload.push(img);
              }
            });
          }

          // Add video if available
          if (project.show_video &&
              project.video_vertical?.has_uploaded_video &&
              project.video_vertical?.video_type === 'file' &&
              project.video_vertical?.video_url) {
            videosToPreload.push(project.video_vertical.video_url);
          }
        });

        // Update assets to preload
        setAssetsToPreload({
          images: imagesToPreload,
          videos: videosToPreload
        });
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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all hover timers when component unmounts
      Object.values(hoverTimersRef.current).forEach(timer => clearInterval(timer));

      // Clear all video timestamp timers when component unmounts
      Object.values(videoTimestampTimersRef.current).forEach(timer => clearInterval(timer));
    };
  }, []);



  // Function to handle mouse enter on a project card
  const handleMouseEnter = (projectId: number, imageCount: number, hasVideo: boolean) => {
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
    if (hasVideo) {
      // Sử dụng setTimeout để đảm bảo video player đã được tạo
      setTimeout(() => {
        const player = videoPlayersRef.current[projectId];
        if (player && player instanceof HTMLVideoElement) {
          try {
            // Sử dụng timestamp đã lưu nếu có
            if (videoTimestamps.current[projectId] !== undefined) {
              // Đảm bảo timestamp hợp lệ (không âm và không vượt quá thời lượng video)
              const timestamp = Math.max(0, videoTimestamps.current[projectId]);
              if (timestamp <= player.duration) {
                player.currentTime = timestamp;
              }
            }

            // Phát video
            player.play().catch(err => console.error('Video play failed:', err));

            // Bắt đầu interval để liên tục cập nhật timestamp
            // Dọn dẹp interval cũ nếu có
            if (videoTimestampTimersRef.current[projectId]) {
              clearInterval(videoTimestampTimersRef.current[projectId]);
            }

            // Tạo interval mới để cập nhật timestamp mỗi 100ms
            videoTimestampTimersRef.current[projectId] = setInterval(() => {
              if (player && !player.paused && player.currentTime > 0) {
                // Lưu timestamp hiện tại + 0.1s để bù đắp cho độ trễ
                videoTimestamps.current[projectId] = Math.min(player.currentTime + 0.1, player.duration);
              }
            }, 100);
          } catch (e) {
            console.error('Failed to play video:', e);
          }
        }
      }, 50);
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
        // Dừng interval cập nhật timestamp
        if (videoTimestampTimersRef.current[projectId]) {
          clearInterval(videoTimestampTimersRef.current[projectId]);
          delete videoTimestampTimersRef.current[projectId];
        }

        const player = videoPlayersRef.current[projectId];
        if (player && player instanceof HTMLVideoElement) {
          // Tạm dừng video - timestamp đã được cập nhật liên tục bởi interval
          try {
            player.pause();
          } catch (err) {
            console.error('Failed to pause video:', err);
          }

          // Không cần lưu timestamp ở đây vì đã được cập nhật liên tục bởi interval
          // Nếu muốn đảm bảo, có thể kiểm tra xem timestamp đã được cập nhật chưa
          if (videoTimestamps.current[projectId] === undefined && player.currentTime > 0) {
            videoTimestamps.current[projectId] = player.currentTime;
          }
        }
      } catch (e) {
        console.error('Failed to access player:', e);
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
        }}
        preloadAssets={assetsToPreload.images.length > 0 || assetsToPreload.videos.length > 0}
        imagesToPreload={assetsToPreload.images}
        videosToPreload={assetsToPreload.videos}
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


                const shouldShowVideo = project.show_video && project.video_vertical?.has_uploaded_video && project.video_vertical?.video_type === 'file';

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="relative block aspect-[4/5] overflow-hidden group"
                    onMouseEnter={() => handleMouseEnter(
                      project.id,
                      imageCount,
                      Boolean(shouldShowVideo)
                    )}
                    onMouseLeave={() => handleMouseLeave(project.id, Boolean(shouldShowVideo))}
                  >
                    <div className="relative w-full h-full">
                      {shouldShowVideo && project.video_vertical && project.video_vertical.has_uploaded_video ? (
                        // Video container
                        <div className="absolute inset-0 bg-black">
                          <div className="w-full h-full">
                            <video
                              src={project.video_vertical.video_url}
                              muted
                              playsInline
                              loop
                              preload="auto"
                              className="w-full h-full object-cover"
                              ref={(el) => {
                                if (el) {
                                  videoPlayersRef.current[project.id] = el;

                                  // Khi không hover, hiển thị frame tại thời điểm đã lưu hoặc frame đầu tiên
                                  if (!hoverStates[project.id]) {
                                    if (videoTimestamps.current[project.id] !== undefined) {
                                      // Đảm bảo timestamp hợp lệ (không âm và không vượt quá thời lượng video)
                                      const timestamp = Math.max(0, videoTimestamps.current[project.id]);
                                      // Chỉ đặt currentTime khi video đã tải xong metadata
                                      const setTimestamp = () => {
                                        if (timestamp <= el.duration) {
                                          el.currentTime = timestamp;
                                        }
                                      };

                                      if (el.readyState >= 1) {
                                        setTimestamp();
                                      } else {
                                        // Nếu video chưa tải xong metadata, đăng ký sự kiện loadedmetadata
                                        el.addEventListener('loadedmetadata', setTimestamp, { once: true });
                                      }
                                    } else {
                                      // Nếu chưa có timestamp, đặt thời điểm là 0.1s để hiển thị frame đầu tiên
                                      const setInitialFrame = () => {
                                        el.currentTime = 0.1;
                                      };

                                      if (el.readyState >= 1) {
                                        setInitialFrame();
                                      } else {
                                        el.addEventListener('loadedmetadata', setInitialFrame, { once: true });
                                      }
                                    }
                                  }

                                  // Kiểm tra xem video đã được cache chưa
                                  const videoUrl = project.video_vertical.video_url;
                                  const isCached = localStorage.getItem('moc_video_cache') &&
                                    JSON.parse(localStorage.getItem('moc_video_cache') || '{}')[videoUrl];

                                  // Nếu video đã được cache, sử dụng cache
                                  if (isCached) {
                                    // Đảm bảo video đã tải
                                    if (el.readyState < 1) {
                                      el.load();
                                    }
                                  } else {
                                    // Nếu chưa cache, tải video và thêm vào cache

                                    // Đảm bảo video đã tải
                                    if (el.readyState === 0) {
                                      el.load();
                                    }

                                    // Thêm sự kiện để cache video khi đã tải đủ
                                    const cacheVideo = () => {
                                      try {
                                        const cacheData = localStorage.getItem('moc_video_cache');
                                        const cache = cacheData ? JSON.parse(cacheData) : {};

                                        // Cập nhật cache
                                        cache[videoUrl] = {
                                          timestamp: Date.now(),
                                          version: 'v1'
                                        };

                                        // Lưu lại vào localStorage
                                        localStorage.setItem('moc_video_cache', JSON.stringify(cache));
                                      } catch (error) {
                                        console.error('Error caching video:', error);
                                      }
                                    };

                                    // Đăng ký sự kiện canplaythrough để cache khi video đã tải đủ
                                    el.addEventListener('canplaythrough', cacheVideo, { once: true });
                                  }
                                }
                              }}
                            />
                          </div>
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
                        <h3 className="text-[#E2BA1C] text-xl pl-3 pb-3 font-bold tracking-wider w-full z-10 font-helvetica capitalize">{project.name}</h3>
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
