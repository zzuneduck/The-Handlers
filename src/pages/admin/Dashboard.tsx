/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';
import { loadNaverMapScript, initNaverMap } from '../../lib/naverMap';
import { REGION_COORDS } from '../../constants/regionCoords';
import { REGIONS } from '../../constants/regions';

interface RecentConsultation {
  id: string;
  store_name: string;
  handler_name: string;
  status: ConsultationStatusKey;
  created_at: string;
}

interface RecentHandler {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const STATUS_BADGE: Record<ConsultationStatusKey, string> = {
  pending: 'bg-gray-100 text-gray-600',
  consulting: 'bg-blue-100 text-blue-700',
  contracted: 'bg-[#e6f9ef] text-[#03C75A]',
  failed: 'bg-red-100 text-red-700',
};

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const [handlerCount, setHandlerCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [monthContracted, setMonthContracted] = useState(0);
  const [hwPending, setHwPending] = useState(0);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [recentHandlers, setRecentHandlers] = useState<RecentHandler[]>([]);
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [handlersRes, todayRes, contractedRes, hwRes, consultRes, handlerListRes, regionRes] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'handler'),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfDay()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'contracted')
            .gte('created_at', startOfMonth()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('hardware_status', 'received'),
          supabase
            .from('consultations')
            .select('id, store_name, handler_name, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('profiles')
            .select('id, name, email, created_at')
            .eq('role', 'handler')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('consultations')
            .select('region')
            .gte('created_at', startOfMonth()),
        ]);

      // 지역별 상담 건수 집계
      const counts: Record<string, number> = {};
      ((regionRes.data as Array<{ region: string }>) ?? []).forEach((row) => {
        if (row.region) {
          counts[row.region] = (counts[row.region] ?? 0) + 1;
        }
      });

      setHandlerCount(handlersRes.count ?? 0);
      setTodayCount(todayRes.count ?? 0);
      setMonthContracted(contractedRes.count ?? 0);
      setHwPending(hwRes.count ?? 0);
      setRecentConsultations((consultRes.data as RecentConsultation[]) ?? []);
      setRecentHandlers((handlerListRes.data as RecentHandler[]) ?? []);
      setRegionCounts(counts);
      setLoading(false);
    }

    fetchData();
  }, []);

  // 지역별 상담 현황 지도 초기화
  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function initMap() {
      try {
        await loadNaverMapScript();
      } catch {
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

      let openInfoWindow: any = null;

      REGIONS.forEach((region) => {
        const count = regionCounts[region] ?? 0;
        if (count === 0) return;

        const coord = REGION_COORDS[region];
        if (!coord) return;

        const size = Math.min(20 + count * 4, 60);
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
          ">${count}</div>
        `;

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(coord.lat, coord.lng),
          map,
          icon: {
            content: markerContent,
            anchor: new window.naver.maps.Point(size / 2, size / 2),
          },
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:12px 16px;min-width:120px;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
              <p style="font-weight:700;font-size:14px;color:#111;margin:0;">${region}</p>
              <p style="font-size:13px;color:#03C75A;font-weight:600;margin:4px 0 0;">상담 ${count}건</p>
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
        });

        markerRefs.current.push(marker);
      });

      window.naver.maps.Event.addListener(map, 'click', () => {
        if (openInfoWindow) {
          openInfoWindow.close();
          openInfoWindow = null;
        }
      });
    }

    initMap();
    return () => {
      cancelled = true;
    };
  }, [loading, regionCounts]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  const stats = [
    { label: '전체 핸들러', value: handlerCount, icon: '👥' },
    { label: '오늘 상담', value: todayCount, icon: '📋' },
    { label: '이번 달 계약', value: monthContracted, icon: '✅' },
    { label: '하드웨어 대기', value: hwPending, icon: '🖥️' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">관리자 대시보드</h2>
        <p className="mt-1 text-sm text-gray-500">
          환영합니다, {user?.name}님
        </p>
      </div>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{s.label}</p>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-[#03C75A]">
              {s.value}
              <span className="ml-1 text-base font-normal text-gray-400">
                {s.label === '오늘 상담' || s.label === '이번 달 계약' || s.label === '하드웨어 대기' ? '건' : '명'}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 지역별 상담 현황 지도 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">지역별 상담 현황</h3>
        <p className="mt-1 text-xs text-gray-400">이번 달 지역별 상담 건수</p>
        <div className="relative mt-3 overflow-hidden rounded-xl border border-gray-200">
          <div ref={mapRef} style={{ height: '400px' }} className="w-full" />
        </div>
      </div>

      {/* 최근 상담 + 최근 가입 핸들러 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 최근 상담 5개 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">최근 상담</h3>

          {recentConsultations.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-400">
              상담 데이터가 없습니다.
            </p>
          ) : (
            <>
              {/* 데스크톱 */}
              <table className="mt-3 hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <th className="pb-2 font-medium">매장명</th>
                    <th className="pb-2 font-medium">핸들러</th>
                    <th className="pb-2 font-medium">상태</th>
                    <th className="pb-2 text-right font-medium">날짜</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentConsultations.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-medium text-gray-800">
                        {c.store_name}
                      </td>
                      <td className="py-2.5 text-gray-600">{c.handler_name}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}
                        >
                          {CONSULTATION_STATUS[c.status]?.label ?? c.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-gray-500">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 모바일 */}
              <ul className="mt-3 space-y-2 md:hidden">
                {recentConsultations.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {c.store_name}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}
                      >
                        {CONSULTATION_STATUS[c.status]?.label ?? c.status}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>{c.handler_name}</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* 최근 가입 핸들러 5개 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">최근 가입 핸들러</h3>

          {recentHandlers.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-400">
              가입한 핸들러가 없습니다.
            </p>
          ) : (
            <>
              {/* 데스크톱 */}
              <table className="mt-3 hidden w-full text-left text-sm md:table">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <th className="pb-2 font-medium">이름</th>
                    <th className="pb-2 font-medium">이메일</th>
                    <th className="pb-2 text-right font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentHandlers.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 font-medium text-gray-800">
                        {h.name}
                      </td>
                      <td className="py-2.5 text-gray-600">{h.email}</td>
                      <td className="py-2.5 text-right text-gray-500">
                        {formatDate(h.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 모바일 */}
              <ul className="mt-3 space-y-2 md:hidden">
                {recentHandlers.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <p className="font-medium text-gray-800">{h.name}</p>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                      <span>{h.email}</span>
                      <span>{formatDate(h.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
