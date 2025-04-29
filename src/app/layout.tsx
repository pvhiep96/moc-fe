import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const monCheri = localFont({
  src: '../../public/DFVN TAN - MON CHERI.ttf',
  variable: '--font-mon-cheri'
});

export const metadata: Metadata = {
  title: "MOC Productions - Photography & Videography Studio",
  description: "MOC Productions is a creative studio specializing in photography and videography for weddings, events, and commercial projects.",
  keywords: "photography, videography, wedding, events, commercial, studio, MOC Productions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
