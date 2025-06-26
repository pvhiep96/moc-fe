'use client';

import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface PlyrVideoPlayerProps {
  videoId: string;
  playing?: boolean;
  muted?: boolean;
  onReady?: (player: Plyr) => void;
  className?: string;
}

const PlyrVideoPlayer = ({
  videoId,
  playing = false,
  muted = true,
  onReady,
  className = ''
}: PlyrVideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Destroy existing player if it exists
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    const player = new Plyr(videoRef.current.querySelector('.js-plyr-youtube') as HTMLElement, {
      controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      clickToPlay: true,
      keyboard: { focused: false, global: false },
      tooltips: { controls: true, seek: true },
      captions: { active: false, update: false },
      fullscreen: { enabled: true },
      // Không sử dụng muted ở đây vì nó không hoạt động đúng với YouTube
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        disablekb: 1,
        controls: 0,
        autoplay: playing ? 1 : 0,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        mute: muted ? 1 : 0
      }
    });

    // Save player reference
    playerRef.current = player;

    // Call onReady callback if provided and handle initial state
    player.on('ready', () => {
      // Set initial muted state
      try {
        player.muted = muted;
      } catch (e) {
        // console.warn('Could not set initial muted state:', e);
      }

      // Play if needed
      if (playing) {
        try {
          player.play();
        } catch (e) {
          // console.warn('Could not autoplay:', e);
        }
      }

      // Call onReady callback
      if (onReady && playerRef.current) {
        onReady(playerRef.current);
      }
    });

    // Xử lý sự kiện khi video kết thúc
    player.on('ended', () => {
      // Quay về đầu video
      try {
        player.restart();
      } catch (e) {
        // Fallback nếu restart không hoạt động
        try {
          player.currentTime = 0;
          player.play();
        } catch (fallbackError) {
          // console.warn('Could not restart video:', fallbackError);
        }
      }
    });

    // Clean up
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onReady]);

  // Handle playing state changes
  useEffect(() => {
    if (!playerRef.current) return;

    if (playing) {
      try {
        playerRef.current.play();
      } catch (error) {
        // console.error('Error playing video:', error);
      }
    } else {
      playerRef.current.pause();
    }
  }, [playing]);

  // Handle muted state changes
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      // Plyr sử dụng thuộc tính muted thay vì phương thức mute/unmute
      playerRef.current.muted = muted;
    } catch (error) {
      // console.error('Error changing mute state:', error);

      // Fallback: Thử cách khác nếu cách trên không hoạt động
      try {
        const iframe = playerRef?.current?.elements?.container?.querySelector('iframe');
        if (iframe) {
          // Thêm tham số mute vào URL của iframe
          let src = iframe.src;
          src = src.replace(/([?&])mute=[01]/, `$1mute=${muted ? 1 : 0}`);
          if (!src.includes('mute=')) {
            src += `&mute=${muted ? 1 : 0}`;
          }
          iframe.src = src;
        }
      } catch (fallbackError) {
        console.error('Fallback for mute also failed:', fallbackError);
      }
    }
  }, [muted]);

  return (
    <div ref={videoRef} className={`plyr-container ${className}`}>
      <div className="js-plyr-youtube plyr__video-embed">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?origin=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.origin : ''
          )}&amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1&amp;mute=${
            muted ? 1 : 0
          }&amp;autoplay=${playing ? 1 : 0}`}
          allowFullScreen
          allow="autoplay"
          title="YouTube Video Player"
        ></iframe>
      </div>
    </div>
  );
};

export default PlyrVideoPlayer;
