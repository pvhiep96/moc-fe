'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import type { Project } from '@/types/project';
import { hasHoverVideo } from '@/types/project';
import type { SiteSettings } from '@/services/server';
import { useSiteContent } from '@/content/SiteContentProvider';
import GoogleImage from '@/components/GoogleImage';
import { getGoogleDriveVideoId, getYouTubeId } from '@/utils/media';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

// Góc vàng (Golden Angle ~137.5 độ) để phân bổ xoắn ốc 3D hài hòa quanh tâm
const GOLDEN_ANGLE_RAD = 2.399963229728653;

const FALLBACK_IMAGES = [
  '/featured1.webp',
  '/featured2.webp',
  '/about1.jpg',
  '/about2.jpg',
  '/about3.jpg',
  '/aerial-view.jpg',
  '/project1.jpg',
  '/project2.jpg',
];

type MediaItem = {
  key: string;
  type: 'image' | 'vertical_video' | 'youtube';
  src: string;
  poster?: string;
  projectName?: string;
};

/**
 * Liên kết chữ chuyển động từng ký tự khi di chuột
 */
function CharStaggerLink({
  text,
  href,
  onClick,
  external = false,
  editKey,
}: {
  text: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  editKey?: string;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const inner = (
    <span className="moc-char-link-track" aria-label={text}>
      {chars.map((ch, idx) => {
        const display = ch.trim() === '' ? '\u00A0' : ch;
        return (
          <span
            key={idx}
            className="moc-char-glyph"
            data-glyph={display}
            style={{ '--char-idx': idx } as CSSVars}
            aria-hidden="true"
          >
            {display}
          </span>
        );
      })}
    </span>
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="moc-char-link"
          data-edit={editKey}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className="moc-char-link">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="moc-char-link">
      {inner}
    </button>
  );
}

export default function StudioClient({ projects }: { projects: Project[] }) {
  // Nội dung chữ do admin sửa (SiteContentProvider) — cập nhật trực tiếp khi xem trước trong admin
  const { values, lines } = useSiteContent();
  const siteSettings = values as SiteSettings;
  // Ảnh / video admin chọn riêng (để trống → tự lấy từ các dự án như trước)
  const customHeroImages = lines('hero_images');
  const customOrbitImages = lines('orbit_images');
  const customHeroVideo = typeof values.hero_video === 'string' ? values.hero_video : '';
  const customFooterVideo = typeof values.footer_video === 'string' ? values.footer_video : '';
  const footerShowVideo = values.footer_show_video !== false;
  const footerImage = (typeof values.footer_image === 'string' && values.footer_image) || '/about-moc.webp';
  const featuredIds = useMemo(
    () => (Array.isArray(values.featured_project_ids) ? (values.featured_project_ids as number[]) : []),
    [values.featured_project_ids]
  );
  const [headerVisible, setHeaderVisible] = useState(false);

  // Gom ảnh đại diện cho màn mở đầu
  const heroImages = useMemo(() => {
    if (customHeroImages.length > 0) return customHeroImages.slice(0, 8);
    const collected: string[] = [];
    projects.forEach((p) => {
      const cover = p.cover_image || p.images?.[0];
      if (cover && !collected.includes(cover)) collected.push(cover);
      if (p.hover_image && !collected.includes(p.hover_image)) {
        collected.push(p.hover_image);
      }
    });
    for (const fb of FALLBACK_IMAGES) {
      if (collected.length >= 8) break;
      if (!collected.includes(fb)) collected.push(fb);
    }
    return collected.slice(0, 8);
  }, [projects, customHeroImages]);

  // Video dọc đầu tiên (nếu có)
  const primaryVerticalVideo = useMemo(() => {
    const found = projects.find((p) => hasHoverVideo(p));
    return found?.video_vertical?.video_url || null;
  }, [projects]);

  // 20 mục hình ảnh & video cho phần "Emotion, light, cinema"
  const showcaseMedia = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    if (customOrbitImages.length > 0) {
      // Ảnh admin chọn: lặp lại cho đủ 20 khung
      for (let i = 0; i < 20; i++) {
        items.push({
          key: `custom-${i}`,
          type: 'image',
          src: customOrbitImages[i % customOrbitImages.length],
          projectName: 'MOC Productions',
        });
      }
      return items;
    }

    projects.forEach((project) => {
      if (hasHoverVideo(project) && project.video_vertical?.video_url) {
        items.push({
          key: `vvert-${project.id}`,
          type: 'vertical_video',
          src: project.video_vertical.video_url,
          poster: project.cover_image || project.images?.[0] || undefined,
          projectName: project.name,
        });
      }

      if (project.video_urls?.length) {
        project.video_urls.slice(0, 2).forEach((v, idx) => {
          const ytId = getYouTubeId(v.url);
          const gdId = getGoogleDriveVideoId(v.url);
          if (ytId) {
            items.push({
              key: `yt-${project.id}-${idx}`,
              type: 'youtube',
              src: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
              projectName: `${project.name} — Film`,
            });
          } else if (gdId) {
            items.push({
              key: `gd-${project.id}-${idx}`,
              type: 'youtube',
              src: `https://lh3.googleusercontent.com/d/${gdId}=s0`,
              projectName: `${project.name} — Film`,
            });
          }
        });
      }

      const imgs = project.images?.length
        ? project.images.slice(0, 5)
        : project.cover_image
          ? [project.cover_image]
          : [];
      imgs.forEach((imgUrl, idx) => {
        items.push({
          key: `img-${project.id}-${idx}`,
          type: 'image',
          src: imgUrl,
          projectName: project.name,
        });
      });
    });

    let fbIdx = 0;
    while (items.length < 20) {
      const fb = FALLBACK_IMAGES[fbIdx % FALLBACK_IMAGES.length];
      items.push({
        key: `fallback-${items.length}`,
        type: 'image',
        src: fb,
        projectName: 'MOC Productions',
      });
      fbIdx++;
    }

    return items.slice(0, 20);
  }, [projects, customOrbitImages]);

  // Các dự án nổi bật cho phần trình chiếu toàn màn hình
  const featuredProjects = useMemo(() => {
    if (featuredIds.length > 0) {
      const picked = featuredIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is Project => Boolean(p));
      if (picked.length > 0) return picked;
    }
    const withMedia = projects.filter(
      (p) =>
        p.cover_image ||
        (p.images && p.images.length > 0) ||
        (p.video_urls && p.video_urls.length > 0) ||
        hasHoverVideo(p)
    );
    const sorted = [...withMedia].sort((a, b) => {
      const aHasVid =
        (a.video_urls?.length ? 2 : 0) + (hasHoverVideo(a) ? 1 : 0);
      const bHasVid =
        (b.video_urls?.length ? 2 : 0) + (hasHoverVideo(b) ? 1 : 0);
      return bHasVid - aHasVid;
    });
    return sorted.slice(0, 5);
  }, [projects, featuredIds]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="moc-stage-page">
      {/* Header cố định sử dụng Motion (motion.dev — MIT) */}
      <motion.header
        className="moc-header-blend"
        initial={{ opacity: 0, y: -36, filter: 'blur(14px)' }}
        animate={
          headerVisible
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : { opacity: 0, y: -36, filter: 'blur(14px)' }
        }
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav aria-label="MOC Navigation">
          <CharStaggerLink
            text="(About)"
            onClick={() => scrollToSection('about')}
          />
          <CharStaggerLink
            text="(Philosophy)"
            onClick={() => scrollToSection('philosophy')}
          />
          <CharStaggerLink
            text="(Works)"
            onClick={() => scrollToSection('works')}
          />
          <CharStaggerLink
            text="(Contact)"
            onClick={() => scrollToSection('contact')}
          />
          <CharStaggerLink text="(Gallery)" href="/studio" />
        </nav>
      </motion.header>

      {/* Section 1: Hero Aperture Reveal */}
      <div id="about">
        <HeroIntroSection
          images={heroImages}
          bgVideoUrl={customHeroVideo || primaryVerticalVideo}
          settings={siteSettings}
          onRevealReady={() => setHeaderVisible(true)}
        />
      </div>

      {/* Section 2: Philosophy Spotlight */}
      <PhilosophySpotlightSection settings={siteSettings} />

      {/* Section 3: "Emotion, light, cinema" — Đã chốt Hiệu ứng 3 (Contact Sheet 3D) */}
      <div id="philosophy">
        <OrbitCinemaSection
          mediaItems={showcaseMedia}
          settings={siteSettings}
        />
      </div>

      {/* Section 4: "Works" — 4 Hiệu Ứng Chuyển Tiếp Nhiếp Ảnh & Typography */}
      <DualKineticMarquee projects={projects} settings={siteSettings} />

      {/* Section 5: "Selected Works" — 4 Hiệu Ứng Danh Mục Tác Phẩm */}
      <div id="works">
        <WorksCollectionSection projects={projects} settings={siteSettings} />
      </div>

      {/* Section 6: "Featured Works" — 4 Hiệu Ứng Sân Khấu Tác Phẩm Tiêu Biểu */}
      {featuredProjects.length > 0 && (
        <FeaturedStageShowcase
          projects={featuredProjects}
          settings={siteSettings}
        />
      )}

      {/* Section 7: Contact Parallax Reveal Footer (Motion useScroll) */}
      <div id="contact">
        <ContactRevealFooter
          verticalVideoUrl={footerShowVideo ? customFooterVideo || primaryVerticalVideo : null}
          portraitImage={footerImage}
          settings={siteSettings}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   1. HERO INTRO SECTION (Powered by motion/react)
   ============================================================================ */
