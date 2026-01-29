import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface PointRow {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MyPoints() {
  const { user } = useAuthStore();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<PointRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const [pointsRes, historyRes] = await Promise.all([
        supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', user!.id)
          .single(),
        supabase
          .from('point_history')
          .select('id, amount, reason, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setTotalPoints(pointsRes.data?.total_points ?? 0);
      setHistory((historyRes.data as PointRow[]) ?? []);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 포인트</h2>
        <p className="mt-1 text-sm text-gray-500">출석 체크로 모은 포인트를 확인하세요.</p>
      </div>

      {/* 총 포인트 카드 */}
      <div className="rounded-xl border border-gray-200 bg-[#e6f9ef] p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-600">보유 포인트</p>
        <p className="mt-1 text-4xl font-bold text-[#03C75A]">
          {totalPoints.toLocaleString()}
          <span className="ml-1 text-lg font-normal">P</span>
        </p>
      </div>

      {/* 포인트 규칙 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500">포인트 규칙</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-gray-600">📅 일일 출석</span>
            <span className="font-medium text-[#03C75A]">+10P</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">🔥 7일 연속 출석</span>
            <span className="font-medium text-[#03C75A]">+50P 보너스</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">⚡ 14일 연속 출석</span>
            <span className="font-medium text-[#03C75A]">+100P 보너스</span>
          </li>
          <li className="flex justify-between">
            <span className="text-gray-600">🏆 30일 연속 출석</span>
            <span className="font-medium text-[#03C75A]">+300P 보너스</span>
          </li>
        </ul>
      </div>

      {/* 포인트 내역 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-500">포인트 내역</h3>
        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">아직 포인트 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{row.reason}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(row.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${row.amount >= 0 ? 'text-[#03C75A]' : 'text-red-500'}`}>
                  {row.amount >= 0 ? '+' : ''}{row.amount}P
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
