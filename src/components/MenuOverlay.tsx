'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSiteContent } from '@/content/SiteContentProvider';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const { t, e } = useSiteContent();

  // Log when props change

  useEffect(() => {
    setMounted(true);

    // Disable body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        .menu-overlay {
          backdrop-filter: blur(5px);
          background-color: rgba(0, 0, 0, 0.95);
        }

        /* Add animation for menu items */
        .menu-overlay a {
          position: relative;
          display: inline-block;
          transition: transform 0.3s ease, opacity 0.3s ease;
          cursor: pointer;
        }

        .menu-overlay a:hover {
          transform: translateX(10px);
        }

        .menu-overlay a::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: 0;
          left: 0;
          background-color: white;
          transition: width 0.3s ease;
        }

        .menu-overlay a:hover::after {
          width: 100%;
        }
      `}</style>
      <div
        className={`fixed inset-0 bg-black text-white z-[60] transition-all duration-500 menu-overlay ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className={`h-full flex flex-col transition-transform duration-500 ${
          isOpen ? 'translate-y-0' : '-translate-y-10'
        }`}>
          {/* Top section with logo and social links */}
          <div className="flex justify-between items-center py-4 md:py-6 px-6 md:px-10">
            <div className="w-1/3">
              <Link href="/" onClick={onClose}>
                <img
                  src="/moc-logo.webp"
                  alt="MOC Production Logo"
                  className="h-[40px] md:h-auto md:w-[100px] md:w-[120px] w-auto object-contain invert" // Sử dụng invert để đảo ngược màu đen thành trắng
                />
              </Link>
            </div>

            {/* Social links at top right */}
            <div className="w-1/3 flex justify-end gap-4 text-xs md:text-sm">
              <Link
                href={t('social_facebook')}
                {...e('social_facebook')}
                target="_blank"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
              >
                FACEBOOK
              </Link>
              <Link
                href={t('social_instagram')}
                {...e('social_instagram')}
                target="_blank"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
              >
                INSTAGRAM
              </Link>
              <Link
                href={t('social_youtube')}
                {...e('social_youtube')}
                target="_blank"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
              >
                YOUTUBE
              </Link>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-col md:flex-row justify-between h-full px-6 md:px-10 py-10">
            {/* Left side - Main navigation */}
            <div className="w-full md:w-1/2 flex flex-col text-6xl md:text-[8rem] font-bold space-y-6 md:space-y-10 leading-none">
              <Link
                href="/"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
                {...e('menu_home_label')}
              >
                {t('menu_home_label')}
              </Link>
              <Link
                href="/studio"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
                {...e('menu_projects_label')}
              >
                {t('menu_projects_label')}
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
                {...e('menu_about_label')}
              >
                {t('menu_about_label')}
              </Link>
            </div>

            {/* Right side - Secondary navigation */}
            {/* <div className="w-full md:w-1/2 mt-10 md:mt-0 flex flex-col items-start md:items-end text-lg md:text-xl space-y-4">
              <Link
                href="/"
                onClick={onClose}
                className="hover:opacity-70 transition-all duration-300"
              >
                PROJECTS
              </Link>
            </div> */}
          </div>

          {/* Contact section at bottom right */}
          <div className="absolute bottom-10 right-10 text-6xl md:text-[8rem] font-bold leading-none">
            <Link
              href="/contact"
              onClick={onClose}
              className="hover:opacity-70 transition-all duration-300"
              {...e('menu_contact_label')}
            >
              {t('menu_contact_label')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuOverlay;
