/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    naver: any;
  }
}

const CLIENT_ID = '8lpmebmhtq';
let loadPromise: Promise<void> | null = null;

/**
 * 네이버 지도 API 스크립트 로드
 */
export function loadNaverMapScript(): Promise<void> {
  if (window.naver?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${CLIENT_ID}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('네이버 지도 스크립트 로드 실패'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * 지도 초기화
 */
export function initNaverMap(
  element: HTMLElement,
  options?: { center?: { lat: number; lng: number }; zoom?: number },
): any {
  const maps = window.naver.maps;
  const center = options?.center ?? { lat: 37.5665, lng: 126.978 };
  const zoom = options?.zoom ?? 12;

  return new maps.Map(element, {
    center: new maps.LatLng(center.lat, center.lng),
    zoom,
    zoomControl: true,
    zoomControlOptions: { position: maps.Position.TOP_RIGHT },
  });
}

/**
 * 마커 생성
 */
export function createMarker(
  map: any,
  lat: number,
  lng: number,
  options?: { title?: string; icon?: { content: string; anchor?: any } },
): any {
  const maps = window.naver.maps;
  return new maps.Marker({
    map,
    position: new maps.LatLng(lat, lng),
    title: options?.title,
    icon: options?.icon,
  });
}

/**
 * 인포윈도우 생성
 */
export function createInfoWindow(content: string): any {
  const maps = window.naver.maps;
  return new maps.InfoWindow({
    content,
    borderWidth: 0,
    backgroundColor: 'transparent',
    disableAnchor: true,
    pixelOffset: new maps.Point(0, -8),
  });
}
