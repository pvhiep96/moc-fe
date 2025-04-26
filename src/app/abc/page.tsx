'use client';

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Head from 'next/head'; // Import Head
import Plyr from 'plyr'; // Import Plyr
import 'plyr/dist/plyr.css'; // Import Plyr CSS
import { projectsApi } from '@/services/api';

// Định nghĩa kiểu dữ liệu cho Project
type Project = {
  id: number;
  name: string;
  description: string;
  cover_image: string | null;
  hover_image: string | null;
  images: string[];
  video_urls: { url: string }[];
  show_video?: boolean;
  descriptions: { id: number; content: string; position_display: number }[];
};

const ImageSlideshow = ({
  images,
  showImages,
  isOrganized,
  projectName = "Huy & Thanh",
  projectId,
}: {
  images: string[]
  showImages: boolean
  isOrganized: boolean
  projectName?: string
  projectId: number
}) => {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const randomPosition = {
    top: `${Math.random() * 60 + 20}%`,
    left: `${Math.random() * 60 + 20}%`,
    zIndex: Math.floor(Math.random() * 10),
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isHovered, images.length])

  const handleClick = () => {
    router.push(`/projects/${projectId}`)
  }

  return (
    <div
      className={`group relative overflow-hidden cursor-pointer ${showImages ? 'opacity-100' : 'opacity-0'} ${isOrganized ? 'duration-2000 transform-none transition-all ease-in-out' : 'transition-none'
        } pb-[125%]`}
      style={
        !isOrganized
          ? {
            position: 'absolute',
            ...randomPosition,
          }
          : undefined
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setCurrentIndex(0)
      }}
      onClick={handleClick}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`${projectName} image ${index + 1}`}
          className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
        />
      ))}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute bottom-4 left-4 text-white font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {projectName}
      </div>
    </div>
  )
}


