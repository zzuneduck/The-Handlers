import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface SalesRow {
  id: string;
  record_date: string;
  visit_count: number;
  consultation_count: number;
  contract_count: number;
  memo: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function MySales() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('sales_records')
      .select('id, record_date, visit_count, consultation_count, contract_count, memo, created_at')
      .eq('handler_id', user.id)
      .order('record_date', { ascending: false });

    if (error) {
      console.error('[MySales]', error.message);
    }
    setRows((data as SalesRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    setDeleting(id);
    const { error } = await supabase.from('sales_records').delete().eq('id', id);
    if (error) {
      toast.error(`삭제 실패: ${error.message}`);
    } else {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
    setDeleting(null);
  };

  // 이번 달 합계
  const monthStart = startOfMonth();
  const monthRows = rows.filter((r) => r.record_date >= monthStart);
  const totalVisit = monthRows.reduce((s, r) => s + r.visit_count, 0);
  const totalConsultation = monthRows.reduce((s, r) => s + r.consultation_count, 0);
  const totalContract = monthRows.reduce((s, r) => s + r.contract_count, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  const summaryCards = [
    { label: '총 방문', value: totalVisit, icon: '🚶' },
    { label: '총 상담', value: totalConsultation, icon: '💬' },
    { label: '총 계약', value: totalContract, icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">내 영업 현황</h2>
        <p className="mt-1 text-sm text-gray-500">총 {rows.length}건의 기록</p>
      </div>

      {/* 이번 달 합계 */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((s) => (
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
      <p className="text-xs text-gray-400">* 이번 달 합계</p>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">영업 기록이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">날짜</th>
                  <th className="px-4 py-3 text-center">방문</th>
                  <th className="px-4 py-3 text-center">상담</th>
                  <th className="px-4 py-3 text-center">계약</th>
                  <th className="px-4 py-3">메모</th>
                  <th className="px-4 py-3 text-center">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${deleting === r.id ? 'opacity-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatDate(r.record_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.visit_count}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.consultation_count}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#03C75A]">{r.contract_count}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500">
                      {r.memo || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="space-y-3 md:hidden">
            {rows.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${deleting === r.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{formatDate(r.record_date)}</span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-gray-500">
                    방문 <strong className="text-gray-800">{r.visit_count}</strong>
                  </span>
                  <span className="text-gray-500">
                    상담 <strong className="text-gray-800">{r.consultation_count}</strong>
                  </span>
                  <span className="text-gray-500">
                    계약 <strong className="text-[#03C75A]">{r.contract_count}</strong>
                  </span>
                </div>
                {r.memo && (
                  <p className="mt-2 text-xs text-gray-400">{r.memo}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