function HeroIntroSection({
  images,
  bgVideoUrl,
  settings,
  onRevealReady,
}: {
  images: string[];
  bgVideoUrl: string | null;
  settings?: SiteSettings;
  onRevealReady: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [settled, setSettled] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const logoParallaxY = useTransform(scrollYProgress, [0, 1], ['0vh', '-20vh']);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const count = images.length;

    for (let i = 1; i <= count; i++) {
      timers.push(
        setTimeout(() => {
          setStep(i);
        }, 180 + i * 120)
      );
    }

    const finalWipeTime = 180 + (count + 1) * 120;
    timers.push(
      setTimeout(() => {
        setStep(count + 1);
      }, finalWipeTime)
    );

    timers.push(
      setTimeout(() => {
        setExpanded(true);
      }, finalWipeTime + 480)
    );

    timers.push(
      setTimeout(() => {
        setSettled(true);
        onRevealReady();
      }, finalWipeTime + 1150)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [images.length, onRevealReady]);

  const captions = [
    {
      key: 'hero_caption_left',
      className: 'moc-hero-caption--left',
      text:
        settings?.hero_caption_left ||
        'A creative studio specializing in wedding film & photography, based in Vietnam.',
    },
    {
      key: 'hero_caption_right',
      className: 'moc-hero-caption--right',
      text:
        settings?.hero_caption_right ||
        'Two hearts, one vision. Capturing timeless love stories for over a decade.',
    },
    {
      key: 'hero_caption_bl',
      className: 'moc-hero-caption--bl',
      text: settings?.hero_caption_bl || '10°46\'37" N',
    },
    {
      key: 'hero_caption_bc',
      className: 'moc-hero-caption--bc',
      text: settings?.hero_caption_bc || 'Saigon, Vietnam',
    },
    {
      key: 'hero_caption_br',
      className: 'moc-hero-caption--br',
      text: settings?.hero_caption_br || '106°42\'03" E',
    },
  ];

  return (
    <div ref={containerRef} className="moc-hero-root">
      <div className={`moc-hero-aperture ${expanded ? 'is-expanded' : ''}`}>
        {images.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            data-edit="hero_images"
            className={`moc-hero-frame ${step > idx ? 'is-revealed' : ''} ${
              expanded ? 'is-hidden-after' : ''
            }`}
          >
            <GoogleImage
              src={src}
              width={640}
              loading="eager"
              decoding="async"
            />
          </div>
        ))}

        <div
          data-edit="hero_video"
          className={`moc-hero-frame moc-hero-final-stage ${
            step > images.length ? 'is-revealed' : ''
          }`}
        >
          {bgVideoUrl && settled && (
            <video
              key={bgVideoUrl}
              className="moc-hero-ambient-video"
              src={bgVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          <div
            className={`moc-hero-decade-wrap ${settled ? 'is-settled' : ''}`}
          >
            <span className="moc-hero-decade-num" aria-hidden="true" data-edit="hero_decade_num">
              {settings?.hero_decade_num || '10'}
            </span>
          </div>
        </div>

        {/* Logo MOC trung tâm với hiệu ứng parallax từ motion/react */}
        <motion.img
          src="/moc-logo.webp"
          alt="MOC Nguyen Productions"
          className="moc-hero-center-logo"
          width={600}
          height={316}
          style={{
            x: '-50%',
            y: logoParallaxY,
            translateY: '-50%',
          }}
        />

        {/* 5 khối chữ quanh màn hình */}
        <div className="moc-hero-captions">
          {captions.map((item, idx) => (
            <motion.div
              key={item.className}
              data-edit={item.key}
              className={`moc-hero-caption ${item.className}`}
              initial={{ opacity: 0, y: 36, filter: 'blur(16px)' }}
              animate={
                settled
                  ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                  : { opacity: 0, y: 36, filter: 'blur(16px)' }
              }
              transition={{
                duration: 0.9,
                delay: idx * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {item.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   2. PHILOSOPHY SPOTLIGHT SECTION (Powered by motion/react springs)
   ============================================================================ */
function PhilosophySpotlightSection({
  settings,
}: {
  settings?: SiteSettings;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  const spotX = useMotionValue(-9999);
  const spotY = useMotionValue(-9999);
  const spotAlpha = useMotionValue(0);

  const smoothX = useSpring(spotX, { stiffness: 140, damping: 26 });
  const smoothY = useSpring(spotY, { stiffness: 140, damping: 26 });
  const smoothAlpha = useSpring(spotAlpha, { stiffness: 120, damping: 24 });

  useMotionValueEvent(smoothX, 'change', (val) => {
    textRef.current?.style.setProperty('--spot-x', `${val.toFixed(1)}px`);
  });
  useMotionValueEvent(smoothY, 'change', (val) => {
    textRef.current?.style.setProperty('--spot-y', `${val.toFixed(1)}px`);
  });
  useMotionValueEvent(smoothAlpha, 'change', (val) => {
    textRef.current?.style.setProperty('--spot-alpha', val.toFixed(3));
  });

  return (
    <section className="moc-philosophy-section">
      <div
        ref={textRef}
        className="moc-philosophy-spotlight"
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          spotX.jump(e.clientX - rect.left);
          spotY.jump(e.clientY - rect.top);
          spotAlpha.set(1);
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          spotX.set(e.clientX - rect.left);
          spotY.set(e.clientY - rect.top);
          spotAlpha.set(1);
        }}
        onMouseLeave={() => {
          spotAlpha.set(0);
        }}
      >
        <span className="moc-philosophy-line moc-philosophy-line--indent" data-edit="philosophy_line_1">
          {settings?.philosophy_line_1 ||
            'We believe in love and its pure beauty, told through'}
        </span>
        <span className="moc-philosophy-line" data-edit="philosophy_line_2">
          {settings?.philosophy_line_2 ||
            'light, motion, and timeless frames. For us, the art'}
        </span>
        <span className="moc-philosophy-line" data-edit="philosophy_line_3">
          {settings?.philosophy_line_3 ||
            'lies in the quiet moments between two hearts—the'}
        </span>
        <span className="moc-philosophy-line" data-edit="philosophy_line_4">
          {settings?.philosophy_line_4 ||
            'glances, the laughter, the unspoken warmth that makes'}
        </span>
        <span className="moc-philosophy-line" data-edit="philosophy_line_5">
          {settings?.philosophy_line_5 ||
            'every story uniquely yours and forever remembered.'}
        </span>
      </div>
    </section>
  );
}

/* ============================================================================
   3. "EMOTION, LIGHT, CINEMA" — ĐÃ CHỐT CỐ ĐỊNH PHƯƠNG ÁN 3:
      ACETERNITY 3D DARKROOM CONTACT SHEET PARALLAX + CAMERA VIEWFINDER HUD
   ============================================================================ */
function OrbitCinemaSection({
  mediaItems,
  settings,
}: {
  mediaItems: MediaItem[];
  settings?: SiteSettings;
}) {
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const counterTextRef = useRef<HTMLSpanElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: scrollWrapRef,
    offset: ['start start', 'end end'],
  });

  // Lò xo vật lý của Motion (motion.dev)
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 26,
    restDelta: 0.0001,
  });

  // Hiệu ứng xuất hiện cho khung ngắm máy ảnh trung tâm (Camera Viewfinder)
  const headlineOpacity = useTransform(
    smoothProgress,
    [0, 0.04, 0.93, 0.99],
    [0, 1, 1, 0]
  );
  const headlineScale = useTransform(
    smoothProgress,
    [0, 0.06, 0.5, 0.92, 1],
    [0.86, 1, 1.03, 1, 0.92]
  );

  // Phương án 3 đã chốt: Aceternity 3D Darkroom Contact Sheet Rows
  const sheetRow1X = useTransform(smoothProgress, [0, 1], ['4%', '-38%']);
  const sheetRow2X = useTransform(smoothProgress, [0, 1], ['-36%', '6%']);
  const sheetRow3X = useTransform(smoothProgress, [0, 1], ['2%', '-34%']);

  const renderAtProgress = useCallback(
    (progress: number) => {
      const clamp = (min: number, max: number, v: number) =>
        Math.min(max, Math.max(min, v));

      // Cập nhật bộ đếm frame máy ảnh & kim đo sáng (Exposure Meter)
      const count = mediaItems.length;
      const currentFrame = clamp(
        1,
        count,
        Math.round(progress * (count - 1)) + 1
      );
      if (counterTextRef.current) {
        counterTextRef.current.textContent = `${String(currentFrame).padStart(
          2,
          '0'
        )} / ${String(count).padStart(2, '0')}`;
      }
      if (needleRef.current) {
        needleRef.current.style.left = `${(progress * 100).toFixed(1)}%`;
      }
    },
    [mediaItems.length]
  );

  useMotionValueEvent(smoothProgress, 'change', renderAtProgress);

  useEffect(() => {
    renderAtProgress(smoothProgress.get());
  }, [renderAtProgress, smoothProgress]);

  return (
    <div ref={scrollWrapRef} className="moc-orbit-scroll-track">
      <div className="moc-orbit-sticky-stage">
        {/* BÀN RỬA ẢNH PHÒNG TỐI 3D (ACETERNITY 3D DARKROOM CONTACT SHEET) */}
        <div className="moc-contact-sheet-stage" aria-hidden="true" data-edit="orbit_images">
          {[
            { items: mediaItems.slice(0, 7), x: sheetRow1X, row: 'R1' },
            { items: mediaItems.slice(7, 14), x: sheetRow2X, row: 'R2' },
            { items: mediaItems.slice(13, 20), x: sheetRow3X, row: 'R3' },
          ].map((group, gIdx) => (
            <motion.div
              key={group.row}
              className="moc-contact-sheet-row"
              style={{ x: group.x }}
            >
              {[...group.items, ...group.items].map((item, idx) => (
                <div
                  key={`${group.row}-${idx}`}
                  className="moc-contact-sheet-card"
                >
                  <GoogleImage
                    src={item.src}
                    width={640}
                    loading="eager"
                    decoding="async"
                  />
                  <div className="moc-contact-sheet-caption">
                    <span>{item.projectName || 'M.O.C Archive'}</span>
                    <span>
                      ({String(gIdx + 1).padStart(2, '0')} ·{' '}
                      {String(idx + 1).padStart(2, '0')})
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* TRUNG TÂM: KHUNG NGẮM TRIỂN LÃM TỐI GIẢN SANG TRỌNG */}
        <motion.div
          className="moc-viewfinder-hud"
          style={{
            opacity: headlineOpacity,
            scale: headlineScale,
          }}
        >
          {/* 4 góc khung lấy nét mảnh tinh tế [ ] */}
          <span className="moc-vf-corner moc-vf-corner--tl" />
          <span className="moc-vf-corner moc-vf-corner--tr" />
          <span className="moc-vf-corner moc-vf-corner--bl" />
          <span className="moc-vf-corner moc-vf-corner--br" />

          {/* Dòng chỉ mục tối giản phía trên */}
          <div className="moc-vf-top-meta">
            <span className="moc-vf-rec">
              <span className="moc-vf-rec-dot" />
              M.O.C Monograph
            </span>
            <span ref={counterTextRef}>01 / {mediaItems.length}</span>
            <span data-edit="orbit_reel_label">{settings?.orbit_reel_label || 'Fine-Art Archive'}</span>
          </div>

          <div className="moc-orbit-headline-row" data-edit="orbit_title_line_1">
            {settings?.orbit_title_line_1 || 'Emotion, light, cinema:'}
          </div>
          <div className="moc-orbit-headline-row" data-edit="orbit_title_line_2">
            {settings?.orbit_title_line_2 || 'The foundations of our work'}
          </div>

          {/* Thước chỉ báo tiến độ mảnh sang trọng chạy theo cuộn chuột */}
          <div className="moc-vf-exposure-bar">
            <div className="moc-vf-exposure-scale">
              <span>-2</span>
              <span>·</span>
              <span>-1</span>
              <span>·</span>
              <span style={{ color: '#ffffff', fontWeight: 500 }}>0</span>
              <span>·</span>
              <span>+1</span>
              <span>·</span>
              <span>+2</span>
            </div>
            <div className="moc-vf-exposure-track">
              <div
                ref={needleRef}
                className="moc-vf-exposure-needle"
                style={{ left: '50%' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================================
   4. "WORKS" — CHỐT PHƯƠNG ÁN 2: PURE MONUMENTAL TYPOGRAPHY
      (Chữ "W-o-r-k-s" Khổng Lồ Trồi Lên Từng Ký Tự & Lấy Nét Quang Học —
       Khoảng Thở Kiến Trúc Tối Giản Sang Trọng, Đã Xóa Các Phương Án Khác)
   ============================================================================ */
function DualKineticMarquee({
  settings,
}: {
  projects?: Project[];
  settings?: SiteSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
  });

  // Pure Monumental Split-Character Rise & Optical Blur-to-Sharp (100% Typography)
  const char0Y = useTransform(smoothScroll, [0.08, 0.42], ['105%', '0%']);
  const char1Y = useTransform(smoothScroll, [0.11, 0.45], ['105%', '0%']);
  const char2Y = useTransform(smoothScroll, [0.14, 0.48], ['105%', '0%']);
  const char3Y = useTransform(smoothScroll, [0.17, 0.51], ['105%', '0%']);
  const char4Y = useTransform(smoothScroll, [0.2, 0.54], ['105%', '0%']);
  const charFilter = useTransform(
    smoothScroll,
    [0.1, 0.44, 0.65, 0.9],
    ['blur(14px)', 'blur(0px)', 'blur(0px)', 'blur(8px)']
  );
  const charOpacity = useTransform(
    smoothScroll,
    [0.08, 0.38, 0.72, 0.92],
    [0.15, 1, 1, 0.35]
  );
  const horizonLineScale = useTransform(smoothScroll, [0.1, 0.5], [0.15, 1]);

  const word1 = settings?.marquee_word_1 || 'Works';
  const chars = word1.split('');
  const charTransforms = [char0Y, char1Y, char2Y, char3Y, char4Y];

  return (
    <div ref={containerRef} className="moc-kinetic-marquee">
      <div className="moc-works-monolith-stage">
        <div className="moc-works-chapter-meta">
          <span>Chapter 02 — Selected Works</span>
          <span>Pure Architectural Typography</span>
          <span>M.O.C Studio</span>
        </div>

        <div style={{ width: '100%', textAlign: 'center', margin: '24px 0' }}>
          <motion.div
            style={{
              width: '100%',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.16)',
              scaleX: horizonLineScale,
              transformOrigin: 'center',
            }}
          />

          <div className="moc-works-monolith-chars" data-edit="marquee_word_1">
            {chars.map((ch, idx) => (
              <motion.span
                key={`ch-${idx}`}
                className="moc-works-monolith-char"
                style={{
                  y: charTransforms[idx % charTransforms.length],
                  filter: charFilter,
                  opacity: charOpacity,
                }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.div
            style={{
              width: '100%',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.16)',
              scaleX: horizonLineScale,
              transformOrigin: 'center',
            }}
          />
        </div>

        <div className="moc-works-chapter-meta">
          <span>Fine-Art Cinema &amp; Photography</span>
          <span>Every Frame Authored</span>
          <span>Continue ↓</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. "SELECTED WORKS" — CHỐT PHƯƠNG ÁN 1 FULLSCREEN (100VW × 100VH):
      FULLSCREEN RANGEFINDER MONOGRAPH
      (Khung Ảnh Toàn Màn Hình 100vw × 100vh Lấy Nét Quang Học + 4 Góc Chụp +
       Mục Lục Cặp Đôi Nổi Trên Nền Fullscreen)
   ============================================================================ */
function WorksCollectionSection({
  projects,
  settings,
}: {
  projects: Project[];
  settings?: SiteSettings;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimerRef = useRef<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [subThumbIdx, setSubThumbIdx] = useState<number>(0);
  const count = Math.max(projects.length, 1);

  const handleRangefinderSelect = useCallback((idx: number) => {
    setActiveIdx((prev) => {
      if (idx === prev) return prev;
      setSubThumbIdx(0);
      return idx;
    });
  }, []);

  // Tự động chuyển qua từng cặp đôi mượt mà khi cuộn dọc trong vùng Sticky 100vw × 100vh
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
  });

  const progressScaleX = useTransform(smoothProgress, [0, 1], [0.05, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    isScrollingRef.current = true;
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 320);

    const nextIdx = Math.min(
      count - 1,
      Math.max(0, Math.floor(latest * count * 0.999))
    );
    handleRangefinderSelect(nextIdx);
  });

  const activeProject = projects[activeIdx] || projects[0];
  const activeProjectImages = useMemo(() => {
    if (!activeProject) return FALLBACK_IMAGES.slice(0, 4);
    const imgs: string[] = [];
    if (activeProject.cover_image) imgs.push(activeProject.cover_image);
    if (activeProject.images?.length) {
      activeProject.images.forEach((u) => {
        if (!imgs.includes(u)) imgs.push(u);
      });
    }
    return imgs.length > 0 ? imgs.slice(0, 4) : FALLBACK_IMAGES.slice(0, 4);
  }, [activeProject]);

  return (
    <section className="moc-works-section">
      <div>
        <div className="moc-works-heading-bar">
          <div className="moc-works-heading-label" data-edit="works_top_left_label">
            {settings?.works_top_left_label || 'Selected Works'}
          </div>
          <div className="moc-works-heading-quote" data-edit="works_top_quote">
            {settings?.works_top_quote ||
              'Every decision, every detail is a lever, each one working to make the story live forever'}
          </div>
          <div className="moc-works-heading-label moc-works-heading-label--end" data-edit="works_top_right_label">
            {settings?.works_top_right_label || 'Explore'}
          </div>
        </div>

        {activeProject && (
          <div ref={trackRef} className="moc-rangefinder-track">
            <div className="moc-rangefinder-layout">
              {/* LỚP NỀN TOÀN MÀN HÌNH 100VW × 100VH VỚI HIỆU ỨNG XOAY VÒNG LẤY NÉT ỐNG KÍNH THẬT */}
              <div className="moc-rangefinder-screen">
                {projects.map((proj, pIdx) => {
                  const isAct = pIdx === activeIdx;
                  const coverUrl =
                    isAct && subThumbIdx > 0
                      ? activeProjectImages[subThumbIdx] ||
                        activeProjectImages[0]
                      : proj.cover_image ||
                        proj.images?.[0] ||
                        FALLBACK_IMAGES[pIdx % FALLBACK_IMAGES.length];

                  return (
                    <div
                      key={`${proj.id}-${isAct ? subThumbIdx : 0}`}
                      data-edit-project={proj.id}
                      data-edit-project-name={proj.name}
                      className={`moc-rangefinder-bg-layer ${
                        isAct ? 'is-active' : ''
                      }`}
                    >
                      <GoogleImage
                        src={coverUrl}
                        width={1920}
                        widths={[828, 1440, 1920, 2560]}
                        sizes="100vw"
                        alt={proj.name}
                        loading={pIdx <= 1 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </div>
                  );
                })}

                {/* Lớp bóng ma Lăng Kính Chập Nét (Split-Prism Ghost Alignment) của máy ảnh */}
                <div
                  key={`ghost-${activeIdx}-${subThumbIdx}`}
                  className="moc-af-ghost-layer"
                >
                  <GoogleImage
                    src={
                      activeProjectImages[subThumbIdx] || activeProjectImages[0]
                    }
                    width={1280}
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                </div>

                <div className="moc-rangefinder-screen-shade" />
              </div>

              {/* Khung Ngắm Autofocus Máy Ảnh (4 Ngàm Chữ L Co Giãn + Thước Khoảng Cách Ống Kính) */}
              <div
                key={`reticle-${activeIdx}-${subThumbIdx}`}
                className="moc-rangefinder-reticle"
              >
                <span className="moc-af-corner moc-af-corner--tl" />
                <span className="moc-af-corner moc-af-corner--tr" />
                <span className="moc-af-corner moc-af-corner--bl" />
                <span className="moc-af-corner moc-af-corner--br" />

                {/* Thông số ống kính trên đỉnh khung ngắm AF */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '8.5px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.72)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>AF-C · Wide</span>
                  <span>50mm f/1.2</span>
                </div>

                {/* Thước đo khoảng cách lấy nét quang học dưới đáy khung AF */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-34px',
                    left: '-16px',
                    right: '-16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '8px',
                      letterSpacing: '0.12em',
                      color: 'rgba(255, 255, 255, 0.52)',
                    }}
                  >
                    <span>0.5m</span>
                    <span>1.0m</span>
                    <span style={{ color: '#ffffff' }}>1.5m</span>
                    <span>3.0m</span>
                    <span>∞</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        left: `${
                          20 + ((activeIdx * 17 + subThumbIdx * 13) % 60)
                        }%`,
                        width: '1px',
                        height: '7px',
                        background: '#ffffff',
                        transition: 'left 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CỘT TRÁI FULLSCREEN (100VH): Thông tin Monograph + 4 góc chụp + Mở bộ ảnh */}
              <div className="moc-rangefinder-left-stage">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10.5px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.68)',
                  }}
                >
                  <span>Selected Works — Fullscreen Stage</span>
                  <span>
                    Frame 0{subThumbIdx + 1} / 0{activeProjectImages.length}
                  </span>
                </div>

                <div>
                  <div className="moc-lookbook-viewer-hud">
                    <div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(255, 255, 255, 0.62)',
                          marginBottom: '8px',
                        }}
                      >
                        Monograph ({String(activeIdx + 1).padStart(2, '0')} /{' '}
                        {String(projects.length).padStart(2, '0')})
                      </div>
                      <Link
                        href={`/projects/${activeProject.id}`}
                        style={{
                          fontSize: 'clamp(34px, 4.8vw, 76px)',
                          fontWeight: 300,
                          letterSpacing: '-0.05em',
                          lineHeight: 0.96,
                          color: '#ffffff',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        {activeProject.name}
                      </Link>
                    </div>

                    {/* 4 ảnh nhỏ cho phép bấm xem thử các góc chụp ngay trên nền Fullscreen */}
                    <div className="moc-lookbook-thumbs">
                      {activeProjectImages.map((img, i) => (
                        <div
                          key={i}
                          className="moc-lookbook-thumb"
                          style={{
                            cursor: 'pointer',
                            opacity: i === subThumbIdx ? 1 : 0.55,
                            borderColor:
                              i === subThumbIdx
                                ? '#ffffff'
                                : 'rgba(255,255,255,0.22)',
                          }}
                          onClick={() => setSubThumbIdx(i)}
                        >
                          <GoogleImage
                            src={img}
                            width={240}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))}

                      <Link
                        href={`/projects/${activeProject.id}`}
                        style={{
                          marginLeft: '8px',
                          padding: '12px 22px',
                          borderRadius: '999px',
                          border: '1px solid rgba(255, 255, 255, 0.35)',
                          background: 'rgba(10, 10, 12, 0.55)',
                          backdropFilter: 'blur(8px)',
                          color: '#ffffff',
                          fontSize: '11px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Story ↗
                      </Link>
                    </div>
                  </div>

                  {/* Đường chỉ tiến trình cuộn 1px siêu mượt */}
                  <div
                    style={{
                      width: '100%',
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      marginTop: '20px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: '#ffffff',
                        scaleX: progressScaleX,
                        transformOrigin: 'left',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI FULLSCREEN (100VH): Danh sách các cặp đôi nổi trên nền kính mờ */}
              <div className="moc-rangefinder-right-index">
                <div
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.45)',
                    marginBottom: '14px',
                  }}
                >
                  Select a Story ({String(projects.length).padStart(2, '0')}{' '}
                  Monographs)
                </div>

                {projects.map((project, index) => {
                  const isSelected = index === activeIdx;
                  const photoCount = project.images?.length || 0;
                  const filmCount =
                    (project.video_urls?.length || 0) +
                    (hasHoverVideo(project) ? 1 : 0);
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      data-edit-project={project.id}
                      data-edit-project-name={project.name}
                      className={`moc-lookbook-list-item ${
                        isSelected ? 'is-active' : ''
                      }`}
                      onMouseMove={() => {
                        if (!isScrollingRef.current) {
                          handleRangefinderSelect(index);
                        }
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: isSelected
                              ? 'rgba(255,255,255,0.78)'
                              : 'rgba(255,255,255,0.38)',
                            marginBottom: '4px',
                          }}
                        >
                          ({String(index + 1).padStart(2, '0')}) — {photoCount}{' '}
                          Photos
                          {filmCount > 0 ? ` · ${filmCount} Film` : ''}
                        </div>
                        <div className="moc-lookbook-list-name">
                          {project.name}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: isSelected
                            ? '#ffffff'
                            : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {isSelected ? 'Explore ↗' : '→'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="moc-works-heading-bar">
        <div className="moc-works-heading-label" data-edit="works_bottom_left_label">
          {settings?.works_bottom_left_label || 'Featured Works'}
        </div>
        <div
          className="moc-works-heading-quote"
          data-edit="works_bottom_quote"
          style={{ maxWidth: '300px' }}
        >
          {settings?.works_bottom_quote ||
            'Films and photographs that reflect our heart, vision, and craft'}
        </div>
        <div className="moc-works-heading-label moc-works-heading-label--end" data-edit="works_bottom_right_label">
          {settings?.works_bottom_right_label || 'Explore'}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   6. "FEATURED WORKS" — CHỐT PHƯƠNG ÁN 2:
      STICKY SPLIT-SCREEN 50/50 FINE-ART PHOTOBOOK SPREAD
      (Sách Ảnh Nghệ Thuật 2 Trang Ghim Cố Định 50/50 — Đã Xóa Các Phương Án Khác)
   ============================================================================ */
function FeaturedStageShowcase({
  projects,
}: {
  projects: Project[];
  settings?: SiteSettings;
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => projects.slice(0, 4), [projects]);
  const count = Math.max(items.length, 1);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const idx = Math.min(count - 1, Math.max(0, Math.floor(latest * count)));
    setActiveIdx(idx);
  });

  const rightClip1 = useTransform(
    smoothScroll,
    [0.18, 0.42],
    ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)']
  );
  const rightClip2 = useTransform(
    smoothScroll,
    [0.45, 0.69],
    ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)']
  );
  const rightClip3 = useTransform(
    smoothScroll,
    [0.72, 0.95],
    ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)']
  );
  const insetY = useTransform(smoothScroll, [0, 1], ['28px', '-28px']);

  const rightClips = [undefined, rightClip1, rightClip2, rightClip3];
  const currentProj = items[activeIdx] || items[0];
  const insetImg =
    currentProj?.images?.[1] ||
    currentProj?.hover_image ||
    currentProj?.cover_image ||
    FALLBACK_IMAGES[1];

  return (
    <div ref={trackRef} className="moc-feat-book-track">
      <div className="moc-feat-book-sticky">
        {/* Trang Trái: Editorial Typography + Ảnh Phụ Chân Dung */}
        <div className="moc-feat-book-left" data-edit="featured_project_ids">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.45)',
            }}
          >
            <span>M.O.C Monograph Spread</span>
            <span>
              Page ({String(activeIdx + 1).padStart(2, '0')} /{' '}
              {String(count).padStart(2, '0')})
            </span>
          </div>

          {currentProj && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
                margin: 'auto 0',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10.5px',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.48)',
                    marginBottom: '12px',
                  }}
                >
                  Featured Collection · {currentProj.images?.length || 0} Plates
                </div>
                <h3
                  style={{
                    fontSize: 'clamp(36px, 4.6vw, 76px)',
                    fontWeight: 300,
                    letterSpacing: '-0.05em',
                    lineHeight: 0.95,
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  {currentProj.name}
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '28px',
                  flexWrap: 'wrap',
                }}
              >
                <motion.div
                  className="moc-feat-book-inset"
                  style={{ y: insetY }}
                >
                  <GoogleImage
                    src={insetImg}
                    width={480}
                    alt={currentProj.name}
                    loading="eager"
                    decoding="async"
                  />
                </motion.div>

                <div style={{ maxWidth: '240px' }}>
                  <p
                    style={{
                      fontSize: '13.5px',
                      lineHeight: 1.65,
                      color: 'rgba(255, 255, 255, 0.52)',
                      fontWeight: 300,
                      margin: '0 0 18px',
                    }}
                  >
                    Natural light, unscripted emotion, and architectural
                    composition preserved in every frame.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${currentProj.id}`)}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                      background: 'transparent',
                      color: '#ffffff',
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Open Full Monograph ↗
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chỉ báo 4 chương ở đáy trang trái */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{
                  flex: 1,
                  height: '1px',
                  background:
                    i <= activeIdx ? '#ffffff' : 'rgba(255, 255, 255, 0.16)',
                  transition: 'background 0.35s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Trang Phải: Ảnh Master Full-Height Lật Trang Theo Cuộn Dọc */}
        <div
          className="moc-feat-book-right"
          data-edit-project={currentProj?.id}
          data-edit-project-name={currentProj?.name}
          onClick={() =>
            currentProj && router.push(`/projects/${currentProj.id}`)
          }
        >
          {items.map((proj, idx) => {
            const masterUrl =
              proj.cover_image ||
              proj.images?.[0] ||
              FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
            return (
              <motion.div
                key={proj.id}
                className="moc-feat-wipe-layer"
                style={{
                  zIndex: idx + 1,
                  clipPath: rightClips[idx],
                }}
              >
                <GoogleImage
                  src={masterUrl}
                  width={1920}
                  alt={proj.name}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. CONTACT PARALLAX FOOTER (Powered by motion/react useScroll + useTransform)
   ============================================================================ */
function ContactRevealFooter({
  verticalVideoUrl,
  portraitImage,
  settings,
}: {
  verticalVideoUrl: string | null;
  portraitImage: string;
  settings?: SiteSettings;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
  });
  const yOffset = useTransform(smoothProgress, [0, 1], ['-65vh', '0vh']);

  return (
    <div ref={sectionRef} className="moc-footer-section">
      <motion.div
        className="moc-footer-parallax-inner"
        style={{ y: yOffset }}
      >
        {verticalVideoUrl ? (
          <video
            key={verticalVideoUrl}
            src={verticalVideoUrl}
            poster={portraitImage}
            className="moc-footer-portrait"
            data-edit="footer_video"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portraitImage}
            alt="MOC Nguyen Productions"
            className="moc-footer-portrait"
            data-edit="footer_image"
          />
        )}

        <div className="moc-footer-body">
          <div className="moc-footer-headline" data-edit="footer_headline">
            {settings?.footer_headline ||
              'Capturing timeless love stories through cinema and photography'}
          </div>

          <div className="moc-footer-details">
            <div className="moc-footer-mail-block">
              <div className="moc-footer-mail-label" data-edit="footer_mail_label">
                {settings?.footer_mail_label ||
                  'For inquiries & collaborations:'}
              </div>
              <Link href="/contact" className="moc-footer-mail-link" data-edit="footer_email">
                {settings?.footer_email || 'info@mocnguyenproductions.com'} →
              </Link>
            </div>

            <div className="moc-footer-socials">
              <CharStaggerLink text="(Gallery)" href="/studio" />
              <CharStaggerLink text="(About Us)" href="/about" />
              <CharStaggerLink text="(Contact Form)" href="/contact" />
              <CharStaggerLink
                text="(Facebook)"
                editKey="social_facebook"
                href={
                  settings?.social_facebook ||
                  'https://www.facebook.com/mocnguyen.productions'
                }
                external
              />
              <CharStaggerLink
                text="(Instagram)"
                editKey="social_instagram"
                href={
                  settings?.social_instagram ||
                  'https://www.instagram.com/mocnguyenproductions/'
                }
                external
              />
              <CharStaggerLink
                text="(YouTube)"
                editKey="social_youtube"
                href={
                  settings?.social_youtube ||
                  'https://www.youtube.com/@MocNguyenProductions'
                }
                external
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
