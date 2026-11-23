'use client';

/**
 * Nội dung website (chữ / link / ảnh) do admin quản lý + "chế độ sửa".
 *
 * Chế độ sửa chỉ bật khi trang được mở BÊN TRONG iframe của admin với ?moc_edit=1.
 * Khi đó:
 *  - Mọi phần tử có data-edit="<key>" được viền xanh; click → báo admin mở đúng ô nhập.
 *  - Phần tử có data-edit-project="<id>" → báo admin mở dự án đó.
 *  - Admin gửi giá trị đang gõ (chưa lưu) sang để xem trước ngay.
 * Người xem bình thường không bị ảnh hưởng gì.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import DEFAULTS from './site-content-defaults.json';

export type ContentValues = Record<string, unknown>;

type Ctx = {
  values: ContentValues;
  editMode: boolean;
};

const SiteContentContext = createContext<Ctx>({ values: DEFAULTS as ContentValues, editMode: false });

const ADMIN_ORIGINS = (process.env.NEXT_PUBLIC_ADMIN_ORIGINS || 'http://localhost:3006')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const EDIT_FLAG = 'moc_edit';

function isAllowedOrigin(origin: string) {
  return origin === window.location.origin || ADMIN_ORIGINS.includes(origin);
}

function postToAdmin(message: Record<string, unknown>) {
  const payload = { source: 'moc-site', ...message };
  const targets = new Set([...ADMIN_ORIGINS, window.location.origin]);
  targets.forEach((origin) => {
    try {
      window.parent.postMessage(payload, origin);
    } catch {
      /* origin không khớp → trình duyệt tự bỏ qua */
    }
  });
}

export function SiteContentProvider({
  initialValues,
  children,
}: {
  initialValues: ContentValues | null;
  children: React.ReactNode;
}) {
  const [values, setValues] = useState<ContentValues>(() => ({
    ...(DEFAULTS as ContentValues),
    ...(initialValues || {}),
  }));
  const [editMode, setEditMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (window.parent === window) return;
    let flagged = new URLSearchParams(window.location.search).has(EDIT_FLAG);
    try {
      if (flagged) sessionStorage.setItem(EDIT_FLAG, '1');
      else flagged = sessionStorage.getItem(EDIT_FLAG) === '1';
    } catch {
      /* sessionStorage bị chặn — chỉ dựa vào query */
    }
    if (flagged) setEditMode(true);
  }, []);

  useEffect(() => {
    if (editMode) postToAdmin({ type: 'route', path: pathname });
  }, [editMode, pathname]);

  const ctx = useMemo(() => ({ values, editMode }), [values, editMode]);

  return (
    <SiteContentContext.Provider value={ctx}>
      {children}
      {editMode && <EditBridge onValues={(v) => setValues((prev) => ({ ...prev, ...v }))} />}
    </SiteContentContext.Provider>
  );
}

/* ------------------------------------------------------------------------ */
/* Hook dùng trong component                                                 */
/* ------------------------------------------------------------------------ */
export function useSiteContent() {
  const { values, editMode } = useContext(SiteContentContext);

  const t = useCallback(
    (key: string): string => {
      const v = values[key];
      if (typeof v === 'string' && v !== '') return v;
      const d = (DEFAULTS as ContentValues)[key];
      return typeof d === 'string' ? d : '';
    },
    [values]
  );

  const lines = useCallback(
    (key: string): string[] => {
      const v = values[key];
      return Array.isArray(v) ? (v as string[]) : [];
    },
    [values]
  );

  const list = useCallback(
    <T,>(key: string): T[] => {
      const v = values[key];
      return Array.isArray(v) ? (v as T[]) : [];
    },
    [values]
  );

  /** Gắn vào phần tử để admin biết phần tử này do ô nhập nào điều khiển */
  const e = useCallback((key: string) => ({ 'data-edit': key }), []);

  return { values, editMode, t, lines, list, e };
}

