import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';

interface RecentConsultation {
  id: string;
  store_name: string;
  handler_name: string;
  region: string;
  sub_region: string | null;
  status: ConsultationStatusKey;
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

export default function PaynStaffDashboard() {
  const { user } = useAuthStore();

  const [totalCount, setTotalCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [consultingCount, setConsultingCount] = useState(0);
  const [monthContracted, setMonthContracted] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [totalRes, todayRes, consultingRes, contractedRes, monthTotalRes, recentRes] =
        await Promise.all([
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfDay()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'consulting'),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'contracted')
            .gte('created_at', startOfMonth()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startOfMonth()),
          supabase
            .from('consultations')
            .select('id, store_name, handler_name, region, sub_region, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

      setTotalCount(totalRes.count ?? 0);
      setTodayCount(todayRes.count ?? 0);
      setConsultingCount(consultingRes.count ?? 0);
      setMonthContracted(contractedRes.count ?? 0);
      setMonthTotal(monthTotalRes.count ?? 0);
      setRecentConsultations((recentRes.data as RecentConsultation[]) ?? []);
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

  if (user?.role === 'payn_staff' && !user?.is_approved) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <p className="text-lg font-semibold text-yellow-700">관리자 승인 대기 중입니다</p>
          <p className="mt-2 text-sm text-yellow-600">승인이 완료되면 이 페이지를 이용할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const conversionRate = monthTotal > 0 ? ((monthContracted / monthTotal) * 100).toFixed(1) : '0.0';

  const stats = [
    { label: '전체 상담', value: totalCount, unit: '건', icon: '📊' },
    { label: '오늘 접수', value: todayCount, unit: '건', icon: '📥' },
    { label: '상담 중', value: consultingCount, unit: '건', icon: '💬' },
    { label: '이번 달 계약', value: monthContracted, unit: '건', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">PayN 대시보드</h2>
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
              <span className="ml-1 text-base font-normal text-gray-400">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* 계약 전환율 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">이번 달 계약 전환율</p>
            <p className="mt-1 text-4xl font-bold text-[#03C75A]">
              {conversionRate}
              <span className="text-lg font-normal text-gray-400">%</span>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>전체 <strong className="text-gray-800">{monthTotal}</strong>건</span>
            <span className="text-gray-300">|</span>
            <span>계약 <strong className="text-[#03C75A]">{monthContracted}</strong>건</span>
          </div>
        </div>
        {/* 프로그레스 바 */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#03C75A] transition-all"
            style={{ width: `${Math.min(Number(conversionRate), 100)}%` }}
          />
        </div>
      </div>

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
                  <th className="pb-2 font-medium">지역</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 text-right font-medium">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentConsultations.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800">{c.store_name}</td>
                    <td className="py-2.5 text-gray-600">{c.handler_name}</td>
                    <td className="py-2.5 text-gray-600">
                      {c.region}{c.sub_region ? ` ${c.sub_region}` : ''}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}>
                        {CONSULTATION_STATUS[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-gray-500">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 모바일 */}
            <ul className="mt-3 space-y-2 md:hidden">
              {recentConsultations.map((c) => (
                <li key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{c.store_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}>
                      {CONSULTATION_STATUS[c.status]?.label ?? c.status}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>{c.handler_name} · {c.region}</span>
                    <span>{formatDate(c.created_at)}</span>
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
