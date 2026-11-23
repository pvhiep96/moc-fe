import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { SiteContentProvider } from "@/content/SiteContentProvider";
import { fetchSiteContent } from "@/services/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  preload: false,
  subsets: ["latin"],
});

// Không preload: font 240KB này chưa được dùng ở trang nào (class font-mon-cheri chưa được áp dụng)
const monCheri = localFont({
  src: '../../public/DFVN TAN - MON CHERI.ttf',
  variable: '--font-mon-cheri',
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "MOC Productions - Photography & Videography Studio",
    template: "%s | MOC Productions"
  },
  description: "MOC Productions is a creative studio specializing in photography and videography for weddings, events, and commercial projects.",
  keywords: "photography, videography, wedding, events, commercial, studio, MOC Productions",
  creator: "MOC Productions",
  publisher: "MOC Productions",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await fetchSiteContent();
  return (
    <html lang="en">
      <head>
        {/* Ảnh project nằm trên Google CDN: mở kết nối sớm để giảm thời gian tải ảnh đầu tiên */}
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteContentProvider initialValues={siteContent}>{children}</SiteContentProvider>
      </body>
    </html>
  );
}
