import { useEffect } from 'react';

/**
 * Tự cuộn trang lên/xuống khi người dùng không thao tác trong `idleMs`.
 * Dùng requestAnimationFrame (mượt, tự dừng khi tab ẩn) thay cho setInterval 30ms.
 */
export function useIdleAutoScroll(enabled: boolean, { idleMs = 3000, speed = 33 } = {}) {
  useEffect(() => {
    if (!enabled) return;

    let idle = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let frame = 0;
    let lastTime = 0;
    let position = window.scrollY;
    let direction: 1 | -1 = 1;

    const markActive = () => {
      idle = false;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idle = true;
        position = window.scrollY;
        lastTime = 0;
      }, idleMs);
    };

    const tick = (time: number) => {
      if (idle) {
        const dt = lastTime ? Math.min(time - lastTime, 100) : 0;
        lastTime = time;

        // Người dùng tự cuộn (VD: thanh cuộn) → đồng bộ lại vị trí
        if (Math.abs(window.scrollY - position) > 5) {
          position = window.scrollY;
          markActive();
        } else {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight - 10;
          if (position >= maxScroll) direction = -1;
          else if (position <= 10) direction = 1;

          position += (direction * speed * dt) / 1000;
          // 'instant': html có scroll-behavior: smooth, cuộn smooth mỗi frame sẽ bị giật
          window.scrollTo({ top: Math.round(position), behavior: 'instant' });
        }
      }
      frame = requestAnimationFrame(tick);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'] as const;
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    markActive();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, [enabled, idleMs, speed]);
}
