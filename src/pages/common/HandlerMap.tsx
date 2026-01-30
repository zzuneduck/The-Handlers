/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { loadNaverMapScript, initNaverMap } from '../../lib/naverMap';
import { HANDLER_LEVELS } from '../../constants/levels';
import { HANDLER_SKILLS } from '../../constants/skills';
import { REGIONS } from '../../constants/regions';
import { REGION_COORDS } from '../../constants/regionCoords';
import type { HandlerLevelKey } from '../../constants/levels';
import type { SkillKey } from '../../constants/skills';

interface HandlerRow {
  id: string;
  name: string;
  handler_level: HandlerLevelKey;
  region: string | null;
  skill_marketing: SkillKey | null;
  skill_sales: SkillKey | null;
  skill_specialty: SkillKey | null;
  consult_count: number;
  contract_count: number;
}

interface RegionStat {
  region: string;
  count: number;
  handlers: HandlerRow[];
}

function getMonthRange() {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
  return { start, end };
}

function SkillBadge({ skillKey }: { skillKey: SkillKey | null }) {
  if (!skillKey) return null;
  const skill = HANDLER_SKILLS[skillKey];
  if (!skill) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      {skill.icon} {skill.name}
    </span>
  );
}

export default function HandlerMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [handlers, setHandlers] = useState<HandlerRow[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedHandler, setSelectedHandler] = useState<HandlerRow | null>(null);

  // 통계
  const totalHandlers = handlers.length;
  const activeRegions = regionStats.filter((r) => r.count > 0).length;
  const totalConsults = handlers.reduce((s, h) => s + h.consult_count, 0);
  const totalContracts = handlers.reduce((s, h) => s + h.contract_count, 0);

  const filteredHandlers =
    selectedRegion
      ? handlers.filter((h) => h.region === selectedRegion)
      : regionFilter !== 'all'
        ? handlers.filter((h) => h.region === regionFilter)
        : handlers;

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setLoading(true);

    const { start, end } = getMonthRange();

    // 핸들러 프로필
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, name, handler_level, region, skill_marketing, skill_sales, skill_specialty')
      .eq('role', 'handler');

    if (profErr) {
      console.error('[HandlerMap] profiles:', profErr.message);
    }

    const handlerList = (profiles ?? []) as Array<{
      id: string;
      name: string;
      handler_level: HandlerLevelKey;
      region: string | null;
      skill_marketing: SkillKey | null;
      skill_sales: SkillKey | null;
      skill_specialty: SkillKey | null;
    }>;

    // 이번 달 상담 건수
    const { data: consultData } = await supabase
      .from('consultations')
      .select('handler_id, status')
      .gte('created_at', start)
      .lt('created_at', end);

    const consultRows = consultData ?? [];
    const consultMap = new Map<string, number>();
    const contractMap = new Map<string, number>();

    consultRows.forEach((c: any) => {
      consultMap.set(c.handler_id, (consultMap.get(c.handler_id) ?? 0) + 1);
      if (c.status === 'completed') {
        contractMap.set(c.handler_id, (contractMap.get(c.handler_id) ?? 0) + 1);
      }
    });

    const merged: HandlerRow[] = handlerList.map((h) => ({
      ...h,
      consult_count: consultMap.get(h.id) ?? 0,
      contract_count: contractMap.get(h.id) ?? 0,
    }));

    // 지역별 통계
    const regionMap = new Map<string, HandlerRow[]>();
    merged.forEach((h) => {
      if (h.region) {
        const list = regionMap.get(h.region) ?? [];
        list.push(h);
        regionMap.set(h.region, list);
      }
    });

    const stats: RegionStat[] = REGIONS.map((r) => ({
      region: r,
      count: regionMap.get(r)?.length ?? 0,
      handlers: regionMap.get(r) ?? [],
    }));

    setHandlers(merged);
    setRegionStats(stats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 지도 초기화 + 마커
  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function initMap() {
      try {
        await loadNaverMapScript();
      } catch (err) {
        setError((err as Error).message);
        return;
      }

      if (cancelled || !mapRef.current || !window.naver?.maps) return;

      if (!mapInstance.current) {
        mapInstance.current = initNaverMap(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
      }

      const map = mapInstance.current;

      // 기존 마커 제거
      markerRefs.current.forEach((m) => m.setMap(null));
      markerRefs.current = [];

      const visibleStats =
        regionFilter !== 'all'
          ? regionStats.filter((r) => r.region === regionFilter)
          : regionStats.filter((r) => r.count > 0);

      let openInfoWindow: any = null;

      visibleStats.forEach((rs) => {
        const coord = REGION_COORDS[rs.region];
        if (!coord) return;

        const size = Math.min(20 + rs.count * 6, 60);
        const fontSize = size < 30 ? 11 : 14;

        const markerContent = `
          <div style="
            width:${size}px;height:${size}px;
            background:#03C75A;
            border:3px solid #fff;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:700;font-size:${fontSize}px;
            box-shadow:0 2px 8px rgba(3,199,90,0.4);
            cursor:pointer;
          ">${rs.count}</div>
        `;

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(coord.lat, coord.lng),
          map,
          icon: {
            content: markerContent,
            anchor: new window.naver.maps.Point(size / 2, size / 2),
          },
        });

        const topHandlers = rs.handlers
          .sort((a, b) => b.consult_count - a.consult_count)
          .slice(0, 3);
        const topHtml = topHandlers
          .map((h) => {
            const lv = HANDLER_LEVELS[h.handler_level as HandlerLevelKey] ?? HANDLER_LEVELS[1];
            return `<div style="font-size:12px;color:#444;margin-top:4px;">${lv.icon} ${h.name} (상담 ${h.consult_count}건)</div>`;
          })
          .join('');

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:14px 18px;min-width:180px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
              <p style="font-weight:700;font-size:15px;color:#111;margin:0;">${rs.region}</p>
              <p style="font-size:12px;color:#03C75A;font-weight:600;margin:4px 0 0;">핸들러 ${rs.count}명</p>
              ${topHtml}
              ${rs.count > 3 ? `<p style="font-size:11px;color:#999;margin-top:6px;">외 ${rs.count - 3}명...</p>` : ''}
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'transparent',
          disableAnchor: true,
          pixelOffset: new window.naver.maps.Point(0, -(size / 2 + 8)),
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (openInfoWindow) openInfoWindow.close();
          infoWindow.open(map, marker);
          openInfoWindow = infoWindow;
          setSelectedRegion(rs.region);
        });

        markerRefs.current.push(marker);
      });

      // 지도 클릭 시 인포윈도우 닫기
      window.naver.maps.Event.addListener(map, 'click', () => {
        if (openInfoWindow) {
          openInfoWindow.close();
          openInfoWindow = null;
        }
      });

      // 필터된 지역이 1개면 줌인
      if (regionFilter !== 'all') {
        const coord = REGION_COORDS[regionFilter];
        if (coord) {
          map.setCenter(new window.naver.maps.LatLng(coord.lat, coord.lng));
          map.setZoom(11);
        }
      } else {
        map.setCenter(new window.naver.maps.LatLng(36.5, 127.5));
        map.setZoom(7);
      }
    }

    initMap();
    return () => {
      cancelled = true;
    };
  }, [loading, regionStats, regionFilter]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">지도를 표시할 수 없습니다</p>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">핸들러 활동 현황</h2>
          <p className="mt-1 text-sm text-gray-500">지역별 핸들러 분포 및 실적</p>
        </div>
        <select
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value);
            setSelectedRegion(null);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-40"
        >
          <option value="all">전체 지역</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '총 핸들러', value: totalHandlers, suffix: '명', color: 'text-[#03C75A]' },
          { label: '활동 지역', value: activeRegions, suffix: '개', color: 'text-blue-600' },
          { label: '이번 달 상담', value: totalConsults, suffix: '건', color: 'text-orange-500' },
          { label: '이번 달 계약', value: totalContracts, suffix: '건', color: 'text-purple-600' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>
              {loading ? '-' : s.value}
              <span className="ml-0.5 text-sm font-normal text-gray-400">{s.suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 지도 */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div ref={mapRef} style={{ height: '500px' }} className="w-full" />
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
          </div>
        )}
      </div>

      {/* 선택된 지역 표시 */}
      {selectedRegion && (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#e6f9ef] px-3 py-1 text-sm font-medium text-[#03C75A]">
            {selectedRegion}
          </span>
          <button
            onClick={() => setSelectedRegion(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            전체 보기
          </button>
        </div>
      )}

      {/* 핸들러 목록 테이블 */}
      {!loading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* 데스크톱 */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">레벨</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">능력치</th>
                  <th className="px-4 py-3 text-center">상담</th>
                  <th className="px-4 py-3 text-center">계약</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHandlers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      핸들러가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredHandlers.map((h) => {
                    const lv = HANDLER_LEVELS[h.handler_level as HandlerLevelKey] ?? HANDLER_LEVELS[1];
                    return (
                      <tr
                        key={h.id}
                        onClick={() => setSelectedHandler(h)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {lv.icon} Lv.{h.handler_level}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{h.region ?? '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <SkillBadge skillKey={h.skill_marketing} />
                            <SkillBadge skillKey={h.skill_sales} />
                            <SkillBadge skillKey={h.skill_specialty} />
                            {!h.skill_marketing && !h.skill_sales && !h.skill_specialty && (
                              <span className="text-xs text-gray-300">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {h.consult_count}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-[#03C75A]">
                          {h.contract_count}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 모바일 */}
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredHandlers.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400">핸들러가 없습니다.</p>
            ) : (
              filteredHandlers.map((h) => {
                const lv = HANDLER_LEVELS[h.handler_level as HandlerLevelKey] ?? HANDLER_LEVELS[1];
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHandler(h)}
                    className="cursor-pointer px-4 py-3 active:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{h.name}</p>
                      <span className="text-xs text-gray-500">
                        {lv.icon} Lv.{h.handler_level}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{h.region ?? '-'}</span>
                      <span>|</span>
                      <span>상담 {h.consult_count}</span>
                      <span>|</span>
                      <span className="text-[#03C75A]">계약 {h.contract_count}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <SkillBadge skillKey={h.skill_marketing} />
                      <SkillBadge skillKey={h.skill_sales} />
                      <SkillBadge skillKey={h.skill_specialty} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedHandler && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedHandler(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{selectedHandler.name}</h3>
              <button
                onClick={() => setSelectedHandler(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(() => {
              const lv = HANDLER_LEVELS[selectedHandler.handler_level as HandlerLevelKey] ?? HANDLER_LEVELS[1];
              return (
                <p className="mt-1 text-sm text-gray-500">
                  {lv.icon} Lv.{selectedHandler.handler_level} {lv.name}
                  <span className="ml-1 text-xs text-gray-400">({lv.description})</span>
                </p>
              );
            })()}

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">활동 지역</dt>
                <dd className="font-medium text-gray-900">{selectedHandler.region ?? '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이번 달 상담</dt>
                <dd className="font-medium text-gray-900">{selectedHandler.consult_count}건</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이번 달 계약</dt>
                <dd className="font-medium text-[#03C75A]">{selectedHandler.contract_count}건</dd>
              </div>
            </dl>

            {/* 능력치 */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">능력치</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <SkillBadge skillKey={selectedHandler.skill_marketing} />
                <SkillBadge skillKey={selectedHandler.skill_sales} />
                <SkillBadge skillKey={selectedHandler.skill_specialty} />
                {!selectedHandler.skill_marketing && !selectedHandler.skill_sales && !selectedHandler.skill_specialty && (
                  <span className="text-xs text-gray-300">설정된 능력치가 없습니다.</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedHandler(null)}
              className="mt-5 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
