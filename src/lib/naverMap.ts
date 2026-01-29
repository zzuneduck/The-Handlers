declare global {
  interface Window {
    naver: typeof naver;
  }
}

let loadPromise: Promise<void> | null = null;

/**
 * 네이버 지도 API 스크립트를 동적으로 로드합니다.
 * 이미 로드됐으면 즉시 resolve합니다.
 */
export function loadNaverMapScript(): Promise<void> {
  if (window.naver?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
  if (!clientId) {
    return Promise.reject(new Error('VITE_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다.'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

interface MapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
}

/**
 * 지도를 초기화하고 naver.maps.Map 인스턴스를 반환합니다.
 */
export function initNaverMap(
  element: HTMLElement,
  options?: MapOptions,
): naver.maps.Map {
  const center = options?.center ?? { lat: 37.5665, lng: 126.978 };
  const zoom = options?.zoom ?? 12;

  return new naver.maps.Map(element, {
    center: new naver.maps.LatLng(center.lat, center.lng),
    zoom,
    zoomControl: true,
    zoomControlOptions: {
      position: naver.maps.Position.TOP_RIGHT,
    },
  });
}

/**
 * 마커를 생성합니다.
 */
export function createMarker(
  map: naver.maps.Map,
  lat: number,
  lng: number,
  options?: {
    title?: string;
    icon?: {
      content: string;
      anchor?: naver.maps.Point;
    };
  },
): naver.maps.Marker {
  return new naver.maps.Marker({
    map,
    position: new naver.maps.LatLng(lat, lng),
    title: options?.title,
    icon: options?.icon,
  });
}

/**
 * 인포윈도우를 생성합니다.
 */
export function createInfoWindow(content: string): naver.maps.InfoWindow {
  return new naver.maps.InfoWindow({
    content,
    borderWidth: 0,
    backgroundColor: 'transparent',
    disableAnchor: true,
    pixelOffset: new naver.maps.Point(0, -8),
  });
}
