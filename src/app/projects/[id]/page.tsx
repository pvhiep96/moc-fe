'use client';

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { projectsApi } from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandler'

// Định nghĩa kiểu dữ liệu cho các phần tử hiển thị
type ProjectItem = {
  type: 'image' | 'description' | 'video'
  content: string; // URL cho ảnh hoặc nội dung cho description
  order: number; // Thứ tự hiển thị
}

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

const ProjectDetail = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [projectImages, setProjectImages] = useState<string[]>([])
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState(`Project ${id}`)
  const [currentIndex, setCurrentIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Add state to track if auto-scroll should be permanently disabled
  const [autoScrollDisabled, setAutoScrollDisabled] = useState(false);

  // Add auto-scroll related states and refs
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

    // Add wheel event handler to stop auto-scroll when user scrolls
    const handleWheel = () => {
      setIsMouseIdle(false);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    // Add scroll event handler to detect all types of scrolling
    const handleScroll = () => {
      // Immediately stop auto-scroll when user manually scrolls
      setIsMouseIdle(false);

      // Check if scrolled to the end and disable auto-scroll permanently
      if (sliderRef.current) {
        const scrollLeft = sliderRef.current.scrollLeft;
        const scrollWidth = sliderRef.current.scrollWidth;
        const clientWidth = sliderRef.current.clientWidth;
        // Check if near the end (within a small threshold like 5px)
        if (scrollLeft >= scrollWidth - clientWidth - 5) {
          setAutoScrollDisabled(true);
        }
      }

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    // Add touchmove event handler to detect scrolling on touch devices
    const handleTouchMove = () => {
      setIsMouseIdle(false);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

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
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchmove', handleTouchMove);

    // Add event listener to the slider element specifically for both desktop and mobile
    if (sliderRef.current) {
      sliderRef.current.addEventListener('scroll', handleScroll);
      sliderRef.current.addEventListener('wheel', handleWheel);
      sliderRef.current.addEventListener('touchmove', handleTouchMove);

      // Add keyboard navigation detection
      sliderRef.current.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          handleMouseMove();
        }
      });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleTouchMove);

      // Clean up slider scroll event
      if (sliderRef.current) {
        sliderRef.current.removeEventListener('scroll', handleScroll);
        sliderRef.current.removeEventListener('wheel', handleWheel);
        sliderRef.current.removeEventListener('touchmove', handleTouchMove);
        sliderRef.current.removeEventListener('keydown', handleMouseMove);
      }

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, []);

  // Smooth auto-scroll implementation for desktop horizontal scroll only
  useEffect(() => {
    // Only start auto-scroll if it's not permanently disabled
    if (isMouseIdle && !loading && !autoScrollDisabled && sliderRef.current) {
      let startTime: number | null = null;
      let startPosition = sliderRef.current.scrollLeft;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      const scrollDuration = 120000; // Tăng thời gian để scroll chậm hơn

      const smoothScroll = (timestamp: number) => {
        // Add an extra check inside the animation frame as well
        if (!sliderRef.current || autoScrollDisabled) {
          if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
          }
          return;
        }

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // Calculate how far to scroll based on elapsed time
        const scrollProgress = elapsed / scrollDuration;
        const scrollDistance = maxScroll * scrollProgress;

        // Apply easing for smoother motion
        const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const easedProgress = easeInOutQuad(scrollProgress);
        const newPosition = startPosition + (maxScroll * easedProgress);

        // Reset when we reach the end
        // if (newPosition >= maxScroll || scrollProgress >= 1) {
        //   startTime = timestamp;
        //   startPosition = 0;
        //   sliderRef.current.scrollLeft = 0;
        // } else {
        sliderRef.current.scrollLeft = newPosition;
        // }

        scrollAnimationRef.current = requestAnimationFrame(smoothScroll);
      };

      // Only auto-scroll on desktop
      if (window.innerWidth >= 768) {
        // Đảm bảy animation frame trước đó nếu có
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
        scrollAnimationRef.current = requestAnimationFrame(smoothScroll);
      }

      return () => {
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
        }
      };
    } else if (scrollAnimationRef.current) {
      // Ensure animation stops if conditions are no longer met (e.g., autoScrollDisabled becomes true)
      cancelAnimationFrame(scrollAnimationRef.current);
    }
  }, [isMouseIdle, loading, autoScrollDisabled]); // Add autoScrollDisabled to dependency array

  useEffect(() => {
    if (!id) return

    // Set loading state at the beginning
    setLoading(true)
    setLoadingProgress(0)

    // Start loading progress animation
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          return 90; // Stay at 90% until images are actually loaded
        }
        return Math.floor(prev + 1);
      });
    }, 30);

    const loadData = async () => {
      try {
        // Fetch project data from API
        const projectData = await projectsApi.getProject(Number(id) || id);

        // Fetch project with images
        const projectWithImages = await projectsApi.getProjectWithReloadedImages(Number(id) || id);

        // Set project name
        setProjectName(projectData.name ? projectData.name.toUpperCase() : `Project ${id}`);

        // Get images
        const projectImages = projectWithImages.images || [];
        setProjectImages(projectImages.map((img: string) => `${img}`));

        // Create items array
        const items: ProjectItem[] = [];

        // Add descriptions from the project
        if (projectData.descriptions && projectData.descriptions.length > 0) {
          // Sort descriptions by position_display
          const sortedDescriptions = [...projectData.descriptions].sort((a, b) => a.position_display - b.position_display);

          // Add descriptions and images in alternating pattern
          sortedDescriptions.forEach((desc, index) => {
            // Add description
            items.push({
              type: 'description',
              content: desc.content,
              order: index * 2 + 1 // Odd numbers for descriptions
            });

            // Add image if available
            if (projectImages[index]) {
              items.push({
                type: 'image',
                content: projectImages[index],
                order: index * 2 + 2 // Even numbers for images
              });
            }
          });

          // Add remaining images
          for (let i = sortedDescriptions.length; i < projectImages.length; i++) {
            items.push({
              type: 'image',
              content: projectImages[i],
              order: sortedDescriptions.length * 2 + i + 1
            });
          }
        } else {
          // Fallback to default content pattern if no descriptions
          if (id === '1') {
            // Content for Project 1
            items.push(
              {
                type: 'description',
                content: '✨ Huy and Thanh\'s wedding day was a beautiful celebration of love and commitment. Their ceremony was filled with heartfelt moments, surrounded by family and friends who came to witness their special day.',
                order: 1
              },
              { type: 'image', content: projectImages[0] || '', order: 2 },
              { type: 'image', content: projectImages[1] || '', order: 3 },
              {
                type: 'description',
                content: '💚 Every detail of their wedding reflected their personalities and the journey they\'ve shared together. From the emotional exchange of vows to the joyful celebration afterward, it was a day filled with love and happiness.',
                order: 4
              },
              { type: 'image', content: projectImages[2] || '', order: 5 },
              { type: 'image', content: projectImages[3] || '', order: 6 },
              { type: 'image', content: projectImages[4] || '', order: 7 },
              {
                type: 'description',
                content: 'The wedding film of Huy and Thanh captures all these beautiful moments. Check out the link below to watch their full wedding video ❤️',
                order: 8
              }
            );
          } else {
            // Content for Project 2
            items.push(
              {
                type: 'description',
                content: '✨ For Trinh and Minh, love is not just about emotions; it\'s a daily choice and a commitment to stand by each other for a lifetime. This garden shone brilliantly during their intimate wedding ceremony, bathed in the warm glow of the sunset and surrounded by family and loved ones.',
                order: 1
              },
              { type: 'image', content: projectImages[0] || '', order: 2 },
              { type: 'image', content: projectImages[1] || '', order: 3 },
              {
                type: 'description',
                content: '💚 Everything, from the moment Trinh walked down the aisle, Minh gently wiping away his tears, to the exchange of vows, heartfelt wishes from their parents, and the song Trinh sang to Minh, contributed to a beautiful and sweet afternoon.',
                order: 4
              },
              { type: 'image', content: projectImages[2] || '', order: 5 },
              { type: 'image', content: projectImages[3] || '', order: 6 },
              { type: 'image', content: projectImages[4] || '', order: 7 },
              {
                type: 'description',
                content: 'The wedding film of Trinh and Minh is officially out now, and we couldn\'t be more excited to share their beautiful love story with you! Check out the link below to watch the full wedding video ❤️',
                order: 8
              }
            );
          }
        }

        // Add video if available
        if (projectData.video_urls && projectData.video_urls.length > 0) {
          const videoUrl = projectData.video_urls[0].url;
          const videoId = getYouTubeId(videoUrl);
          if (videoId) {
            items.push({
              type: 'video',
              content: `//www.youtube.com/embed/${videoId}`,
              order: 1000 // Always at the end
            });
          }
        }

        // Sort by order
        items.sort((a, b) => a.order - b.order);
        setProjectItems(items);

        // Complete the loading progress
        setLoadingProgress(100);

        // Short delay before removing loading screen
        setTimeout(() => {
          setLoading(false);
        }, 500);

        // Clear the progress interval
        clearInterval(progressInterval);
      } catch (error) {
        console.error('Error loading project data:', error);
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      }
    }

    // Start loading data
    loadData();

    return () => {
      clearInterval(progressInterval);
    };
  }, [id])

  // Helper function to extract YouTube video ID
  const getYouTubeId = (url: string): string => {
    if (!url) return '';

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : '';
  };

  // Add scroll event listener to track current image
  useEffect(() => {
    const handleScroll = () => {
      if (!sliderRef.current) return;

      const scrollLeft = sliderRef.current.scrollLeft;
      const containerWidth = sliderRef.current.clientWidth;

      // Calculate image width based on responsive sizes
      let imageWidth = containerWidth * 0.8; // Mobile default
      if (window.innerWidth >= 1024) {
        imageWidth = containerWidth * 0.4; // Desktop
      } else if (window.innerWidth >= 768) {
        imageWidth = containerWidth * 0.6; // Tablet
      }

      // Account for the gap (8 * 4 = 32px) and first slide (project name)
      const gapWidth = 32;
      const firstSlideWidth = imageWidth + gapWidth;
      const adjustedScroll = scrollLeft - firstSlideWidth;

      // Calculate current index (0 is project name, 1+ are images)
      let index = 0;
      if (adjustedScroll > 0) {
        index = Math.round(adjustedScroll / (imageWidth + gapWidth)) + 1;
      } else if (scrollLeft > imageWidth / 2) {
        index = 1;
      }

      // Clamp index to valid range
      index = Math.max(0, Math.min(index, projectImages.length));
      setCurrentIndex(index);
    };

    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', handleScroll);
      return () => slider.removeEventListener('scroll', handleScroll);
    }
  }, [projectImages.length]);

  // Add loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Update the loading UI
  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-black">
        <div className="text-center px-4">
          <h1 className="mb-6 animate-fade-in-delayed text-4xl md:text-6xl font-bold opacity-0">
            Loading Project
            <br />
            {projectName}
          </h1>
        </div>
        <div className="absolute bottom-8 left-8 font-mono text-lg md:text-2xl">{Math.floor(loadingProgress)}%</div>
      </div>
    )
  }

  // Component để hiển thị description
  const DescriptionBlock = ({ content }: { content: string }) => (
    <div className="w-full py-8 px-4 md:px-16">
      <div 
        className="text-black text-xl md:text-2xl font-medium max-w-3xl mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );

  // Component để hiển thị video
  const VideoBlock = ({ embedUrl }: { embedUrl: string }) => (
    <div className="w-full py-4 flex justify-center">
      <div className="aspect-video w-full max-w-4xl">
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="shadow-lg"
        ></iframe>
      </div>
    </div>
  );

  // Component để hiển thị HTML từ chuỗi
  const HtmlBlock = ({ htmlContent }: { htmlContent: string }) => (
    <div className="w-full py-4 flex justify-center"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed header with logo at the top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm py-4 flex justify-center items-center">
        <Link href="/">
          <Image src="/moc_nguyen_production_black.png" alt="Moc Productions" width={150} height={50} className="w-[120px] md:w-[150px] cursor-pointer" />
        </Link>
      </div>

      <header className="fixed inset-x-0 pl-8 top-20 z-50 flex items-center justify-between bg-transparent">
        <div className="hidden md:block">
          <Link
            href="/"
            className="px-2 py-4 text-2xl font-bold text-black transition-colors duration-500"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', letterSpacing: '0.1em', textShadow: '0px 0px 3px rgba(0,0,0,0.3)' }}
          >
            BACK
          </Link>
        </div>
      </header>

      {/* Remove the old logo positions */}
      {/* Nút Back sticky phía dưới bên phải cho mobile */}
      <Link
        href="/moc-productions"
        className="md:hidden fixed bottom-4 right-4 px-4 py-2 text-xl font-bold z-50 bg-white/80 backdrop-blur-sm rounded-full text-black"
      >
        BACK
      </Link>

      <main className="h-screen pt-[80px] md:pt-[120px]">
        {/* Desktop view - horizontal scroll */}
        <div
          ref={sliderRef}
          className="hidden md:flex md:overflow-x-auto h-[calc(100vh-120px)] w-full px-4 md:gap-16 pt-[25px] pt-[25px] pb-[25px] md:overflow-y-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Project title */}
          <div className="h-full flex-shrink-0 flex items-center justify-center">
            <h1 className="text-5xl font-bold text-black text-center">
              {projectName}
            </h1>
          </div>

          {/* YouTube Video - ngay sau project name */}

          {/* Horizontal items for desktop */}
          {projectItems.map((item, index) => {
            if (item.type === 'description') {
              return (
                <div
                  key={`desc-${index}`}
                  className="h-full flex-shrink-0 relative flex items-center justify-center"
                >
                  <div 
                    className="max-w-md text-xl md:text-2xl font-medium text-black"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              );
            } else if (item.type === 'video' as 'image' | 'description' | 'video') {
              return (
                <div
                  key={`video-${index}`}
                  className="h-full flex-shrink-0 relative flex items-center justify-center"
                >
                  <div className="w-[560px] h-[315px]">
                    <iframe
                      width="560"
                      height="315"
                      src={item.content}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={`img-${index}`}
                  className="h-full flex-shrink-0 relative flex items-center justify-center"
                >
                  <img
                    src={item.content}
                    alt={`Project item ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              );
            }
          })}
          <div className="h-full flex-shrink-0 relative flex items-center justify-center">
            <div className="w-full h-full">
              <iframe
                width="1000"
                height="100%"
                src="//www.youtube.com/embed/9u-1TKRSkBk"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Mobile view - 1 item mỗi hàng với chiều cao nguyên bản */}
        <div className="md:hidden">
          {/* Ảnh đầu tiên với tên project ở giữa cho mobile */}
          {projectImages.length > 0 && (
            <div className="w-full relative">
              <img
                src={projectImages[0]}
                alt="Project cover"
                className="w-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white px-4 mb-4">
                    {projectName}
                  </h1>
                  <div className="text-sm text-white animate-bounce">
                    Scroll down to view more ↓
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* YouTube Video cho mobile - ngay sau ảnh cover */}

          {/* Các items còn lại cho mobile */}
          <div className="flex flex-col">
            {projectItems.map((item, index) => {
              if (item.type === 'description') {
                return <DescriptionBlock key={`desc-${index}`} content={item.content} />;
              } else if (item.type === 'video' as 'image' | 'description' | 'video') {
                return <VideoBlock key={`video-${index}`} embedUrl={item.content} />;
              } else {
                return (
                  <div
                    key={`img-${index}`}
                    className="w-full relative"
                  >
                    <img
                      src={item.content}
                      alt={`Project item ${index + 1}`}
                      className="w-full object-contain"
                    />
                  </div>
                );
              }
            })}
          </div>
          <div className="w-full">
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src="//www.youtube.com/embed/9u-1TKRSkBk"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="shadow-lg"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Scroll indicator - only visible on desktop */}
        <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-black hidden md:block">
          <span className="hidden md:inline">Scroll to view more</span>
          <span className="ml-2 hidden md:inline-block md:animate-bounce">→</span>
        </div>
      </main>
    </div>
  )
}

export default ProjectDetail
