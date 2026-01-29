import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { HARDWARE_STATUS } from '../../constants/hardwareStatus';
import type { HardwareStatusKey } from '../../constants/hardwareStatus';
import { HARDWARE_TYPES } from '../../constants/hardwareTypes';

interface RecentHardware {
  id: string;
  store_name: string;
  region: string;
  sub_region: string | null;
  hardware_type: string;
  hardware_qty: number;
  hardware_status: HardwareStatusKey;
  created_at: string;
}

const HW_STATUS_BADGE: Record<HardwareStatusKey, string> = {
  received: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-[#e6f9ef] text-[#03C75A]',
};

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

function getHardwareLabel(value: string) {
  return HARDWARE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default function GeotechStaffDashboard() {
  const { user } = useAuthStore();

  const [totalCount, setTotalCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [monthCompleted, setMonthCompleted] = useState(0);
  const [recentList, setRecentList] = useState<RecentHardware[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [totalRes, receivedRes, scheduledRes, completedRes, recentRes] =
        await Promise.all([
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('needs_hardware', true),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('needs_hardware', true)
            .eq('hardware_status', 'received'),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('needs_hardware', true)
            .eq('hardware_status', 'scheduled'),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('needs_hardware', true)
            .eq('hardware_status', 'completed')
            .gte('created_at', startOfMonth()),
          supabase
            .from('consultations')
            .select('id, store_name, region, sub_region, hardware_type, hardware_qty, hardware_status, created_at')
            .eq('needs_hardware', true)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

      setTotalCount(totalRes.count ?? 0);
      setReceivedCount(receivedRes.count ?? 0);
      setScheduledCount(scheduledRes.count ?? 0);
      setMonthCompleted(completedRes.count ?? 0);
      setRecentList((recentRes.data as RecentHardware[]) ?? []);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  if (user?.role === 'geotech_staff' && !user?.is_approved) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <p className="text-lg font-semibold text-yellow-700">관리자 승인 대기 중입니다</p>
          <p className="mt-2 text-sm text-yellow-600">승인이 완료되면 이 페이지를 이용할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: '전체 하드웨어 신청', value: totalCount, icon: '🖥️' },
    { label: '접수 대기', value: receivedCount, icon: '📥' },
    { label: '설치 예정', value: scheduledCount, icon: '📅' },
    { label: '이번 달 설치 완료', value: monthCompleted, icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">지오테크넷 대시보드</h2>
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
              <span className="ml-1 text-base font-normal text-gray-400">건</span>
            </p>
          </div>
        ))}
      </div>

      {/* 최근 하드웨어 신청 5개 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900">최근 하드웨어 신청</h3>

        {recentList.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-400">
            하드웨어 신청이 없습니다.
          </p>
        ) : (
          <>
            {/* 데스크톱 */}
            <table className="mt-3 hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="pb-2 font-medium">매장명</th>
                  <th className="pb-2 font-medium">지역</th>
                  <th className="pb-2 font-medium">신규/교체</th>
                  <th className="pb-2 text-center font-medium">수량</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 text-right font-medium">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentList.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800">{r.store_name}</td>
                    <td className="py-2.5 text-gray-600">
                      {r.region}{r.sub_region ? ` ${r.sub_region}` : ''}
                    </td>
                    <td className="py-2.5 text-gray-600">
                      {getHardwareLabel(r.hardware_type)}
                    </td>
                    <td className="py-2.5 text-center text-gray-600">{r.hardware_qty}</td>
                    <td className="py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${HW_STATUS_BADGE[r.hardware_status] ?? HW_STATUS_BADGE.received}`}>
                        {HARDWARE_STATUS[r.hardware_status]?.label ?? r.hardware_status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 모바일 */}
            <ul className="mt-3 space-y-2 md:hidden">
              {recentList.map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{r.store_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${HW_STATUS_BADGE[r.hardware_status] ?? HW_STATUS_BADGE.received}`}>
                      {HARDWARE_STATUS[r.hardware_status]?.label ?? r.hardware_status}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>{r.region} · {getHardwareLabel(r.hardware_type)} · {r.hardware_qty}대</span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
