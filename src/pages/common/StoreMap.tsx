import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadNaverMapScript, initNaverMap, createMarker, createInfoWindow } from '../../lib/naverMap';

interface StoreRow {
  id: string;
  store_name: string;
  region: string;
  sub_region: string | null;
  handler_name: string;
  lat: number;
  lng: number;
}

export default function StoreMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeCount, setStoreCount] = useState(0);

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

      // 3. 매장 데이터 조회
      const { data, error: dbError } = await supabase
        .from('stores')
        .select('id, store_name, region, sub_region, handler_name, lat, lng')
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (dbError) {
        console.error('[StoreMap]', dbError.message);
      }

      const stores = (data as StoreRow[]) ?? [];
      if (cancelled) return;

      setStoreCount(stores.length);
      setLoading(false);

      // 4. 마커 + 인포윈도우
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let openInfoWindow: any = null;

      stores.forEach((s) => {
        const marker = createMarker(map, s.lat, s.lng, {
          title: s.store_name,
        });

        const infoWindow = createInfoWindow(`
          <div style="padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.12);min-width:180px;">
            <p style="font-weight:700;font-size:14px;color:#111;margin:0;">${s.store_name}</p>
            <p style="font-size:12px;color:#666;margin:4px 0 0;">
              ${s.region}${s.sub_region ? ` ${s.sub_region}` : ''}
            </p>
            <p style="font-size:12px;color:#03C75A;margin:4px 0 0;font-weight:600;">
              ${s.handler_name}
            </p>
          </div>
        `);

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (openInfoWindow) openInfoWindow.close();
          infoWindow.open(map, marker);
          openInfoWindow = infoWindow;
        });
      });

      // 지도 클릭 시 인포윈도우 닫기
      window.naver.maps.Event.addListener(map, 'click', () => {
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
        <h2 className="text-sm font-bold text-gray-900">매장 지도</h2>
        <p className="text-xs text-gray-500">
          {loading ? '로딩 중...' : `${storeCount}개 매장`}
        </p>
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
