'use client';

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { projectsApi } from '@/services/api'
import { getErrorMessage } from '@/utils/errorHandler'
import LoadingScreen from '@/components/LoadingScreen';
import MenuOverlay from '@/components/MenuOverlay';
import DynamicMenuButton from '@/components/DynamicMenuButton';
import './video.css';

// Định nghĩa kiểu dữ liệu cho các phần tử hiển thị
type ProjectItem = {
  type: 'image' | 'description' | 'video'
  content: string; // URL cho ảnh hoặc nội dung cho description hoặc video ID
  order: number; // Thứ tự hiển thị
}

// Định nghĩa kiểu dữ liệu cho ordered_content từ API
type OrderedContentItem = {
  id: number;
  type: string; // 'images', 'description', 'video'
  position: number;
  image_url?: string; // Cho type 'images'
  content?: string; // Cho type 'description'
  url?: string; // Cho type 'video'
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
  ordered_content?: OrderedContentItem[];
};

const ProjectDetail = () => {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectImages, setProjectImages] = useState<string[]>([])
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [projectName, setProjectName] = useState(`Project ${id}`)
  const sliderRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [currentIndex, setCurrentIndex] = useState(1);

  // Add CSS to body to control scroll behavior
  useEffect(() => {
    // Add CSS rule to the head to ensure wheel events work correctly
    const style = document.createElement('style');
    style.textContent = `
      @media (min-width: 768px) {
        body.horizontal-scroll {
          overflow-x: hidden;
          overflow-y: hidden;
          overscroll-behavior-y: none;
        }
        .horizontal-scroll-container {
          scroll-behavior: smooth;
          overscroll-behavior-y: none;
          overscroll-behavior-x: auto;
          touch-action: pan-x;
        }
      }
      @media (max-width: 767px) {
        body.horizontal-scroll {
          overflow-x: hidden;
          overflow-y: auto;
        }
        .horizontal-scroll-container {
          scroll-behavior: smooth;
        }
      }
    `;
    document.head.appendChild(style);

    // Add class to body
    document.body.classList.add('horizontal-scroll');

    // Thêm event listener cho wheel ở cấp độ window để xử lý cuộn ngang
    // Đây là cách tiếp cận khác để xử lý sự kiện wheel
    const handleWindowWheel = (e: WheelEvent) => {
      // Chỉ xử lý trên desktop và khi slider đã được tạo
      if (window.innerWidth >= 768 && sliderRef.current) {
        // Kiểm tra xem sự kiện có xảy ra trong slider không
        const sliderRect = sliderRef.current.getBoundingClientRect();
        const isInSlider =
          e.clientX >= sliderRect.left &&
          e.clientX <= sliderRect.right &&
          e.clientY >= sliderRect.top &&
          e.clientY <= sliderRect.bottom;

        if (isInSlider) {
          // Ngăn chặn cuộn dọc mặc định
          e.preventDefault();

          // Chuyển đổi cuộn dọc thành cuộn ngang
          sliderRef.current.scrollLeft += e.deltaY * 1.5;

          // Cập nhật counter - không thể gọi calculateCurrentImage ở đây vì nó chưa được định nghĩa
          // Thay vào đó, chúng ta sẽ cập nhật counter trực tiếp
          if (sliderRef.current) {
            // Lấy thông tin về container
            const containerRect = sliderRef.current.getBoundingClientRect();

            // Lấy tất cả các phần tử có data-order và data-countable="true" (chỉ ảnh)
            const itemElements = sliderRef.current.querySelectorAll('[data-order][data-countable="true"]');
            let maxVisibleOrder = 0;
            let closestOrder = currentIndex;

            itemElements.forEach(el => {
              const rect = el.getBoundingClientRect();

              // Tính phần hiển thị của ảnh
              const itemWidth = rect.width;
              const rightEdgeOfScreen = containerRect.right;
              const leftEdgeOfScreen = containerRect.left;
              const leftEdgeOfItem = rect.left;
              const rightEdgeOfItem = rect.right;

              const visibleLeft = Math.max(leftEdgeOfItem, leftEdgeOfScreen);
              const visibleRight = Math.min(rightEdgeOfItem, rightEdgeOfScreen);
              const visibleWidth = Math.max(0, visibleRight - visibleLeft);
              const visiblePercent = visibleWidth / itemWidth;

              // Ảnh phải hiển thị ít nhất 30% mới được tính
              const visibleThreshold = 0.3; // 30%
              const isVisible = visiblePercent >= visibleThreshold;

              // Lấy order từ data attribute
              const orderAttr = el.getAttribute('data-order');
              if (!orderAttr) return;
              const orderNum = parseInt(orderAttr);

              // Nếu ảnh hiển thị và có số thứ tự lớn hơn số hiện tại
              if (isVisible && orderNum > maxVisibleOrder) {

                maxVisibleOrder = orderNum;
              }
            });

            // Nếu tìm thấy ảnh hiển thị, cập nhật số đếm
            if (maxVisibleOrder > 0) {
              closestOrder = maxVisibleOrder;
            }

            // Cập nhật counter với hiệu ứng mượt mà - sử dụng debounce để tránh cập nhật quá thường xuyên
            if (closestOrder !== currentIndex) {
              // Sử dụng debounce để tránh cập nhật quá thường xuyên
              const updateCounter = debounce(() => {
                // Thêm hiệu ứng animation mượt mà cho counter
                const counter = document.getElementById('image-counter');
                if (counter) {
                  // Hiệu ứng fade out
                  counter.style.opacity = '0';
                  counter.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

                  // Đợi hiệu ứng hoàn thành rồi mới cập nhật số
                  setTimeout(() => {
                    // Cập nhật số
                    setCurrentIndex(closestOrder);

                    // Đợi một chút để đảm bảo DOM đã cập nhật
                    setTimeout(() => {
                      // Hiệu ứng fade in
                      counter.style.opacity = '1';
                    }, 50);
                  }, 300);
                } else {
                  // Nếu không tìm thấy counter, vẫn cập nhật số
                  setCurrentIndex(closestOrder);
                }
              }, 200); // 200ms debounce

              // Gọi hàm đã được debounce
              updateCounter();
            }
          }
        }
      }
    };

    // Đăng ký event listener ở cấp độ window với passive: false
    window.addEventListener('wheel', handleWindowWheel, { passive: false });

    // Clean up when component unmounts
    return () => {
      document.body.classList.remove('horizontal-scroll');
      document.head.removeChild(style);

      // Xóa event listener ở cấp độ window
      window.removeEventListener('wheel', handleWindowWheel);
    };
  }, []);

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

    // Add wheel event handler to convert vertical scroll to horizontal scroll
    const handleWheel = (e: WheelEvent) => {
      // Chỉ ngăn chặn hành vi cuộn mặc định trên desktop
      if (window.innerWidth >= 768) {
        e.preventDefault();

        // Chuyển đổi cuộn dọc thành cuộn ngang
        if (sliderRef.current) {
          // Sử dụng deltaY của wheel event để cuộn ngang
          // Nhân với 1.5 để tăng tốc độ cuộn
          sliderRef.current.scrollLeft += e.deltaY * 1.5;
        }
      }

      // Dừng auto-scroll khi người dùng cuộn
      setIsMouseIdle(false);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    // Unified scroll handler that will handle both auto-scroll control and index calculation
    const handleUnifiedScroll = () => {


      // Part 1: Auto-scroll control (from first handleScroll)
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

      // Reset inactivity timer
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
    window.addEventListener('scroll', handleUnifiedScroll);
    window.addEventListener('touchmove', handleTouchMove);

    // Add event listener to the slider element specifically for both desktop and mobile
    if (sliderRef.current) {


      // Sử dụng passive: false để đảm bảo sự kiện không bị bỏ qua
      sliderRef.current.addEventListener('scroll', handleUnifiedScroll, { passive: false });
      sliderRef.current.addEventListener('wheel', handleWheel, { passive: false });
      sliderRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });

      // Thêm sự kiện gesturechange cho touchpad trên macOS
      sliderRef.current.addEventListener('gesturechange', handleUnifiedScroll, { passive: false });

      // Thêm sự kiện mousewheel cho các trình duyệt cũ hơn
      sliderRef.current.addEventListener('mousewheel' as keyof HTMLElementEventMap, handleUnifiedScroll as EventListener, { passive: false });

      // Thêm sự kiện DOMMouseScroll cho Firefox
      sliderRef.current.addEventListener('DOMMouseScroll' as keyof HTMLElementEventMap, handleUnifiedScroll as EventListener, { passive: false });

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
      window.removeEventListener('scroll', handleUnifiedScroll);
      window.removeEventListener('touchmove', handleTouchMove);

      // Clean up slider scroll event
      if (sliderRef.current) {
        sliderRef.current.removeEventListener('scroll', handleUnifiedScroll);
        sliderRef.current.removeEventListener('wheel', handleWheel);
        sliderRef.current.removeEventListener('touchmove', handleTouchMove);
        sliderRef.current.removeEventListener('gesturechange', handleUnifiedScroll);
        sliderRef.current.removeEventListener('mousewheel' as keyof HTMLElementEventMap, handleUnifiedScroll as EventListener);
        sliderRef.current.removeEventListener('DOMMouseScroll' as keyof HTMLElementEventMap, handleUnifiedScroll as EventListener);
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
        // Đảm bả animation frame trước đó nếu có
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

    const loadData = async () => {
      try {
        // Fetch project data from API
        const projectData = await projectsApi.getProject(Number(id) || id);



        // Set project name
        setProjectName(projectData.name ? projectData.name.toUpperCase() : `Project ${id}`);

        // Get images for fallback
        const projectImages = projectData.images || [];
        setProjectImages(projectImages.map((img: string) => `${img}`));

        // Create items array
        const items: ProjectItem[] = [];

        // Check if we have ordered content from the API
        if (projectData.ordered_content && projectData.ordered_content.length > 0) {


          // Map the ordered content to our ProjectItem format
          projectData.ordered_content.forEach((item: OrderedContentItem) => {
            // Determine content based on type
            let content = '';
            let type: 'image' | 'description' | 'video' = 'image'; // Default

            if (item.type === 'images' && item.image_url) {
              type = 'image';
              content = item.image_url;
            } else if (item.type === 'description' && item.content) {
              type = 'description';
              content = item.content;
            } else if (item.type === 'video' && item.url) {
              type = 'video';
              // For videos, extract the YouTube ID if needed
              content = getYouTubeId(item.url);
            }

            // Only add item if we have valid content
            if (content) {
              items.push({
                type: type,
                content: content,
                order: item.position
              });
            }
          });
        } else {


          // Fallback to old logic if ordered_content is not available
          // Add descriptions from the project
          if (projectData.descriptions && projectData.descriptions.length > 0) {
            // Sort descriptions by position_display
            const sortedDescriptions = [...projectData.descriptions].sort((a, b) => a.position_display - b.position_display);

            // Get the highest position value from descriptions
            const maxPosition = Math.max(...sortedDescriptions.map(desc => desc.position_display));

            // Limit the total number of images to be less than maxPosition
            const limitedImages = projectImages.slice(0, maxPosition - 1);

            // Add descriptions and images in alternating pattern based on position_display
            let imageIndex = 0;
            sortedDescriptions.forEach((desc) => {
              // Add description at its specific position
              items.push({
                type: 'description',
                content: desc.content,
                order: desc.position_display
              });

              // Add images between this description and the next one
              const nextDescPos = sortedDescriptions.find(d => d.position_display > desc.position_display)?.position_display || Number.MAX_SAFE_INTEGER;
              const imagesToAdd = nextDescPos - desc.position_display - 1;

              for (let i = 0; i < imagesToAdd && imageIndex < limitedImages.length; i++) {
                items.push({
                  type: 'image',
                  content: limitedImages[imageIndex],
                  order: desc.position_display + i + 1
                });
                imageIndex++;
              }
            });
          } else {
            // If no descriptions, only display up to 10 images
            const maxImages = Math.min(projectImages.length, 10);
            for (let i = 0; i < maxImages; i++) {
              items.push({
                type: 'image',
                content: projectImages[i],
                order: i + 1
              });
            }
          }

          // Lưu trữ tạm thời các video để thêm vào cuối
          const videoItems: ProjectItem[] = [];

          // Add videos if available - improved version
          if (projectData.video_urls && projectData.video_urls.length > 0) {
            // Process all videos from the API
            projectData.video_urls.forEach((videoItem: { url: string }) => {
              // Extract video ID using our helper function
              const videoId = getYouTubeId(videoItem.url);

              if (videoId) {
                // Add the video to temporary array - store just the ID
                videoItems.push({
                  type: 'video',
                  content: videoId,
                  order: 0 // Temporary order, will be updated later
                });


              }
            });
          }

          // Sort items by order first
          items.sort((a, b) => a.order - b.order);

          // Now add videos at the end with sequential order numbers
          if (videoItems.length > 0) {
            // Start order from the last item's order + 1
            let startOrder = items.length > 0 ? items[items.length - 1].order + 1 : 1;

            videoItems.forEach((videoItem, index) => {
              videoItem.order = startOrder + index;
              items.push(videoItem);

            });
          }
        }

        // Sort by order
        items.sort((a, b) => a.order - b.order);
        setProjectItems(items);

        // Short delay before removing loading screen
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {

        setTimeout(() => setLoading(false), 500);
      }
    }

    // Start loading data
    loadData();
  }, [id])

  // Helper function to extract YouTube video ID
  const getYouTubeId = (url: string): string => {
    if (!url) return '';

    // If the URL is already a valid YouTube ID (11 characters), return it directly
    if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : '';
  };


  // Hàm debounce để tránh cập nhật quá thường xuyên
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: any[]) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  };

  // Effect to update counter based on scroll position - more responsive version
  useEffect(() => {
    if (!sliderRef.current) return;

    // Sử dụng requestAnimationFrame để đảm bảo hiệu ứng mượt mà
    const updateCounterAnimation = () => {
      // Chỉ cập nhật hiệu ứng animation, không cập nhật giá trị currentIndex
      // vì giá trị này sẽ được cập nhật bởi IntersectionObserver
      const counter = document.getElementById('image-counter');
      if (counter) {
        // Scale up slightly and reduce opacity during transition
        counter.style.transform = 'scale(1.05)';
        counter.style.opacity = '0.9';

        // Reset animation after a very short delay
        setTimeout(() => {
          counter.style.transform = 'scale(1)';
          counter.style.opacity = '1';
        }, 100);
      }
    };

    // Sử dụng một cách tiếp cận trực tiếp hơn để phát hiện ảnh hiện tại
    // Hàm để tính toán ảnh hiện tại dựa trên vị trí cuộn - phiên bản mới
    const calculateCurrentImage = () => {
      if (!sliderRef.current) {
        return;
      }

      // Lấy thông tin về container
      const container = sliderRef.current;
      const containerRect = container.getBoundingClientRect();

      // Biến để lưu số thứ tự lớn nhất của ảnh hiển thị
      let maxVisibleOrder = 0;
      let closestOrder = currentIndex; // Khởi tạo với giá trị hiện tại

      try {
        // Thêm data-order cho tất cả các ảnh và video nếu cần
        const imageContainers = container.querySelectorAll('.flex-shrink-0.relative.flex.items-center.justify-center');


        imageContainers.forEach((el, index) => {
          if (!el.hasAttribute('data-order')) {
            el.setAttribute('data-order', (index + 1).toString());

            // Thêm data-countable="true" cho ảnh, "false" cho video và description
            if (el.querySelector('img')) {
              el.setAttribute('data-countable', 'true');
            } else {
              el.setAttribute('data-countable', 'false');
            }


          }
        });

        // Lấy tất cả các phần tử có data-order và data-countable="true" (chỉ ảnh)
        const itemElements = document.querySelectorAll('[data-order][data-countable="true"]');


        // Kiểm tra từng phần tử
        itemElements.forEach((el) => {
          const itemRect = el.getBoundingClientRect();

          // Kiểm tra xem item có hiển thị trong viewport không
          // Ảnh phải hiển thị ít nhất 30% mới được tính
          const visibleThreshold = 0.3; // 30%

          const itemWidth = itemRect.width;
          const rightEdgeOfScreen = containerRect.right;
          const leftEdgeOfScreen = containerRect.left;
          const leftEdgeOfItem = itemRect.left;
          const rightEdgeOfItem = itemRect.right;

          // Tính phần hiển thị của ảnh
          const visibleLeft = Math.max(leftEdgeOfItem, leftEdgeOfScreen);
          const visibleRight = Math.min(rightEdgeOfItem, rightEdgeOfScreen);
          const visibleWidth = Math.max(0, visibleRight - visibleLeft);
          const visiblePercent = visibleWidth / itemWidth;

          const isVisible = visiblePercent >= visibleThreshold;

          // Lấy order từ data attribute
          const orderAttr = el.getAttribute('data-order');
          if (!orderAttr) return;
          const orderNum = parseInt(orderAttr);

          // Nếu ảnh hiển thị và có số thứ tự lớn hơn số hiện tại
          if (isVisible && orderNum > maxVisibleOrder) {

            maxVisibleOrder = orderNum;
          }
        });

        // Nếu không tìm thấy ảnh nào hiển thị, giữ nguyên số cũ
        if (maxVisibleOrder === 0) {

          return;
        }

        // Cập nhật số đếm nếu có thay đổi
        if (maxVisibleOrder !== currentIndex) {

          closestOrder = maxVisibleOrder;
        }

        // Luôn cập nhật chỉ số để đảm bảo nó luôn phản ánh ảnh hiện tại - sử dụng debounce để tránh cập nhật quá thường xuyên
        if (closestOrder !== currentIndex) {


          // Sử dụng debounce để tránh cập nhật quá thường xuyên
          const updateCounter = debounce(() => {
            // Thêm hiệu ứng animation mượt mà cho counter
            const counter = document.getElementById('image-counter');
            if (counter) {
              // Hiệu ứng fade out
              counter.style.opacity = '0';
              counter.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

              // Đợi hiệu ứng hoàn thành rồi mới cập nhật số
              setTimeout(() => {
                // Cập nhật số
                setCurrentIndex(closestOrder);

                // Đợi một chút để đảm bảo DOM đã cập nhật
                setTimeout(() => {
                  // Hiệu ứng fade in
                  counter.style.opacity = '1';
                }, 50);
              }, 300);
            } else {
              // Nếu không tìm thấy counter, vẫn cập nhật số
              setCurrentIndex(closestOrder);
            }
          }, 200); // 200ms debounce

          // Gọi hàm đã được debounce
          updateCounter();
        }
      } catch (error) {
        console.error('Error in calculateCurrentImage:', error);
      }
    };

    // Không cần hàm handleImageDetection nữa vì đã xử lý trong handleScroll

    // Tạo phiên bản debounced của calculateCurrentImage
    const debouncedCalculateCurrentImage = debounce(() => {
      calculateCurrentImage();
    }, 150); // 150ms debounce để giảm số lần cập nhật

    // Đăng ký sự kiện scroll để cập nhật hiệu ứng animation và tính toán ảnh hiện tại
    const handleScroll = () => {
      // Cập nhật hiệu ứng animation
      updateCounterAnimation();

      // Tính toán ảnh hiện tại - sử dụng phiên bản debounced
      debouncedCalculateCurrentImage();

      // Log để debug

    };

    // Đăng ký nhiều sự kiện để đảm bảo phát hiện mọi thay đổi
    sliderRef.current.addEventListener('scroll', handleScroll, { passive: true });

    // Thêm CSS để ngăn chặn cuộn dọc trên container
    if (window.innerWidth >= 768) {
      sliderRef.current.style.overscrollBehaviorY = 'none';
      sliderRef.current.style.touchAction = 'pan-x';
    }

    // Thêm event listener cho wheel để chuyển đổi cuộn dọc thành cuộn ngang
    const wheelHandler = (e: WheelEvent) => {
      // Chỉ xử lý trên desktop
      if (window.innerWidth >= 768) {
        // Ngăn chặn hành vi cuộn mặc định
        e.preventDefault();

        // Chuyển đổi cuộn dọc thành cuộn ngang
        if (sliderRef.current) {
          // Kiểm tra xem đây có phải là sự kiện từ touchpad không
          // Touchpad thường có deltaMode = 0 và deltaY nhỏ hơn
          const isTouchpad = e.deltaMode === 0 && Math.abs(e.deltaY) < 40;

          // Điều chỉnh hệ số nhân dựa trên thiết bị đầu vào
          const multiplier = isTouchpad ? 1.2 : 2.5;

          // Sử dụng deltaX nếu có (cho touchpad hỗ trợ cuộn ngang)
          // Hoặc sử dụng deltaY nếu không có deltaX (cho chuột thông thường)
          const scrollDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY * multiplier;

          // Cuộn ngang với tốc độ phù hợp
          sliderRef.current.scrollLeft += scrollDelta;

          // Gọi phiên bản debounced để cập nhật counter

          debouncedCalculateCurrentImage();
          updateCounterAnimation();
        }
      }
    };

    // Sử dụng passive: false để có thể gọi preventDefault()
    sliderRef.current.addEventListener('wheel', wheelHandler, { passive: false });

    // Thêm sự kiện gesturechange cho touchpad trên macOS
    const gestureHandler = (e: any) => {
      // Ngăn chặn hành vi mặc định
      e.preventDefault();

      if (sliderRef.current && window.innerWidth >= 768) {
        // Sử dụng e.scale để xác định hướng cuộn
        const scrollAmount = (e.scale - 1) * 100;
        sliderRef.current.scrollLeft += scrollAmount;


        debouncedCalculateCurrentImage();
        updateCounterAnimation();
      }
    };

    // Thêm sự kiện gesturechange cho touchpad trên macOS
    sliderRef.current.addEventListener('gesturechange', gestureHandler, { passive: false });

    // Thêm sự kiện mousewheel cho các trình duyệt cũ hơn
    sliderRef.current.addEventListener('mousewheel' as keyof HTMLElementEventMap, wheelHandler as EventListener, { passive: false });

    // Thêm sự kiện DOMMouseScroll cho Firefox
    sliderRef.current.addEventListener('DOMMouseScroll' as keyof HTMLElementEventMap, wheelHandler as EventListener, { passive: false });

    sliderRef.current.addEventListener('touchmove', handleScroll, { passive: true });

    // Thêm sự kiện resize để xử lý khi kích thước màn hình thay đổi
    window.addEventListener('resize', handleScroll, { passive: true });

    // Thiết lập interval để kiểm tra định kỳ (đề phòng các sự kiện khác không được kích hoạt)
    // Sử dụng thời gian dài hơn vì đã có debounce
    const checkInterval = setInterval(() => {

      calculateCurrentImage(); // Sử dụng phiên bản không debounced để đảm bảo cập nhật
    }, 300);

    // Thêm một interval khác để đảm bảo counter được cập nhật
    const forceUpdateInterval = setInterval(() => {

      // Gọi trực tiếp setCurrentIndex để cập nhật counter
      const container = sliderRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const leftEdgeOfScreen = containerRect.left;
        const rightEdgeOfScreen = containerRect.right;

        // Lấy tất cả các items có data-order và data-countable="true" (chỉ ảnh)
        const allItems = Array.from(container.querySelectorAll('[data-order][data-countable="true"]')) as HTMLElement[];

        // Tìm ảnh có số thứ tự lớn nhất đang hiển thị
        let maxVisibleOrder = 0;

        allItems.forEach(el => {
          const rect = el.getBoundingClientRect();

          // Tính phần hiển thị của ảnh
          const itemWidth = rect.width;
          const leftEdgeOfItem = rect.left;
          const rightEdgeOfItem = rect.right;

          const visibleLeft = Math.max(leftEdgeOfItem, leftEdgeOfScreen);
          const visibleRight = Math.min(rightEdgeOfItem, rightEdgeOfScreen);
          const visibleWidth = Math.max(0, visibleRight - visibleLeft);
          const visiblePercent = visibleWidth / itemWidth;

          // Ảnh phải hiển thị ít nhất 30% mới được tính
          const visibleThreshold = 0.3; // 30%
          const isVisible = visiblePercent >= visibleThreshold;

          if (isVisible) {
            const orderAttr = el.getAttribute('data-order');
            if (orderAttr) {
              const orderNum = parseInt(orderAttr);

              // Nếu ảnh hiển thị và có số thứ tự lớn hơn số hiện tại
              if (orderNum > maxVisibleOrder) {

                maxVisibleOrder = orderNum;
              }
            }
          }
        });

        // Nếu tìm thấy ảnh hiển thị và số thứ tự khác với số hiện tại
        if (maxVisibleOrder > 0 && maxVisibleOrder !== currentIndex) {


          // Thêm hiệu ứng animation mượt mà cho counter
          const counter = document.getElementById('image-counter');
          if (counter) {
            // Hiệu ứng fade out
            counter.style.opacity = '0';
            counter.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

            // Đợi hiệu ứng hoàn thành rồi mới cập nhật số
            setTimeout(() => {
              // Cập nhật số
              setCurrentIndex(maxVisibleOrder);

              // Đợi một chút để đảm bảo DOM đã cập nhật
              setTimeout(() => {
                // Hiệu ứng fade in
                counter.style.opacity = '1';
              }, 50);
            }, 300);
          } else {
            // Nếu không tìm thấy counter, vẫn cập nhật số
            setCurrentIndex(maxVisibleOrder);
          }
        }
      }
    }, 300);

    // Initial calculation and animation
    calculateCurrentImage();
    updateCounterAnimation();

    return () => {
      // Xóa tất cả các event listener
      if (sliderRef.current) {
        sliderRef.current.removeEventListener('scroll', handleScroll);
        // Xóa event listener wheel đặc biệt
        sliderRef.current.removeEventListener('wheel', wheelHandler);
        sliderRef.current.removeEventListener('touchmove', handleScroll);
        // Xóa các event listener mới thêm
        sliderRef.current.removeEventListener('gesturechange', gestureHandler);
        sliderRef.current.removeEventListener('mousewheel' as keyof HTMLElementEventMap, wheelHandler as EventListener);
        sliderRef.current.removeEventListener('DOMMouseScroll' as keyof HTMLElementEventMap, wheelHandler as EventListener);
      }

      // Xóa event listener trên window
      window.removeEventListener('resize', handleScroll);

      // Xóa tất cả các interval
      clearInterval(checkInterval);
      clearInterval(forceUpdateInterval);

      // console.log('Cleaned up all event listeners and intervals');
    };
  }, [projectItems, currentIndex]);

  // Update the loading UI
  if (loading) {
    return (
      <LoadingScreen
        onComplete={() => {
          setLoading(false);
          setTimeout(() => {
            // Có thể thêm các hiệu ứng fade-in nếu cần
          }, 300);
        }}
      />
    );
  }

  // Component để hiển thị description
  const DescriptionBlock = ({ content }: { content: string }) => (
    <div className="w-full py-8 px-4 md:px-16">
      <div
        className="text-black text-xl md:text-2xl font-medium max-w-3xl mx-auto font-mon-cheri"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );

  // Component để hiển thị video
  const VideoBlock = ({ videoId }: { videoId: string }) => {
    return (
      <div className="w-full py-4 flex justify-center">
        <div className="aspect-video w-full max-w-4xl video-container">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0&mute=1&controls=1&modestbranding=1`}
            title="YouTube video player"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    );
  };

  // Component HtmlBlock đã được loại bỏ vì không sử dụng

  return (
    <div className="min-h-screen bg-white">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dynamic Menu Button with color changing based on background */}
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

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
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-all duration-300"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180 group-hover:-translate-x-1 transition-transform duration-300">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="uppercase tracking-wider">Back to Projects</span>
          </Link>
        </div>
        <div className="hidden md:block pr-8">
          <Link
            href={`/projects/${id}/detail`}
            className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:text-gray-600 transition-all duration-300"
          >
            <span className="uppercase tracking-wider">View Detail</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform duration-300">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* Nút Back sticky phía dưới bên phải cho mobile */}
      <Link
        href="/moc-productions"
        className="md:hidden fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 text-sm font-medium z-50 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-md"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-180">
          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="uppercase tracking-wider">Back</span>
      </Link>

      {/* Nút View Detail sticky phía dưới bên trái cho mobile */}
      <Link
        href={`/projects/${id}/detail`}
        className="md:hidden fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 text-sm font-medium z-50 bg-white/90 backdrop-blur-sm rounded-full text-black shadow-md"
      >
        <span className="uppercase tracking-wider">View Detail</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      <main className="h-screen pt-[80px] md:pt-[120px]">
        {/* Desktop view - horizontal scroll */}
        <div
          ref={sliderRef}
          className="hidden md:flex md:overflow-x-auto h-[calc(100vh-120px)] w-full px-4 md:gap-16 pt-[25px] pb-[25px] md:overflow-y-hidden md:scrollbar-hide md:horizontal-scroll-container"
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
            } else if (item.type === 'video') {
              // Video items already have their order set
              return (
                <div
                  key={`video-${index}`}
                  ref={(el) => {
                    if (el) {
                      imageRefs.current[index] = el;
                      // Đảm bảo data-order được thiết lập đúng
                      setTimeout(() => {
                        if (el) el.setAttribute('data-order', item.order.toString());
                      }, 0);
                    }
                  }}
                  data-order={item.order}
                  data-type="video"
                  data-countable="false"
                  data-index={index}
                  className="h-full flex-shrink-0 relative flex items-center justify-center"
                >
                  <div className="h-full max-h-[80vh] aspect-video video-container">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${item.content}?rel=0&showinfo=0&mute=1&controls=1&modestbranding=1`}
                      title="YouTube video player"
                      style={{ border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              );
            } else {
              // Calculate image order (skip descriptions and videos)
              const imageOrder = projectItems
                .slice(0, index)
                .filter(item => item.type === 'image')
                .length + 1;

              return (
                <div
                  key={`img-${index}`}
                  ref={(el) => {
                    if (el) {
                      imageRefs.current[index] = el;
                      // Đảm bảo data-order được thiết lập đúng
                      setTimeout(() => {
                        if (el) el.setAttribute('data-order', imageOrder.toString());
                      }, 0);
                    }
                  }}
                  data-order={imageOrder}
                  data-type="image"
                  data-countable="true"
                  data-index={index}
                  className="h-full flex-shrink-0 relative flex items-center justify-center"
                >
                  <img
                    src={item.content}
                    alt={`Project item ${imageOrder}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              );
            }
          })}
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
              } else if (item.type === 'video') {
                return <VideoBlock key={`video-${index}`} videoId={item.content} />;
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
        </div>

        {/* Scroll indicator - only visible on desktop */}
        <div className="fixed bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-black hidden md:block">
          <span className="hidden md:inline">Scroll to view more</span>
          <span className="ml-2 hidden md:inline-block md:animate-bounce">→</span>
        </div>

        <div
          className="hidden md:flex fixed bottom-8 left-8 z-50 bg-white text-black px-4 py-2 rounded-full font-medium transition-all duration-300 ease-in-out items-center shadow-md"
          style={{
            transform: 'scale(1)',
            opacity: 1,
            pointerEvents: 'none' // Để không cản trở việc click vào các phần tử phía dưới
          }}
        >
          <span
            className="text-3xl font-light"
            id="image-counter"
            style={{
              display: 'inline-block',
              opacity: 1,
              transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
            }}
          >
            {currentIndex}
          </span>
        </div>
      </main>
    </div>
  )
}

export default ProjectDetail
