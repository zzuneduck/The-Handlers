import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [handlersRes, todayRes, contractedRes, hwRes, consultRes, handlerListRes] =
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
        ]);

      setHandlerCount(handlersRes.count ?? 0);
      setTodayCount(todayRes.count ?? 0);
      setMonthContracted(contractedRes.count ?? 0);
      setHwPending(hwRes.count ?? 0);
      setRecentConsultations((consultRes.data as RecentConsultation[]) ?? []);
      setRecentHandlers((handlerListRes.data as RecentHandler[]) ?? []);
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
