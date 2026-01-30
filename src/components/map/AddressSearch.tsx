/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { loadNaverMapScript } from '../../lib/naverMap';

interface AddressResult {
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
}

interface AddressSearchProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
  showMiniMap?: boolean;
}

export default function AddressSearch({
  value,
  onChange,
  placeholder = '주소 검색',
  showMiniMap = true,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // 네이버 스크립트 로드
  useEffect(() => {
    loadNaverMapScript()
      .then(() => setScriptReady(true))
      .catch(() => {});
  }, []);

  // value prop 동기화
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 디바운스 검색
  useEffect(() => {
    if (!query.trim() || query === value) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      searchAddress(query.trim());
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const searchAddress = useCallback(
    async (keyword: string) => {
      if (!scriptReady || !window.naver?.maps?.Service) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        window.naver.maps.Service.geocode(
          { query: keyword },
          (status: any, response: any) => {
            setSearching(false);
            if (status !== window.naver.maps.Service.Status.OK) {
              setResults([]);
              return;
            }

            const items = response.v2?.addresses ?? [];
            const mapped: AddressResult[] = items.slice(0, 5).map((item: any) => ({
              address: item.jibunAddress || item.roadAddress || keyword,
              roadAddress: item.roadAddress || item.jibunAddress || '',
              lat: parseFloat(item.y),
              lng: parseFloat(item.x),
            }));

            setResults(mapped);
            setOpen(mapped.length > 0);
          },
        );
      } catch {
        setSearching(false);
        setResults([]);
      }
    },
    [scriptReady],
  );

  const handleSelect = (r: AddressResult) => {
    setQuery(r.roadAddress || r.address);
    setSelectedCoord({ lat: r.lat, lng: r.lng });
    setOpen(false);
    setResults([]);
    onChange(r.roadAddress || r.address, r.lat, r.lng);
  };

  // 미니맵 렌더링
  useEffect(() => {
    if (!showMiniMap || !selectedCoord || !miniMapRef.current || !scriptReady || !window.naver?.maps)
      return;

    const pos = new window.naver.maps.LatLng(selectedCoord.lat, selectedCoord.lng);

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.naver.maps.Map(miniMapRef.current, {
        center: pos,
        zoom: 16,
        zoomControl: false,
      });
    } else {
      mapInstanceRef.current.setCenter(pos);
      mapInstanceRef.current.setZoom(16);
    }

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new window.naver.maps.Marker({
      position: pos,
      map: mapInstanceRef.current,
    });
  }, [selectedCoord, showMiniMap, scriptReady]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-9 text-sm text-gray-900 focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {searching ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
      </div>

      {/* 드롭다운 */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
              >
                <span className="mt-0.5 shrink-0 text-[#03C75A]">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-gray-700">{r.roadAddress || r.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 미니맵 */}
      {showMiniMap && selectedCoord && (
        <div
          ref={miniMapRef}
          className="mt-2 h-[200px] w-full rounded-lg border border-gray-200"
        />
      )}
    </div>
  );
}
