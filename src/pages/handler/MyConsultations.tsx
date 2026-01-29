import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';
import { BUSINESS_TYPES } from '../../constants/businessTypes';

interface ConsultationRow {
  id: string;
  store_name: string;
  region: string;
  sub_region: string | null;
  business_type: string;
  status: ConsultationStatusKey;
  needs_hardware: boolean;
  created_at: string;
}

const STATUS_BADGE: Record<ConsultationStatusKey, string> = {
  pending: 'bg-gray-100 text-gray-700',
  consulting: 'bg-blue-100 text-blue-700',
  contracted: 'bg-[#e6f9ef] text-[#03C75A]',
  failed: 'bg-red-100 text-red-700',
};

function getBusinessLabel(value: string) {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyConsultations() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('id, store_name, region, sub_region, business_type, status, needs_hardware, created_at')
        .eq('handler_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MyConsultations]', error.message);
      }
      setRows((data as ConsultationRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-gray-400 text-lg">신청한 상담이 없습니다.</p>
        <Link
          to="/handler/consultation/new"
          className="mt-4 inline-block rounded-lg bg-[#03C75A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#02b350] transition-colors"
        >
          상담 신청하기
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">내 상담 목록</h2>
          <p className="mt-1 text-sm text-gray-500">총 {rows.length}건</p>
        </div>
        <Link
          to="/handler/consultation/new"
          className="rounded-lg bg-[#03C75A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02b350] transition-colors"
        >
          + 상담 신청
        </Link>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="mt-6 hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">매장명</th>
              <th className="px-4 py-3">지역</th>
              <th className="px-4 py-3">업종</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3 text-center">하드웨어</th>
              <th className="px-4 py-3">신청일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => console.log('상세보기:', row.id)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.store_name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.region}{row.sub_region ? ` ${row.sub_region}` : ''}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {getBusinessLabel(row.business_type)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}
                  >
                    {CONSULTATION_STATUS[row.status]?.label ?? row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {row.needs_hardware ? 'O' : 'X'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            onClick={() => console.log('상세보기:', row.id)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <p className="font-medium text-gray-900">{row.store_name}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}
              >
                {CONSULTATION_STATUS[row.status]?.label ?? row.status}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p>{row.region}{row.sub_region ? ` ${row.sub_region}` : ''} · {getBusinessLabel(row.business_type)}</p>
              <div className="flex justify-between">
                <p>하드웨어: {row.needs_hardware ? 'O' : 'X'}</p>
                <p>{formatDate(row.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
