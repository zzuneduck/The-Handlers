import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';
import { REGIONS } from '../../constants/regions';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import { downloadExcel } from '../../lib/excel';

interface ConsultationRow {
  id: string;
  store_name: string;
  owner_phone: string;
  region: string;
  sub_region: string | null;
  business_type: string;
  handler_name: string;
  status: ConsultationStatusKey;
  needs_hardware: boolean;
  created_at: string;
}

const STATUS_BADGE: Record<ConsultationStatusKey, string> = {
  pending: 'bg-gray-100 text-gray-600',
  consulting: 'bg-blue-100 text-blue-700',
  contracted: 'bg-[#e6f9ef] text-[#03C75A]',
  failed: 'bg-red-100 text-red-700',
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '신청' },
  { value: 'consulting', label: '상담중' },
  { value: 'contracted', label: '계약완료' },
  { value: 'failed', label: '계약실패' },
];

function getBusinessLabel(value: string) {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ConsultationList() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    let query = supabase
      .from('consultations')
      .select('id, store_name, owner_phone, region, sub_region, business_type, handler_name, status, needs_hardware, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (regionFilter !== 'all') {
      query = query.eq('region', regionFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[ConsultationList]', error.message);
    }
    setRows((data as ConsultationRow[]) ?? []);
    setLoading(false);
  }, [statusFilter, regionFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.store_name.toLowerCase().includes(q) ||
      r.handler_name.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = async (id: string, newStatus: ConsultationStatusKey) => {
    setUpdating(id);
    const { error } = await supabase
      .from('consultations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert(`상태 변경 실패: ${error.message}`);
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    }
    setUpdating(null);
  };

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

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">상담 목록</h2>
          <p className="mt-1 text-sm text-gray-500">총 {filtered.length}건</p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={() =>
              downloadExcel(
                filtered.map((r) => ({
                  created_at: formatDate(r.created_at),
                  store_name: r.store_name,
                  owner_phone: r.owner_phone,
                  region: r.region,
                  sub_region: r.sub_region ?? '',
                  business_type: getBusinessLabel(r.business_type),
                  handler_name: r.handler_name,
                  status: CONSULTATION_STATUS[r.status]?.label ?? r.status,
                  needs_hardware: r.needs_hardware ? 'O' : 'X',
                })),
                [
                  { key: 'created_at', label: '신청일' },
                  { key: 'store_name', label: '매장명' },
                  { key: 'owner_phone', label: '연락처' },
                  { key: 'region', label: '지역' },
                  { key: 'sub_region', label: '상세지역' },
                  { key: 'business_type', label: '업종' },
                  { key: 'handler_name', label: '핸들러' },
                  { key: 'status', label: '상태' },
                  { key: 'needs_hardware', label: '하드웨어필요' },
                ],
                `상담목록_${new Date().toISOString().slice(0, 10)}`,
              )
            }
            className="rounded-lg border border-[#03C75A] px-4 py-2 text-sm font-semibold text-[#03C75A] transition-colors hover:bg-[#03C75A] hover:text-white"
          >
            엑셀 다운로드
          </button>
        )}
      </div>

      {/* 필터 영역 */}
      <div className="space-y-3">
        {/* 상태 필터 */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#03C75A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 지역 필터 + 검색 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-40"
          >
            <option value="all">전체 지역</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="매장명 또는 핸들러명 검색"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-64"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">매장명</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">업종</th>
                  <th className="px-4 py-3">핸들러</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3 text-center">하드웨어</th>
                  <th className="px-4 py-3">신청일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => console.log('상세보기:', row.id)}
                    className={`cursor-pointer transition-colors ${
                      updating === row.id ? 'opacity-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.store_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.owner_phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.region}{row.sub_region ? ` ${row.sub_region}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {getBusinessLabel(row.business_type)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.handler_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(row.id, e.target.value as ConsultationStatusKey);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={updating === row.id}
                        className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}
                      >
                        {Object.entries(CONSULTATION_STATUS).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {row.needs_hardware ? (
                        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">O</span>
                      ) : (
                        <span className="text-xs text-gray-400">X</span>
                      )}
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
          <div className="space-y-3 lg:hidden">
            {filtered.map((row) => (
              <div
                key={row.id}
                onClick={() => console.log('상세보기:', row.id)}
                className={`cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50 ${
                  updating === row.id ? 'opacity-50' : ''
                }`}
              >
                {/* 1행: 매장명 + 상태 */}
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{row.store_name}</p>
                  <select
                    value={row.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(row.id, e.target.value as ConsultationStatusKey);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updating === row.id}
                    className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}
                  >
                    {Object.entries(CONSULTATION_STATUS).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* 2행: 핸들러, 지역, 업종 */}
                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    {row.handler_name} · {row.region}{row.sub_region ? ` ${row.sub_region}` : ''} · {getBusinessLabel(row.business_type)}
                  </p>
                </div>

                {/* 3행: 연락처, 하드웨어, 날짜 */}
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{row.owner_phone}</span>
                  <div className="flex items-center gap-3">
                    {row.needs_hardware && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">HW</span>
                    )}
                    <span>{formatDate(row.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
