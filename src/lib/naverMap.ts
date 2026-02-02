/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    naver: any;
  }
}

let loadPromise: Promise<void> | null = null;

function nv(): any {
  return window.naver;
}

/**
 * 네이버 지도 API 스크립트를 동적으로 로드합니다.
 * 이미 로드됐으면 즉시 resolve합니다.
 */
export function loadNaverMapScript(): Promise<void> {
  if (window.naver?.maps) {
    console.log('[NaverMap] 이미 로드됨');
    return Promise.resolve();
  }
  if (loadPromise) {
    console.log('[NaverMap] 로드 진행 중 (기존 promise 반환)');
    return loadPromise;
  }

  const clientId = 'm7a40tylj4';

  const scriptUrl = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
  console.log('[NaverMap] 스크립트 로드 시작:', scriptUrl);

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => {
      console.log('[NaverMap] 스크립트 로드 완료. naver.maps 존재:', !!window.naver?.maps);
      resolve();
    };
    script.onerror = (e) => {
      console.error('[NaverMap] 스크립트 로드 실패:', e);
      loadPromise = null; // 재시도 가능하도록 초기화
      reject(new Error('네이버 지도 스크립트 로드 실패'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

interface MapOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
}

/**
 * 지도를 초기화하고 Map 인스턴스를 반환합니다.
 */
export function initNaverMap(
  element: HTMLElement,
  options?: MapOptions,
): any {
  const maps = nv().maps;
  const center = options?.center ?? { lat: 37.5665, lng: 126.978 };
  const zoom = options?.zoom ?? 12;

  return new maps.Map(element, {
    center: new maps.LatLng(center.lat, center.lng),
    zoom,
    zoomControl: true,
    zoomControlOptions: {
      position: maps.Position.TOP_RIGHT,
    },
  });
}

/**
 * 마커를 생성합니다.
 */
export function createMarker(
  map: any,
  lat: number,
  lng: number,
  options?: {
    title?: string;
    icon?: {
      content: string;
      anchor?: any;
    };
  },
): any {
  const maps = nv().maps;
  return new maps.Marker({
    map,
    position: new maps.LatLng(lat, lng),
    title: options?.title,
    icon: options?.icon,
  });
}

/**
 * 인포윈도우를 생성합니다.
 */
export function createInfoWindow(content: string): any {
  const maps = nv().maps;
  return new maps.InfoWindow({
    content,
    borderWidth: 0,
    backgroundColor: 'transparent',
    disableAnchor: true,
    pixelOffset: new maps.Point(0, -8),
  });
}