const VideoComponent = ({
  videoId,
  showImages,
  isOrganized,
  projectName,
  projectId,
}: {
  videoId: string;
  showImages: boolean;
  isOrganized: boolean;
  projectName: string;
  projectId: number;
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const plyrContainerRef = useRef<HTMLDivElement>(null);
  const plyrInstanceRef = useRef<Plyr | null>(null);
  const randomPosition = {
    top: `${Math.random() * 60 + 20}%`,
    left: `${Math.random() * 60 + 20}%`,
    zIndex: Math.floor(Math.random() * 10),
  };

  // Initialize Plyr for Video component
  useEffect(() => {
    if (plyrContainerRef.current && (isOrganized || showImages)) {
      try {
        const player = new Plyr(plyrContainerRef.current, {
          controls: [],
          hideControls: true,
          muted: true,
          autoplay: false,
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
          }
        });
        plyrInstanceRef.current = player;

        return () => {
          if (plyrInstanceRef.current) {
            plyrInstanceRef.current.destroy();
            plyrInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error('Error initializing Plyr:', error);
      }
    }
  }, [isOrganized, showImages]);

  // Handle hover play/pause
  useEffect(() => {
    const player = plyrInstanceRef.current;
    if (!player) return;

    const playVideo = () => {
      try {
        if (player && player.source) {
          try {
            const playPromise = player.play();
            if (playPromise !== undefined) {
              playPromise.catch((e: Error) => console.error("Error playing:", e));
            }
          } catch (error) {
            console.error("Error playing:", error);
          }
        } else {
          player.once('ready', () => {
            try {
              const playPromise = player.play();
              if (playPromise !== undefined) {
                playPromise.catch((e: Error) => console.error("Error playing on ready:", e));
              }
            } catch (error) {
              console.error("Error playing on ready:", error);
            }
          });
        }
      } catch (error) {
        console.error('Error in playVideo:', error);
      }
    };

    const pauseVideo = () => {
      try {
        if (player && player.source) {
          player.pause();
        }
      } catch (error) {
        console.error('Error in pauseVideo:', error);
      }
    };

    if (isHovered) {
      const timerId = setTimeout(playVideo, 50);
      return () => clearTimeout(timerId);
    } else {
      pauseVideo();
    }
  }, [isHovered]);

  const handleClick = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div
      className={`group relative overflow-hidden cursor-pointer ${showImages ? 'opacity-100' : 'opacity-0'} ${isOrganized ? 'duration-2000 transform-none transition-all ease-in-out' : 'transition-none'
        } pb-[125%]`}
      style={
        !isOrganized
          ? {
            position: 'absolute',
            ...randomPosition,
          }
          : undefined
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        ref={plyrContainerRef}
        className="plyr__video-embed absolute inset-0 w-full h-full"
        style={{ ['--plyr-video-background' as string]: 'transparent' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?origin=${typeof window !== 'undefined' ? window.location.origin : ''}&autoplay=0&controls=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&widgetid=1&mute=0`}
          allowFullScreen
          allowTransparency
          allow="autoplay"
        ></iframe>
      </div>

      {/* Overlay and Project Name */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
      <div className="absolute bottom-4 left-4 text-white font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {projectName}
      </div>
    </div>
  );
};


const HomePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showImages, setShowImages] = useState(false)
  const [isOrganized, setIsOrganized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // State for projects
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [isMouseIdle, setIsMouseIdle] = useState(false)
  const mouseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scrollAnimationRef = useRef<number | null>(null)

  // Add mouse movement tracking
  useEffect(() => {
    const handleMouseMove = () => {
      setIsMouseIdle(false);

      // Clear existing timer
      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      // Set new timer - consider mouse idle after 3 seconds of inactivity
      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    // Initialize mouse idle state after page load
    mouseTimerRef.current = setTimeout(() => {
      setIsMouseIdle(true);
    }, 5000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);
    window.addEventListener('wheel', handleMouseMove);
    // window.addEventListener('scroll', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      window.removeEventListener('wheel', handleMouseMove);
      // window.removeEventListener('scroll', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, []);

  // Smooth auto-scroll implementation
  useEffect(() => {
    if (isMouseIdle && isOrganized && !isLoading) {
      let startTime: number | null = null;
      let startPosition = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollDuration = 15000; // Time to scroll through entire page (ms)

      const smoothScroll = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // Calculate how far to scroll based on elapsed time
        const scrollProgress = elapsed / scrollDuration;
        const scrollDistance = maxScroll * scrollProgress;

        // Apply easing for smoother motion
        const newPosition = startPosition + scrollDistance;

        // Reset when we reach the bottom
        if (newPosition >= maxScroll) {
          startTime = timestamp;
          startPosition = 0;
          window.scrollTo(0, 0);
        } else {
          window.scrollTo(0, newPosition);
        }

        scrollAnimationRef.current = requestAnimationFrame(smoothScroll);
      };

      scrollAnimationRef.current = requestAnimationFrame(smoothScroll);

      return () => {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
      };
    } else if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
  }, [isMouseIdle, isOrganized, isLoading]);

  // Fetch projects using API
  useEffect(() => {
    let dataLoadedCount = 0;

    const loadData = async () => {
      try {
        // Fetch projects from API
        const projectsData = await projectsApi.getAllProjects();
        
        if (!Array.isArray(projectsData)) {
          console.error('Invalid response format: not an array');
          setError('Invalid response format from API');
          return;
        }
        
        // Fetch details for each project
        const detailedProjects = await Promise.all(
          projectsData.map(async (project) => {
            try {
              // Get project details
              const projectDetail = await projectsApi.getProject(project.id);
              
              // Get project images
              const projectWithImages = await projectsApi.getProjectWithReloadedImages(project.id);
              
              return {
                ...projectDetail,
                images: projectWithImages?.images || []
              };
            } catch (error) {
              console.error(`Error fetching details for project ${project.id}:`, error);
              return {
                ...project,
                images: []
              };
            }
          })
        );
        
        // Update state
        setProjects(detailedProjects);
        dataLoadedCount = detailedProjects.length || 0;

      } catch (error) {
        console.error('Error loading project data:', error);
        setError('Failed to load projects');
      }
    };

    loadData();

    // Handle the loading progress animation
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Chỉ tiếp tục khi projects đã "tải" xong
          if (dataLoadedCount > 0) {
            setShowImages(true);
            setTimeout(() => {
              setIsLoading(false);
              setTimeout(() => {
                setIsOrganized(true);
              }, 100);
            }, 100);
          } else {
            return 95; // Giữ ở 95% nếu chưa tải xong
          }
          return 100;
        }

        // Làm chậm tiến trình gần 95% nếu chưa tải xong
        if (prev >= 90 && dataLoadedCount === 0) {
          return Math.min(95, Math.floor(prev + 1));
        }

        return Math.floor(prev + 1);
      });
    }, 20);

    return () => {
      clearInterval(progressInterval);
    };
  }, []); // Chỉ chạy một lần khi mount

  // Helper function to extract YouTube ID from URL
  const getYouTubeId = (url: string): string => {
    if (!url) return '';
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : '';
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-white text-white">
      <Head>
        {/* Keep the Plyr custom styles */}
        <style>{`
           .plyr iframe[id^='youtube-'] { /* Target Plyr's YouTube iframe */
             height: 200% !important;
             top: -50% !important;
             position: absolute !important;
             opacity: 1 !important;
             pointer-events: none; /* Crucial: Prevent iframe from stealing events */
           }
           .plyr--video {
             width: 100%!important;
             height: 100%!important;
             position: absolute!important;
             overflow: hidden;
             background: transparent !important;
           }
           .plyr__poster {
             background-size: cover !important;
             opacity: 1 !important;
             transition: opacity 0.3s ease-in-out;
             z-index: 1;
           }
           .plyr--playing .plyr__poster,
           .plyr--hover .plyr__poster { /* Hide poster on hover/play */
             opacity: 0 !important;
             pointer-events: none;
           }
           /* Ensure the direct iframe also doesn't block pointer events initially */
           .plyr__video-embed > iframe {
              pointer-events: none;
           }
         `}</style>
      </Head>
      {isLoading ? (
        <div className="relative flex h-screen w-full flex-col items-center justify-center bg-white text-black">
          <div className="text-center px-4">
            <h1 className="mb-6 animate-fade-in-delayed text-4xl md:text-6xl lg:text-8xl font-bold opacity-0">
              Welcome to
              <br />
              Mốc Nguyễn Productions
            </h1>
          </div>
          <div className="absolute bottom-8 left-8 font-mono text-lg md:text-2xl">{Math.floor(loadingProgress)}%</div>
        </div>
      ) : error ? (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-black p-4">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-6 text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Modify the header classes and the Image classes */}
          <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-center p-4 md:p-8"> {/* Added backdrop-blur-sm and hover effect */}
            {/* The animate-fade-in class should eventually set opacity to 1 */}
            <div className="animate-fade-in text-2xl font-bold text-black opacity-0 transition-colors duration-300 hover:bg-white/20 backdrop-blur-sm"> {/* Keep animation */}
              {/* Increase size slightly and add drop shadow */}
              <a href="/">
                <Image
                  src="/moc_nguyen_production_black.png"
                  alt="Moc Productions"
                  width={120} // Slightly increase base width prop
                  height={120} // Adjust height accordingly
                  className='w-[140px] md:w-[180px] filter drop-shadow-sm' // Increased Tailwind width, added filter drop-shadow
                  priority
                />
              </a>
            </div>
          </header>

          <main className="flex min-h-screen flex-col items-center justify-start">
            <section className="relative w-full">
              {/* Container for projects */}
              <div className={`${!isOrganized ? 'h-screen w-full relative' : 'grid grid-cols-2 md:grid-cols-3 w-full'}`}>
                {/* Display projects dynamically */}
                {projects.length > 0 ? (
                  projects.map((project) => {
                    // Kiểm tra project có video và show_video = true
                    const hasVideo = project.video_urls && project.video_urls.length > 0 && project.show_video === true;
                    
                    if (hasVideo && project.video_urls[0]?.url) {
                      const videoId = getYouTubeId(project.video_urls[0].url);
                      
                      if (videoId) {
                        return (
                          <VideoComponent
                            key={`project-${project.id}`}
                            videoId={videoId}
                            showImages={showImages}
                            isOrganized={isOrganized}
                            projectName={project.name}
                            projectId={project.id}
                          />
                        );
                      }
                    }
                    
                    // Hiển thị hình ảnh nếu không có video hoặc show_video không phải là true
                    if (project.images && project.images.length > 0) {
                      return (
                        <ImageSlideshow
                          key={`project-${project.id}`}
                          images={project.images.slice(0, 6)}
                          showImages={showImages}
                          isOrganized={isOrganized}
                          projectName={project.name}
                          projectId={project.id}
                        />
                      );
                    }
                    
                    return null;
                  })
                ) : (
                  <div className="col-span-full flex items-center justify-center p-8 text-black">
                    <p>No projects found. Please add some projects.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  )
}

export default HomePage 