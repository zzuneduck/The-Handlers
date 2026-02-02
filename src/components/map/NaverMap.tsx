/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { loadNaverMapScript } from '../../lib/naverMap';

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  info?: string;
}

interface NaverMapProps {
  lat?: number;
  lng?: number;
  markers?: MapMarker[];
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

// 스크립트 로드 상태를 전역으로 관리
let scriptReady = !!window.naver?.maps;
let scriptError = '';
const waiters: (() => void)[] = [];

if (!scriptReady && !scriptError) {
  loadNaverMapScript()
    .then(() => {
      scriptReady = true;
      waiters.forEach((fn) => fn());
      waiters.length = 0;
    })
    .catch((e) => {
      scriptError = e.message;
      waiters.forEach((fn) => fn());
      waiters.length = 0;
    });
}

export default function NaverMap({
  lat = 37.5665,
  lng = 126.978,
  markers,
  height = '400px',
  onMarkerClick,
}: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const onClickRef = useRef(onMarkerClick);
  const prevMarkersJson = useRef('');
  const [error, setError] = useState('');

  // onMarkerClick 최신 참조 유지
  onClickRef.current = onMarkerClick;

  // 지도 생성 + 언마운트 정리 (한 번만 실행)
  useEffect(() => {
    let destroyed = false;

    function init() {
      if (destroyed || !containerRef.current) return;
      if (scriptError) { setError(scriptError); return; }

      try {
        if (!window.naver?.maps) {
          setError('지도를 불러올 수 없습니다');
          return;
        }
        mapRef.current = new window.naver.maps.Map(containerRef.current, {
          center: new window.naver.maps.LatLng(lat, lng),
          zoom: 14,
          zoomControl: true,
          zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
        });
      } catch (e: any) {
        setError('지도를 불러올 수 없습니다');
      }
    }

    if (scriptReady) {
      init();
    } else {
      waiters.push(init);
    }

    // 언마운트 시에만 정리
    return () => {
      destroyed = true;
      // waiters에서 제거 (스크립트 로드 전 언마운트 시 메모리 누수 방지)
      const idx = waiters.indexOf(init);
      if (idx !== -1) waiters.splice(idx, 1);

      markerRefs.current.forEach((m) => { try { m.setMap(null); } catch { /* */ } });
      markerRefs.current = [];
      if (mapRef.current) {
        try { mapRef.current.destroy(); } catch { /* */ }
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열: 마운트 시 한 번만

  // 마커 동기화 (마커 데이터가 실제로 변경될 때만)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    const list = markers ?? [];
    const json = JSON.stringify(list);
    if (json === prevMarkersJson.current) return;
    prevMarkersJson.current = json;

    // 기존 마커 제거
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = [];

    if (list.length === 0) return;

    try {
      let openIW: any = null;

      list.forEach((mk) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(mk.lat, mk.lng),
          map,
          title: mk.title,
        });

        const iw = new window.naver.maps.InfoWindow({
          content: mk.info
            ? `<div style="padding:10px;min-width:150px;font-size:13px;line-height:1.5"><strong>${mk.title}</strong><br/>${mk.info}</div>`
            : `<div style="padding:8px 12px;font-size:13px;font-weight:600">${mk.title}</div>`,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          backgroundColor: '#fff',
          anchorSize: { width: 10, height: 10 },
          anchorColor: '#fff',
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (openIW) openIW.close();
          iw.open(map, marker);
          openIW = iw;
          onClickRef.current?.(mk);
        });

        markerRefs.current.push(marker);
      });

      // 중심 조정
      if (list.length === 1) {
        map.setCenter(new window.naver.maps.LatLng(list[0].lat, list[0].lng));
      } else {
        const aLat = list.reduce((s, m) => s + m.lat, 0) / list.length;
        const aLng = list.reduce((s, m) => s + m.lng, 0) / list.length;
        map.setCenter(new window.naver.maps.LatLng(aLat, aLng));
        map.setZoom(12);
      }
    } catch {
      // 마커 생성 실패해도 지도는 유지
    }
  }, [markers]);

  // 마커 없을 때 중심 이동
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps || (markers && markers.length > 0)) return;
    try { map.panTo(new window.naver.maps.LatLng(lat, lng)); } catch { /* ignore */ }
  }, [lat, lng, markers]);

  if (error || scriptError) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">지도를 불러올 수 없습니다</p>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, minHeight: height }} className="w-full rounded-xl border border-gray-200" />;
}