/** Hiển thị chữ nhiều dòng: dòng trống = tách đoạn, xuống dòng = <br/> */
export function MultilineText({ text, paragraphGap = true }: { text: string; paragraphGap?: boolean }) {
  const paragraphs = text.split(/\n\s*\n/);
  return (
    <>
      {paragraphs.map((para, pi) => (
        <span key={pi}>
          {pi > 0 && paragraphGap && (
            <>
              <br />
              <br />
            </>
          )}
          {para.split('\n').map((line, li) => (
            <span key={li}>
              {li > 0 && <br />}
              {line}
            </span>
          ))}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Cầu nối với admin (chỉ chạy trong chế độ sửa)                             */
/* ------------------------------------------------------------------------ */
function EditBridge({ onValues }: { onValues: (v: ContentValues) => void }) {
  const [outline, setOutline] = useState(true);
  const labelsRef = useRef<Record<string, string>>({});
  const tipRef = useRef<HTMLDivElement>(null);
  const onValuesRef = useRef(onValues);
  onValuesRef.current = onValues;

  useEffect(() => {
    document.documentElement.toggleAttribute('data-moc-edit', outline);
    return () => document.documentElement.removeAttribute('data-moc-edit');
  }, [outline]);

  useEffect(() => {
    const locate = (key: string, retried = false) => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-edit="${CSS.escape(key)}"]`));
      const visible = candidates.find((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && style.visibility !== 'hidden';
      });
      if (!visible) {
        // Mục nằm trong menu đang đóng → mở menu rồi thử lại
        const toggle = document.querySelector<HTMLElement>('[data-moc-menu-toggle]');
        if (!retried && toggle && candidates.length > 0) {
          toggle.click();
          window.setTimeout(() => locate(key, true), 550);
          return;
        }
        postToAdmin({ type: 'missing', key });
        return;
      }
      visible.scrollIntoView({ behavior: 'smooth', block: 'center' });
      visible.classList.remove('moc-edit-flash');
      void visible.offsetWidth;
      visible.classList.add('moc-edit-flash');
      window.setTimeout(() => visible.classList.remove('moc-edit-flash'), 2400);
    };

    const onMessage = (ev: MessageEvent) => {
      if (!isAllowedOrigin(ev.origin)) return;
      const data = ev.data as { source?: string; type?: string; [k: string]: unknown };
      if (!data || data.source !== 'moc-admin') return;
      if (data.type === 'values' && data.values) onValuesRef.current(data.values as ContentValues);
      if (data.type === 'labels' && data.labels) labelsRef.current = data.labels as Record<string, string>;
      if (data.type === 'outline') setOutline(Boolean(data.enabled));
      if (data.type === 'locate' && typeof data.key === 'string') locate(data.key);
    };

    const findTarget = (node: EventTarget | null) => {
      const el = node instanceof Element ? node : null;
      return el?.closest<HTMLElement>('[data-edit], [data-edit-project]') || null;
    };

    const onClick = (ev: MouseEvent) => {
      if (!document.documentElement.hasAttribute('data-moc-edit')) return;
      const target = findTarget(ev.target);
      if (!target) return;
      ev.preventDefault();
      ev.stopPropagation();
      const key = target.getAttribute('data-edit');
      if (key) postToAdmin({ type: 'select', key });
      else postToAdmin({ type: 'select-project', id: Number(target.getAttribute('data-edit-project')) });
    };

    const onOver = (ev: MouseEvent) => {
      const tip = tipRef.current;
      if (!tip) return;
      const target = document.documentElement.hasAttribute('data-moc-edit') ? findTarget(ev.target) : null;
      if (!target) {
        tip.style.opacity = '0';
        return;
      }
      const key = target.getAttribute('data-edit');
      tip.textContent = key
        ? `✎ ${labelsRef.current[key] || key}`
        : `✎ Dự án: ${target.getAttribute('data-edit-project-name') || '#' + target.getAttribute('data-edit-project')}`;
      const r = target.getBoundingClientRect();
      tip.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - 260))}px`;
      tip.style.top = `${r.top > 30 ? r.top - 26 : r.bottom + 4}px`;
      tip.style.opacity = '1';
    };

    window.addEventListener('message', onMessage);
    document.addEventListener('click', onClick, true);
    document.addEventListener('mouseover', onOver, true);
    postToAdmin({ type: 'ready', path: window.location.pathname });

    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('mouseover', onOver, true);
    };
  }, []);

  return (
    <>
      <style>{`
        html[data-moc-edit] [data-edit],
        html[data-moc-edit] [data-edit-project] {
          outline: 1px dashed rgba(37, 99, 235, 0.65) !important;
          outline-offset: 2px;
          cursor: pointer !important;
        }
        html[data-moc-edit] [data-edit]:hover,
        html[data-moc-edit] [data-edit-project]:hover {
          outline: 2px solid #2563eb !important;
          background-color: rgba(37, 99, 235, 0.08);
        }
        .moc-edit-flash {
          animation: moc-edit-flash 0.8s ease-in-out 3;
          outline: 3px solid #f59e0b !important;
          outline-offset: 3px;
        }
        @keyframes moc-edit-flash {
          50% { outline-color: rgba(245, 158, 11, 0.15); }
        }
      `}</style>
      <div
        ref={tipRef}
        style={{
          position: 'fixed',
          zIndex: 2147483647,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity .12s',
          background: '#2563eb',
          color: '#fff',
          font: '600 12px/1.2 system-ui, sans-serif',
          padding: '5px 8px',
          borderRadius: 6,
          maxWidth: 260,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: '0 4px 14px rgba(0,0,0,.25)',
        }}
      />
    </>
  );
}
