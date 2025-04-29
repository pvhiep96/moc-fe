'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function AboutPage() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle scroll event to create parallax and fade-in effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if element is in viewport for fade-in effect
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
        }
      });
    }, observerOptions);

    // Observe all section refs
    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div className="bg-white text-black min-h-screen">
      {/* Hero Section */}
      <div
        className="w-full h-screen relative overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.4}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Image
          src="/about1.jpg"
          alt="About Hero"
          fill
          className="object-cover w-full h-full"
          priority
          style={{
            transform: `scale(${1 + scrollY * 0.0005})`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-lg tracking-tight">
            ABOUT US
          </h1>
        </div>
        <div className="absolute top-4 left-4 text-xs font-bold tracking-widest text-white">MOC PRODUCTIONS</div>
      </div>

      {/* Introduction Section */}
      <div
        ref={(el: HTMLDivElement | null) => { sectionRefs.current[0] = el; }}
        className="w-full max-w-6xl mx-auto px-4 py-24 opacity-0 transition-opacity duration-1000"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              LOVE IS A <br />
              PURPOSEFUL,<br />
              SHARED <br />
              EXCHANGE
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              MOC Productions hướng đến việc lưu giữ những khoảnh khắc chân thực, nghệ thuật và đầy cảm xúc cho mỗi khách hàng.
            </p>
            <p className="text-lg text-gray-700">
              Chúng tôi tin rằng mỗi khoảnh khắc đều có một câu chuyện riêng, và nhiệm vụ của chúng tôi là kể lại câu chuyện đó một cách trọn vẹn nhất.
            </p>
          </div>
          <div className="relative h-[70vh] max-h-[600px] overflow-hidden">
            <Image
              src="/about2.jpg"
              alt="About Us"
              fill
              className="object-cover rounded-lg"
              style={{
                transform: `translateY(${(scrollY - 500) * 0.1}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div
        ref={(el: HTMLDivElement | null) => { sectionRefs.current[1] = el; }}
        className="w-full max-w-6xl mx-auto px-4 py-24 opacity-0 transition-opacity duration-1000"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative h-[70vh] max-h-[600px] overflow-hidden">
            <Image
              src="/about3.jpg"
              alt="Our Story"
              fill
              className="object-cover rounded-lg"
              style={{
                transform: `translateY(${(scrollY - 1000) * 0.1}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">OUR STORY</h2>
            <p className="text-lg text-gray-700 mb-6">
              Chúng tôi bắt đầu hành trình của mình với niềm đam mê chụp ảnh và kể chuyện. Mỗi bức ảnh là một câu chuyện, một khoảnh khắc được lưu giữ mãi mãi.
            </p>
            <p className="text-lg text-gray-700">
              THAT IS WHY WE'VE TURNED OUR LOVE OF BEAUTY INTO AN EXQUISITE LIFE, THAT OF YOUR WEDDING PHOTOGRAPHERS.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div
        ref={(el: HTMLDivElement | null) => { sectionRefs.current[2] = el; }}
        className="w-full max-w-6xl mx-auto px-4 py-24 opacity-0 transition-opacity duration-1000"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">OUR TEAM</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="flex flex-col items-center">
            <div className="relative w-full h-[500px] mb-6 overflow-hidden">
              <Image
                src="/about2.jpg"
                alt="Photographer 1"
                fill
                className="object-cover rounded-lg"
                style={{
                  transform: `scale(${1 + ((scrollY - 1500) * 0.0002)})`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
            </div>
            <div className="font-bold text-2xl mb-2">PIERMARCO</div>
            <div className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Founder & Photographer</div>
            <div className="text-lg text-gray-700 text-center max-w-md">
              Sáng lập, nhiếp ảnh gia chính, với hơn 10 năm kinh nghiệm trong lĩnh vực ảnh cưới và sự kiện quốc tế.
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-full h-[500px] mb-6 overflow-hidden">
              <Image
                src="/about3.jpg"
                alt="Photographer 2"
                fill
                className="object-cover rounded-lg"
                style={{
                  transform: `scale(${1 + ((scrollY - 1500) * 0.0002)})`,
                  transition: 'transform 0.1s ease-out'
                }}
              />
            </div>
            <div className="font-bold text-2xl mb-2">MARIA</div>
            <div className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Photographer</div>
            <div className="text-lg text-gray-700 text-center max-w-md">
              Đam mê kể chuyện qua hình ảnh, luôn tìm kiếm những khoảnh khắc tự nhiên và cảm xúc nhất cho khách hàng.
            </div>
          </div>
        </div>
      </div>

      {/* Published In Section */}
      <div
        ref={(el: HTMLDivElement | null) => { sectionRefs.current[3] = el; }}
        className="w-full max-w-6xl mx-auto px-4 py-24 opacity-0 transition-opacity duration-1000"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center">WE ARE PUBLISHED IN</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-colors cursor-pointer">VOGUE</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-colors cursor-pointer">LOVER MOON</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-colors cursor-pointer">BAZAAR</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-gray-800 hover:text-gray-600 transition-colors cursor-pointer">VANITY FAIR</span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        ref={(el: HTMLDivElement | null) => { sectionRefs.current[4] = el; }}
        className="w-full max-w-6xl mx-auto px-4 py-24 opacity-0 transition-opacity duration-1000 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-8">READY TO WORK WITH US?</h2>
        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
          Chúng tôi luôn sẵn sàng lắng nghe và hiện thực hóa những ý tưởng của bạn. Hãy liên hệ với chúng tôi để biết thêm chi tiết.
        </p>
        <Link href="/contact" className="inline-flex items-center gap-2 text-2xl font-bold group border-b-2 border-black pb-1 hover:translate-x-1 transition-transform">
          CHECK AVAILABILITY
          <span className="ml-2 text-3xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center mb-4">
            <Image
              src="/moc_nguyen_production_black.png"
              alt="MOC Productions Logo"
              width={250}
              height={80}
              className="w-[250px] h-auto"
            />
          </div>
          <div className="text-sm text-gray-500 text-center">
            ©2025 MOC PRODUCTIONS - ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>

      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease forwards;
        }
      `}</style>
    </div>
  );
}