import { useEffect, useState } from 'react';
import type { ToastItem } from '../../contexts/ToastContext';

const STYLE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-[#e6f9ef]', border: 'border-[#03C75A]', text: 'text-[#03C75A]', icon: '✓' },
  error:   { bg: 'bg-red-50',    border: 'border-red-400',    text: 'text-red-600',    icon: '✕' },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'text-blue-600',   icon: 'ℹ' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', icon: '!' },
};

function ToastSingle({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 직후 슬라이드 인
    requestAnimationFrame(() => setVisible(true));
    // 사라지기 전 슬라이드 아웃
    const timer = setTimeout(() => setVisible(false), 2700);
    return () => clearTimeout(timer);
  }, []);

  const s = STYLE[toast.type] ?? STYLE.info;

  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-xl border ${s.border} ${s.bg} p-4 shadow-lg transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.text} bg-white text-sm font-bold shadow-sm`}>
        {s.icon}
      </span>
      <p className={`flex-1 text-sm font-medium ${s.text}`}>{toast.message}</p>
      <button onClick={onRemove} className={`shrink-0 ${s.text} opacity-50 hover:opacity-100`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastSingle key={t.id} toast={t} onRemove={() => onRemove(t.id)} />
      ))}
    </div>
  );
}
