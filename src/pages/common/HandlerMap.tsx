import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadNaverMapScript, initNaverMap, createMarker, createInfoWindow } from '../../lib/naverMap';
import { HANDLER_LEVELS } from '../../constants/levels';
import type { HandlerLevelKey } from '../../constants/levels';

interface HandlerRow {
  id: string;
  name: string;
  handler_level: HandlerLevelKey;
  region: string | null;
  lat: number;
  lng: number;
}

function getMarkerColor(level: number): string {
  if (level >= 6) return '#FFD700'; // 금색
  if (level >= 4) return '#03C75A'; // 초록
  return '#4A90D9'; // 파랑
}

function getMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13" r="6" fill="#fff"/>
    </svg>
  `;
}

export default function HandlerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [handlerCount, setHandlerCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 1. 네이버 지도 스크립트 로드
      try {
        await loadNaverMapScript();
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
        return;
      }

      if (cancelled || !mapRef.current) return;

      // 2. 지도 초기화
      const map = initNaverMap(mapRef.current, {
        center: { lat: 37.5665, lng: 126.978 },
        zoom: 11,
      });

      // 3. 핸들러 데이터 조회
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, name, handler_level, region, lat, lng')
        .eq('role', 'handler')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (dbError) {
        console.error('[HandlerMap]', dbError.message);
      }

      const handlers = (data as HandlerRow[]) ?? [];
      if (cancelled) return;

      setHandlerCount(handlers.length);
      setLoading(false);

      // 4. 마커 + 인포윈도우
      let openInfoWindow: naver.maps.InfoWindow | null = null;

      handlers.forEach((h) => {
        const level = h.handler_level ?? 1;
        const color = getMarkerColor(level);
        const levelInfo = HANDLER_LEVELS[level as HandlerLevelKey] ?? HANDLER_LEVELS[1];

        const marker = createMarker(map, h.lat, h.lng, {
          title: h.name,
          icon: {
            content: getMarkerSvg(color),
            anchor: new naver.maps.Point(14, 36),
          },
        });

        const infoWindow = createInfoWindow(`
          <div style="padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.12);min-width:160px;">
            <p style="font-weight:700;font-size:14px;color:#111;margin:0;">${h.name}</p>
            <p style="font-size:12px;color:#666;margin:4px 0 0;">
              ${levelInfo.icon} Lv.${level} ${levelInfo.name}
            </p>
            ${h.region ? `<p style="font-size:12px;color:#999;margin:2px 0 0;">${h.region}</p>` : ''}
          </div>
        `);

        naver.maps.Event.addListener(marker, 'click', () => {
          if (openInfoWindow) openInfoWindow.close();
          infoWindow.open(map, marker);
          openInfoWindow = infoWindow;
        });
      });

      // 지도 클릭 시 인포윈도우 닫기
      naver.maps.Event.addListener(map, 'click', () => {
        if (openInfoWindow) {
          openInfoWindow.close();
          openInfoWindow = null;
        }
      });
    }

    init();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">지도를 표시할 수 없습니다</p>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <p className="mt-1 text-xs text-gray-400">
            .env 파일에 VITE_NAVER_MAP_CLIENT_ID를 설정해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative -m-6">
      {/* 헤더 오버레이 */}
      <div className="absolute left-4 top-4 z-10 rounded-xl bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur">
        <h2 className="text-sm font-bold text-gray-900">핸들러 지도</h2>
        <p className="text-xs text-gray-500">
          {loading ? '로딩 중...' : `${handlerCount}명 핸들러`}
        </p>
      </div>

      {/* 범례 */}
      <div className="absolute right-4 top-4 z-10 rounded-xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">레벨</p>
        <div className="mt-1.5 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block h-3 w-3 rounded-full bg-[#4A90D9]" />
            Lv.1-3
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block h-3 w-3 rounded-full bg-[#03C75A]" />
            Lv.4-5
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block h-3 w-3 rounded-full bg-[#FFD700]" />
            Lv.6-7
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div
        ref={mapRef}
        className="h-[calc(100vh-4rem)] w-full"
      />

      {/* 로딩 스피너 */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
        </div>
      )}
    </div>
  );
}
