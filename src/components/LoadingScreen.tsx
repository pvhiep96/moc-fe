'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  onComplete?: () => void;
  initialProgress?: number;
}

// Tiến độ giả lập: tăng nhanh lúc đầu, chậm dần và dừng ở 95% cho tới khi
// component bị unmount (dữ liệu đã tải xong). Nếu có onComplete thì chạy tới 100%.
function nextProgress(current: number, toEnd: boolean): number {
  const max = toEnd ? 100 : 95;
  let increment;
  if (current < 30) increment = 1.5;
  else if (current < 50) increment = 0.5;
  else if (current < 80) increment = 0.3;
  else increment = 0.8;
  return Math.min(current + increment, max);
}

export default function LoadingScreen({ onComplete, initialProgress = 0 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    const toEnd = Boolean(onComplete);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = nextProgress(prev, toEnd);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  let loadingText = 'Initializing...';
  if (progress >= 95) loadingText = 'Ready!';
  else if (progress >= 80) loadingText = 'Preparing application...';
  else if (progress >= 60) loadingText = 'Loading data...';
  else if (progress >= 30) loadingText = 'Connecting to API...';

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center justify-center max-w-lg px-4">
        <div className="mb-20 loading-animation">
          <Image
            src="/moc-logo.webp"
            unoptimized
            alt="MOC Production Logo"
            width={600}
            height={316}
            priority
            className="w-auto h-auto"
          />
          <p className="text-center text-xl mt-4 font-light tracking-widest">STUDIO</p>
        </div>

        <div className="w-full h-px bg-gray-200 relative">
          <div
            className="absolute top-0 left-0 h-px bg-black transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex justify-between w-full">
          <span className="text-lg font-medium">{Math.round(progress)}%</span>
          <span className="text-sm text-gray-500">{loadingText}</span>
        </div>
      </div>
    </div>
  );
}
