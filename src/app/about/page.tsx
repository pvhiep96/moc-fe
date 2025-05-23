'use client';

import Image from 'next/image';
import { useState } from 'react';
import MenuOverlay from '@/components/MenuOverlay';
import DynamicMenuButton from '@/components/DynamicMenuButton';
import DynamicLogo from '@/components/DynamicLogo';

export default function AboutPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-[#f7f7f7] min-h-screen text-black font-sans">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dynamic Menu Button with color changing based on background */}
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />


      {/* Header */}
      <div className="pt-8 md:pt-16 pb-4 md:pb-8 px-4 md:pl-[100px] flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-[30px]">
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight"
          style={{ fontFamily: "'Lexend Exa', sans-serif" }}
        >
          ABOUT US
        </h1>
        <div className="border-l border-black h-10 mx-4 hidden md:block" />
        <div>
          <div
            className="text-lg md:text-2xl font-medium uppercase tracking-wide"
            style={{ fontFamily: "'Lexend Exa', sans-serif" }}
          >
            HUSBAND AND WIFE<br />WEDDING DUO
          </div>
        </div>
      </div>

      {/* Nội dung chính với đường kẻ dọc bên trái */}
      <div className="relative max-w-[95%] md:max-w-[80%] mx-auto px-4 md:pl-[100px]">
        {/* Đường kẻ dọc bên trái */}
        <div className="absolute left-0 top-0 h-full border-l border-black hidden md:block" style={{ width: 1, minHeight: 600, zIndex: 0 }} />

        {/* Nội dung chính */}
        <div className="relative z-10 flex flex-col gap-8 md:gap-1" style={{ fontFamily: "'Amaranth', sans-serif" }}>
          {/* Moc */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-1">
            <div className="flex-1 order-2 md:order-1">
              <div className="text-sm/6 text-gray-800 mb-6 w-full md:w-[428px]" style={{lineHeight: '1.7'}}>
                Capturing love with soul, through the eyes of cinema and the heart of an artist.<br /><br />
                He is a film nerd and music lover at heart, and a storyteller who sees beauty in the details most people overlook. With a deep sensitivity to emotion naturally, he read the energy of a room easily, noticing the unspoken moments, the subtle shifts in mood, the quiet gestures that speak volumes.<br /><br />
                Maybe it's the perfectionist in him (yes, he's an OCD), but Moc believes every frame should be crafted not just to look beautiful, but to hold meaning.<br /><br />
                Moc is most drawn to the subtle moments: a soft touch, a teary smile, a shared glance. He has a deep respect for the trust couples place in him, and approaches each wedding with sensitivity, intention, and soul.
              </div>
            </div>
            <div className="flex flex-col items-center flex-shrink-0 order-1 md:order-2">
              <div className="w-full md:w-100 aspect-[4/5] relative mb-2">
                <Image
                  src="/about-moc.png"
                  alt="Moc - Co-Founder, Film Director"
                  fill
                  className="object-cover grayscale"
                  sizes="(max-width: 768px) 100vw, 70vw"
                />
              </div>
              <div className="text-xs text-center text-gray-500 mb-4">MOC • Co-Founder, Film Director</div>
            </div>
          </div>
          {/* Vy */}
          <div className="flex flex-col md:flex-row md:items-start md:h-[428px]">
            <div className="flex flex-col items-center flex-shrink-0 order-1 md:order-1 h-full flex flex-col justify-end">
              <div className="w-full md:w-100 aspect-[4/5] relative mb-2 flex justify-center items-center align-center">
                <Image
                  src="/about-vy.png"
                  alt="Vy - Co-Founder, Art Director"
                  fill
                  className="object-cover grayscale"
                  sizes="(max-width: 768px) 100vw, 424px"
                />
              </div>
              <div className="text-xs text-center text-gray-500 mt-1">VY • Co-Founder, Art Director</div>
            </div>
            <div className="flex-1 order-2 md:order-2 h-full flex flex-col justify-end items-end">
              <div className="text-sm/6 text-gray-800 text-right w-full md:w-[450px]" style={{lineHeight: '1.7'}}>
                As a mother, a woman rooted in family, and a lover of fashion and beauty, she understands how much this day means not only to the bride but to everyone who holds her close.<br /><br />
                With that understanding, her approach to weddings blends editorial elegance with heartfelt documentary. She pays attention to the little things that matter: the textures, the styling, the energy in the room, allowing each moment to unfold naturally while preserving its timeless charm.<br /><br />
                Whether your wedding is kissed by the golden glow sunset or wrapped in the moody romance reception, they are here to preserve not just how it looked, but how it felt.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote */}
      <div
        className="max-w-3xl mx-auto text-center text-lg md:text-xl mt-[40px] md:mt-[70px] py-4 md:py-8 px-4"
        style={{ fontFamily: "'Sorts Mill Goudy', serif" }}
      >
        "Two Hearts, One Vision — Capturing Love for Over a Decade"
      </div>

      {/* Awards */}
      <div className="pt-8 md:pt-16 pb-4 md:pb-8 px-4 md:pl-[100px]">
        <h1
          className="text-4xl md:text-5xl font-bold mb-6"
          style={{ fontFamily: "'Lexend Exa', sans-serif" }}
        >
          AWARDS
        </h1>
      </div>
      <div className="relative max-w-[95%] md:max-w-[80%] mx-auto px-4 md:pl-[100px]">
        {/* Đường kẻ dọc bên trái */}
        <div className="absolute left-0 top-0 h-full border-l border-black hidden md:block" style={{ width: 1, minHeight: 60, zIndex: 0 }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base" style={{ fontFamily: "'Amaranth', sans-serif" }}>
          <div>
            <div className="flex items-center gap-2 mb-2">🏆 WEVA 2017 Judges</div>
            <div className="flex items-center gap-2 mb-2">🏆 Junebug Weddings 2024 Choice Awards</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">🏆 Luxuo 2023's Best Wedding Videographer</div>
            <div className="flex items-center gap-2 mb-2">🏆 Vietnam Wedding Awards 2024's Cinematographer</div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <div className="pt-8 md:pt-16 pb-4 md:pb-8 px-4 md:pl-[100px]">
        <h2
          className="text-4xl md:text-5xl font-bold"
          style={{ fontFamily: "'Lexend Exa', sans-serif" }}
        >
          FEATURED
        </h2>
      </div>
      <div className="relative max-w-[95%] md:max-w-[80%] mx-auto px-4 md:pl-[100px]">
        {/* Đường kẻ dọc bên trái */}
        <div className="absolute left-0 top-0 h-full border-l border-black hidden md:block" style={{ width: 1, maxHeight: 90, zIndex: 0 }} />
        <div className="relative flex flex-col md:flex-row justify-between items-start min-h-[500px]" style={{minHeight: 500}}>
          {/* Ảnh vuông bên phải */}
          <div className="flex flex-col items-center md:items-end flex-1 mb-8 md:mb-0">
            <div className="flex justify-center items-start">
              <Image
                src="/featured2.png"
                alt="Featured 2"
                width={467}
                height={623}
                className="object-cover grayscale w-full md:w-[70%]"
              />
            </div>
          </div>
          {/* 4 chữ ở giữa */}
          <div className="relative md:absolute flex flex-col items-center z-10 mb-8 md:mb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-lg font-bold min-w-[280px] md:min-w-[420px]">
              <a
                href="https://luxuo.vn/wedding/vietnam-luxury-wedding-list-3-moc-nguyen-nhin-ra-the-gioi-de-biet-minh-dang-o-dau.html"
                className="underline hover:text-gray-600"
                style={{ fontFamily: "'Raleway', sans-serif" }}
              >
                Luxuo
              </a>
              <a
                href="https://www.wowweekend.vn/vi/blog/Moc-Nguyen-Khi-phim-cuoi-cung-la-tac-pham-nghe-thuat-2307?fbclid=IwY2xjawKbc7VleHRuA2FlbQIxMABicmlkETE5cGVtWmI3WjJXVnYxQzQ2AR6jgcSr9io39au6wAwE4niBoueXZ8FrnFg6Kzd631I4Rd_J31ATmTnurJCQ0g_aem_t3WjxFPp8KxV2eXGbtmpjg"
                className="underline hover:text-gray-600"
                style={{ fontFamily: "'Raleway', sans-serif" }}
              >
                Wow Weekend
              </a>
              <a
                href="https://www.lofficielvietnam.com/wedding-symphony/moc-nguyen-chung-ta-co-the-chieu-khach-hang-chieu-ca-cai-toi-cua-minh?fbclid=IwY2xjawKbc7RleHRuA2FlbQIxMABicmlkETE5cGVtWmI3WjJXVnYxQzQ2AR73A7XC-cCrGwYDfNvj1v6snHuguYx0M7-pBh_WUubb1c_sh-Ay8IdI4o3XZw_aem_ezvlEAYCS0DxaIsA19BFdw"
                className="underline hover:text-gray-600"
                style={{ fontFamily: "'Raleway', sans-serif" }}
              >
                Wedding Symphony
              </a>
              <a
                href="https://bazaarvietnam.vn/nhan-vat/hoang-nguyen-dien-anh-hoa-nhung-thuoc-phim-cho-ngay-chung-doi/?fbclid=IwY2xjawKbc7VleHRuA2FlbQIxMABicmlkETE5cGVtWmI3WjJXVnYxQzQ2AR6IIDNwoy50Hrk-DUT0dYfMZlOjrDlobGht3gIlhL-XWooxsVcUdZN8d_CbcQ_aem_dZaarDnn7iZ9m8ie9zsnfA"
                className="underline hover:text-gray-600"
                style={{ fontFamily: "'Raleway', sans-serif" }}
              >
                Harper Bazaar
              </a>
            </div>
          </div>
          {/* Ảnh ngang bên trái phía dưới */}
          <div className="relative md:absolute left-0 bottom-0 w-full md:w-1/2" style={{zIndex: 1}}>
            <div className="w-full aspect-video relative">
              <Image
                src="/featured1.png"
                alt="Featured 1"
                fill
                className="object-cover grayscale"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="w-full text-center text-[12px] py-4 md:py-8 mt-[40px] md:mt-[80px] font-bold"
        style={{ fontFamily: "'Lexend Exa', sans-serif" }}
      >
        FOLLOW US ON SOCIAL
        <div className="flex justify-center gap-4 mt-4">
          <a href="https://www.facebook.com/mocnguyen.productions" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            {/* Facebook SVG */}
            <svg width="24" height="24" fill="currentColor" className="text-black hover:text-blue-600 transition">
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.128 22 16.991 22 12"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/mocnguyenproductions/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            {/* Instagram SVG */}
            <svg width="24" height="24" fill="currentColor" className="text-black hover:text-pink-500 transition">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zm5.25.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}