import { useState, useRef, useEffect } from 'react';
import { useSoundManager } from '../../hooks/useSound';

export default function SoundToggle() {
  const { muted, volume, toggleMute, setVolume, playSound } = useSoundManager();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 패널 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-40">
      {/* 볼륨 슬라이더 패널 */}
      {open && !muted && (
        <div className="mb-3 w-48 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-600 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>볼륨</span>
            <span>{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            onMouseUp={() => playSound('click')}
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-[#03C75A] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#03C75A] [&::-webkit-slider-thumb]:shadow-md"
          />
        </div>
      )}

      {/* 토글 버튼 */}
      <div className="flex items-center gap-2">
        {!muted && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-xs shadow-lg transition-all hover:scale-110 active:scale-95 dark:border-gray-600 dark:bg-gray-800"
            title="볼륨 조절"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        )}
        <button
          onClick={toggleMute}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-lg shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95 dark:border-gray-600 dark:bg-gray-800"
          title={muted ? '사운드 켜기' : '사운드 끄기'}
        >
          {muted ? (
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-[#03C75A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
