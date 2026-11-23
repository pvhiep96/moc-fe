'use client';

import { useEffect, useMemo, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import MenuOverlay from '@/components/MenuOverlay'
import { MultilineText, useSiteContent } from '@/content/SiteContentProvider'

type PackageContent = { name: string; description: string; price: string; features?: string[]; popular?: boolean };
type OptionContent = { name: string; description: string; price: string };

const toPrice = (raw: unknown) => Number(String(raw ?? '').replace(/[^\d.]/g, '')) || 0;

// Định nghĩa kiểu dữ liệu cho các gói dịch vụ
type ServicePackage = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  popular?: boolean;
}

// Định nghĩa kiểu dữ liệu cho các tùy chọn bổ sung
type ServiceOption = {
  id: number;
  name: string;
  description: string;
  price: number;
  selected: boolean;
}

const PricingPage = () => {
  // State cho menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Gói dịch vụ & tùy chọn: nội dung do admin sửa (Sửa giao diện website → Bảng giá)
  const { t, list, e } = useSiteContent();
  const packages = useMemo<ServicePackage[]>(
    () =>
      list<PackageContent>('pricing_packages').map((pkg, idx) => ({
        id: idx + 1,
        name: pkg.name,
        description: pkg.description,
        basePrice: toPrice(pkg.price),
        features: pkg.features || [],
        popular: Boolean(pkg.popular),
      })),
    [list]
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const options = useMemo<ServiceOption[]>(
    () =>
      list<OptionContent>('pricing_options').map((opt, idx) => ({
        id: idx + 1,
        name: opt.name,
        description: opt.description,
        price: toPrice(opt.price),
        selected: selectedOptionIds.includes(idx + 1),
      })),
    [list, selectedOptionIds]
  );

  // State cho gói được chọn
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const mouseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Tính tổng giá khi có thay đổi
  useEffect(() => {
    if (selectedPackage) {
      const optionsPrice = options
        .filter(option => option.selected)
        .reduce((sum, option) => sum + option.price, 0);

      setTotalPrice(selectedPackage.basePrice + optionsPrice);
    } else {
      setTotalPrice(0);
    }
  }, [selectedPackage, options]);

  // Xử lý chọn gói dịch vụ
  const handleSelectPackage = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
  };

  // Xử lý chọn tùy chọn bổ sung
  const handleToggleOption = (optionId: number) => {
    setSelectedOptionIds(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };

  // Add mouse movement tracking
  useEffect(() => {
    const handleMouseMove = () => {
      setIsMouseIdle(false);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    const handleWheel = () => {
      setIsMouseIdle(false);

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }

      mouseTimerRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    const handleScroll = () => {
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
      setLoading(false);
    }, 2000);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('scroll', handleScroll);

    if (sliderRef.current) {
      sliderRef.current.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);

      if (sliderRef.current) {
        sliderRef.current.removeEventListener('scroll', handleScroll);
      }

      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, []);

  // Smooth auto-scroll implementation for desktop horizontal scroll
  useEffect(() => {
    if (isMouseIdle && !loading && sliderRef.current) {
      let startTime: number | null = null;
      let startPosition = sliderRef.current.scrollLeft;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      const scrollDuration = 30000;

      const smoothScroll = (timestamp: number) => {
        if (!sliderRef.current) return;

        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const scrollProgress = elapsed / scrollDuration;
        const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const easedProgress = easeInOutQuad(scrollProgress);
        const newPosition = startPosition + (maxScroll * easedProgress);

        if (newPosition >= maxScroll || scrollProgress >= 1) {
          startTime = timestamp;
          startPosition = 0;
          sliderRef.current.scrollLeft = 0;
        } else {
          sliderRef.current.scrollLeft = newPosition;
        }

        scrollAnimationRef.current = requestAnimationFrame(smoothScroll);
      };

      if (window.innerWidth >= 768) {
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
      cancelAnimationFrame(scrollAnimationRef.current);
    }
  }, [isMouseIdle, loading]);

  // if (loading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="text-2xl">Loading pricing options...</div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-white">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Vertical Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        data-moc-menu-toggle
        className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
      >
        <div className="vertical-text text-black text-lg md:text-xl uppercase tracking-wider font-medium">
          {menuOpen ? 'CLOSE' : 'MENU'}
        </div>
      </button>

      {/* Add CSS for vertical text */}
      <style jsx global>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          letter-spacing: 0.2em;
          font-weight: 500;
        }
      `}</style>

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

      {/* Center Logo */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
        <Link href="/">
          <Image unoptimized src="/moc-logo.webp" alt="Center Logo" width={120} height={120} className="w-[120px] md:w-[150px] cursor-pointer" />
        </Link>
      </div>

      {/* Logo top center cho mobile */}
      <div className="md:hidden absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2">
        <Link href="/">
          <Image unoptimized src="/moc-logo.webp" alt="Moc Productions" width={100} height={30} className="w-[120px] md:w-[150px] cursor-pointer" />
        </Link>
      </div>

      {/* Nút Back sticky phía dưới bên phải cho mobile */}
      <Link
        href="/"
        className="md:hidden fixed bottom-4 right-4 px-4 py-2 text-xl font-bold z-50 bg-white/80 backdrop-blur-sm rounded-full text-black"
      >
        BACK
      </Link>

      <main className="h-screen md:pt-[100px]">
        {/* Desktop view - horizontal scroll */}
        <div
          ref={sliderRef}
          className="hidden md:flex md:overflow-x-auto h-[calc(100vh-120px)] w-full px-4 md:gap-16 md:overflow-y-hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Title slide */}
          <div className="h-full flex-shrink-0 flex items-center justify-center">
            <h1 className="text-5xl font-bold text-black text-center" {...e('pricing_title')}>
              <MultilineText text={t('pricing_title')} />
            </h1>
          </div>

          {/* Package slides */}
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="h-full flex-shrink-0 relative flex items-center justify-center"
            >
              <div className={`max-w-md p-8 rounded-xl shadow-lg bg-white ${pkg.popular ? 'ring-2 ring-black' : ''}`} {...e('pricing_packages')}>
                {pkg.popular && (
                  <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-sm rounded-full">
                    <span {...e('pricing_popular_badge')}>{t('pricing_popular_badge')}</span>
                  </div>
                )}
                <h2 className="text-3xl font-bold mb-2">{pkg.name}</h2>
                <p className="text-gray-600 mb-4">{pkg.description}</p>
                <div className="text-4xl font-bold mb-6">${pkg.basePrice}</div>
                <ul className="mb-6 space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full py-3 rounded-lg font-medium ${selectedPackage?.id === pkg.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                >
                  {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
                </button>
              </div>
            </div>
          ))}

          {/* Options slide */}
          <div className="h-full flex-shrink-0 relative flex items-center justify-center">
            <div className="max-w-md p-8 rounded-xl shadow-lg bg-white">
              <h2 className="text-3xl font-bold mb-6" {...e('pricing_options_title')}>{t('pricing_options_title')}</h2>
              <div className="space-y-4" {...e('pricing_options')}>
                {options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{option.name}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">${option.price}</span>
                      <button
                        onClick={() => handleToggleOption(option.id)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${option.selected ? 'bg-black' : 'bg-gray-300'
                          }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${option.selected ? 'translate-x-6' : ''
                          }`}></div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Total price slide */}
          <div className="h-full flex-shrink-0 relative flex items-center justify-center">
            <div className="max-w-md p-8 rounded-xl shadow-lg bg-white">
              <h2 className="text-3xl font-bold mb-6" {...e('pricing_summary_title')}>{t('pricing_summary_title')}</h2>
              {selectedPackage ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-2">Selected Package:</h3>
                    <div className="flex justify-between">
                      <span>{selectedPackage.name}</span>
                      <span className="font-medium">${selectedPackage.basePrice}</span>
                    </div>
                  </div>

                  {options.some(opt => opt.selected) && (
                    <div className="mb-6">
                      <h3 className="text-xl font-medium mb-2">Additional Options:</h3>
                      {options.filter(opt => opt.selected).map(option => (
                        <div key={option.id} className="flex justify-between">
                          <span>{option.name}</span>
                          <span className="font-medium">${option.price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total:</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>

                  <button className="w-full py-3 mt-6 bg-black text-white rounded-lg font-medium" {...e('pricing_booking_label')}>
                    {t('pricing_booking_label')}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please select a package to see your total</p>
                  <button
                    onClick={() => sliderRef.current?.scrollTo({ left: 0, behavior: 'smooth' })}
                    className="px-6 py-2 bg-black text-white rounded-lg font-medium"
                  >
                    View Packages
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile view - vertical scroll */}
        <div className="md:hidden pt-[100px] pb-20 px-4">
          <h1 className="text-3xl font-bold text-black text-center mb-8" {...e('pricing_title')}>
            {t('pricing_title').replace(/\s*\n\s*/g, ' ')}
          </h1>

          {/* Packages for mobile */}
          <div className="space-y-8 mb-12">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-6 rounded-xl shadow-lg bg-white relative ${pkg.popular ? 'ring-2 ring-black' : ''}`}
                {...e('pricing_packages')}
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-sm rounded-full">
                    <span {...e('pricing_popular_badge')}>{t('pricing_popular_badge')}</span>
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-2">{pkg.name}</h2>
                <p className="text-gray-600 mb-4">{pkg.description}</p>
                <div className="text-3xl font-bold mb-4">${pkg.basePrice}</div>
                <ul className="mb-6 space-y-2">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPackage(pkg)}
                  className={`w-full py-3 rounded-lg font-medium ${selectedPackage?.id === pkg.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                    }`}
                >
                  {selectedPackage?.id === pkg.id ? 'Selected' : 'Select Package'}
                </button>
              </div>
            ))}
          </div>

          {/* Options for mobile */}
          <div className="p-6 rounded-xl shadow-lg bg-white mb-8">
            <h2 className="text-2xl font-bold mb-6" {...e('pricing_options_title')}>{t('pricing_options_title')}</h2>
            <div className="space-y-4" {...e('pricing_options')}>
              {options.map((option) => (
                <div key={option.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">${option.price}</span>
                    <button
                      onClick={() => handleToggleOption(option.id)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${option.selected ? 'bg-black' : 'bg-gray-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${option.selected ? 'translate-x-6' : ''
                        }`}></div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total for mobile */}
          <div className="p-6 rounded-xl shadow-lg bg-white mb-8">
            <h2 className="text-2xl font-bold mb-6" {...e('pricing_summary_title')}>{t('pricing_summary_title')}</h2>
            {selectedPackage ? (
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-medium mb-2">Selected Package:</h3>
                  <div className="flex justify-between">
                    <span>{selectedPackage.name}</span>
                    <span className="font-medium">${selectedPackage.basePrice}</span>
                  </div>
                </div>

                {options.some(opt => opt.selected) && (
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-2">Additional Options:</h3>
                    {options.filter(opt => opt.selected).map(option => (
                      <div key={option.id} className="flex justify-between">
                        <span>{option.name}</span>
                        <span className="font-medium">${option.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total:</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>

                <button className="w-full py-3 mt-6 bg-black text-white rounded-lg font-medium" {...e('pricing_booking_label')}>
                  {t('pricing_booking_label')}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">Please select a package to see your total</p>
              </div>
            )}
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

export default PricingPage
