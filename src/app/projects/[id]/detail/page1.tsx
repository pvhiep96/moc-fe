'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { projectsApi } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
import LoadingScreen from '@/components/LoadingScreen';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

type Project = {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  hover_image: string;
  images: string[];
  video_urls: { url: string }[];
  descriptions: { id: number; content: string; position_display: number }[];
};

// Plyr YouTube player component
const PlyrVideoPlayer = ({ videoId }: { videoId: string }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    // Make sure the ref and videoId are available
    if (!videoRef.current || !videoId) return;

    // Clean up any existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Initialize Plyr with YouTube provider
    const player = new Plyr(videoRef.current, {
      // @ts-ignore - provider is a valid option for Plyr but TypeScript definitions might be incomplete
      provider: 'youtube',
      autoplay: false,
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'fullscreen'
      ],
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
      }
    });

    // Store the player instance
    playerRef.current = player;

    // Clean up on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  // Function to extract YouTube video ID from various URL formats
  const getYouTubeId = (url: string): string => {
    // Try to match ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    // Return the ID if found, otherwise return the original string 
    // (might be a direct ID already)
    return (match && match[2].length === 11) ? match[2] : url;
  };

  return (
    <div className="relative w-full h-0 pb-[56.25%]">
      <div 
        ref={videoRef} 
        className="absolute top-0 left-0 w-full h-full plyr__video-embed"
        data-plyr-provider="youtube"
        data-plyr-embed-id={getYouTubeId(videoId)}
      ></div>
    </div>
  );
};

export default function ProjectDetail() {
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReloading, setIsReloading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [hoverStates, setHoverStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectsApi.getProject(projectId);
        setProject(data);
        setError('');
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const reloadImages = async () => {
    if (!project) return;
    
    try {
      setIsReloading(true);
      const data = await projectsApi.getProjectWithReloadedImages(projectId);
      setProject(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsReloading(false);
    }
  };

  const openSlideshow = (index: number) => {
    setSelectedImageIndex(index);
    setIsSlideshow(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  };

  const closeSlideshow = () => {
    setIsSlideshow(false);
    // Restore body scroll
    document.body.style.overflow = '';
  };

  const nextSlide = () => {
    if (project && selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % project.images.length;
      setSelectedImageIndex(nextIndex);
    }
  };

  const prevSlide = () => {
    if (project && selectedImageIndex !== null) {
      const prevIndex = (selectedImageIndex - 1 + project.images.length) % project.images.length;
      setSelectedImageIndex(prevIndex);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSlideshow) return;
      
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        closeSlideshow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSlideshow, selectedImageIndex]);

  // Handle mouse enter and leave for hover effects
  const handleMouseEnter = (imageId: string) => {
    setHoverStates(prev => ({ ...prev, [imageId]: true }));
  };

  const handleMouseLeave = (imageId: string) => {
    setHoverStates(prev => {
      const newState = { ...prev };
      delete newState[imageId];
      return newState;
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded w-full max-w-2xl">
          <p>{error}</p>
          <Link href="/" className="inline-block mt-4 text-white hover:text-red-300">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <Link href="/" className="inline-block mt-4 text-blue-500 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Sort descriptions by position_display
  const sortedDescriptions = [...project.descriptions].sort((a, b) => a.position_display - b.position_display);
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header with project name and logo */}
      <header className="sticky top-0 bg-white z-30 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="z-50">
            <Image 
              src="/moc_nguyen_production_black.png"
              alt="MOC Production Logo"
              width={120}
              height={40}
              className="h-7 md:h-8 w-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-2xl font-medium text-center flex-1">{project.name}</h1>
          <button 
            onClick={reloadImages}
            disabled={isReloading}
            className="text-sm text-gray-600 hover:text-black disabled:opacity-50"
          >
            {isReloading ? 'Reloading...' : 'Reload Images'}
          </button>
        </div>
      </header>

      {isReloading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Project description section */}
          {sortedDescriptions.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              {sortedDescriptions.map((desc) => (
                <div key={desc.id} className="mb-8 prose max-w-none">
                  <div 
                    className="whitespace-pre-line text-lg"
                    dangerouslySetInnerHTML={{ __html: desc.content }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Image Grid (similar to home page) */}
          <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3">
              {project.images.map((imageUrl, index) => (
                <div 
                  key={`image-${index}`}
                  className="relative aspect-[9/12] overflow-hidden cursor-pointer"
                  onClick={() => openSlideshow(index)}
                  onMouseEnter={() => handleMouseEnter(`image-${index}`)}
                  onMouseLeave={() => handleMouseLeave(`image-${index}`)}
                >
                  <Image 
                    src={imageUrl}
                    alt={`${project.name} - Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                  />
                  <div className={`absolute inset-0 transition-opacity duration-300 flex items-end justify-start ${hoverStates[`image-${index}`] ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-white text-sm pl-3 pb-3 font-light tracking-wider w-full bg-[linear-gradient(0deg,rgba(0,0,0,0.5),transparent)] z-10">
                      Click to view
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Video section */}
          {project.video_urls && project.video_urls.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6 text-center">Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {project.video_urls.map((video, index) => (
                  <div key={index} className="aspect-video w-full">
                    <PlyrVideoPlayer videoId={video.url} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Fullscreen Slideshow */}
      {isSlideshow && selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button 
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 focus:outline-none"
            onClick={closeSlideshow}
          >
            &times;
          </button>
          
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 focus:outline-none"
            onClick={prevSlide}
          >
            &#10094;
          </button>
          
          <div className="relative h-[80vh] w-[80vw]">
            <Image
              src={project.images[selectedImageIndex]}
              alt={`${project.name} - Image ${selectedImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="80vw"
              priority
            />
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {selectedImageIndex + 1} / {project.images.length}
            </div>
          </div>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 focus:outline-none"
            onClick={nextSlide}
          >
            &#10095;
          </button>
        </div>
      )}
      
      {/* Custom styles for Plyr */}
      <style jsx global>{`
        /* Customize Plyr player */
        .plyr--video {
          background: transparent;
        }
        .plyr--full-ui input[type=range] {
          color: #000;
        }
        .plyr__control--overlaid {
          background: rgba(0, 0, 0, 0.7);
        }
        .plyr__control--overlaid:hover {
          background: #000;
        }
        .plyr--video .plyr__control:hover {
          background: #000;
        }
      `}</style>
    </div>
  );
} 