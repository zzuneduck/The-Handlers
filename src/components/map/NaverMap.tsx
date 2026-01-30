/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';

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

const SCRIPT_ID = 'naver-map-sdk';

function loadNaverMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }

    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      reject(new Error('VITE_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.'));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
}

export default function NaverMap({
  lat = 37.5665,
  lng = 126.978,
  markers = [],
  height = '400px',
  onMarkerClick,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstances = useRef<any[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스크립트 로드
  useEffect(() => {
    loadNaverMapScript()
      .then(() => setScriptLoaded(true))
      .catch((err) => setError(err.message));
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !window.naver?.maps) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(lat, lng),
      zoom: 14,
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
    });

    mapInstance.current = map;

    return () => {
      markerInstances.current.forEach((m) => m.setMap(null));
      markerInstances.current = [];
    };
  }, [scriptLoaded]);

  // 마커 업데이트
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.naver?.maps) return;

    // 기존 마커 제거
    markerInstances.current.forEach((m) => m.setMap(null));
    markerInstances.current = [];

    if (markers.length === 0) return;

    let activeInfoWindow: any = null;

    markers.forEach((mk) => {
      const pos = new window.naver.maps.LatLng(mk.lat, mk.lng);
      const marker = new window.naver.maps.Marker({
        position: pos,
        map,
        title: mk.title,
      });

      const infoContent = mk.info
        ? `<div style="padding:10px;min-width:150px;font-size:13px;line-height:1.5"><strong>${mk.title}</strong><br/>${mk.info}</div>`
        : `<div style="padding:8px 12px;font-size:13px;font-weight:600">${mk.title}</div>`;

      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoContent,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
        anchorSize: { width: 10, height: 10 },
        anchorColor: '#fff',
      });

      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (activeInfoWindow) activeInfoWindow.close();
        infoWindow.open(map, marker);
        activeInfoWindow = infoWindow;
        onMarkerClick?.(mk);
      });

      markerInstances.current.push(marker);
    });

    // 모든 마커가 보이도록 중심 조정
    if (markers.length === 1) {
      map.setCenter(new window.naver.maps.LatLng(markers[0].lat, markers[0].lng));
      map.setZoom(15);
    } else if (markers.length > 1) {
      // 마커 중심점 계산
      const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
      map.setCenter(new window.naver.maps.LatLng(avgLat, avgLng));
      map.setZoom(12);
    }
  }, [markers, onMarkerClick]);

  // 중심 좌표 변경
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.naver?.maps) return;
    if (markers.length > 0) return; // 마커가 있으면 마커 기준으로 처리
    map.panTo(new window.naver.maps.LatLng(lat, lng));
  }, [lat, lng, markers]);

  if (error) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
      >
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-xl border border-gray-200"
    />
  );
}
