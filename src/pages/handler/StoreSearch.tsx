import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { REGIONS } from '../../constants/regions';
import { BUSINESS_TYPES } from '../../constants/businessTypes';
import NaverMap from '../../components/map/NaverMap';
import type { MapMarker } from '../../components/map/NaverMap';

interface StoreRow {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  region: string;
  sub_region: string | null;
  address: string | null;
  business_type: string | null;
  is_contracted: boolean;
  handler_id: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

function getBusinessLabel(value: string) {
  return BUSINESS_TYPES.find((b) => b.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function StoreSearch() {
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<StoreRow | null>(null);
  const [showMap, setShowMap] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (regionFilter !== 'all') {
      query = query.eq('region', regionFilter);
    }
    if (statusFilter === 'contracted') {
      query = query.eq('is_contracted', true);
    } else if (statusFilter === 'not_contracted') {
      query = query.eq('is_contracted', false);
    }
    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[StoreSearch]', error.message);
    }
    setRows((data as StoreRow[]) ?? []);
    setLoading(false);
  }, [regionFilter, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchRows, 300);
    return () => clearTimeout(timer);
  }, [fetchRows]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">매장 검색</h2>
        <p className="mt-1 text-sm text-gray-500">총 {rows.length}건</p>
      </div>

      {/* 필터 영역 */}
      <div className="space-y-3">
        {/* 상태 필터 */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: '전체' },
            { value: 'contracted', label: '계약완료' },
            { value: 'not_contracted', label: '미계약' },
          ].map((f) => (
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

        {/* 지역 + 검색 */}
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
            placeholder="매장명 검색"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-64"
          />
        </div>
      </div>

      {/* 지도 토글 + 지도 */}
      <div>
        <button
          onClick={() => setShowMap((v) => !v)}
          className="mb-3 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {showMap ? '지도 숨기기' : '지도 보기'}
        </button>

        {showMap && (
          <NaverMap
            markers={rows
              .filter((r): r is StoreRow & { lat: number; lng: number } => r.lat != null && r.lng != null)
              .map((r): MapMarker => ({
                lat: r.lat,
                lng: r.lng,
                title: r.name,
                info: `${r.region}${r.sub_region ? ' ' + r.sub_region : ''} · ${r.is_contracted ? '계약완료' : '미계약'}`,
              }))}
            height="350px"
            onMarkerClick={(mk) => {
              const found = rows.find((r) => r.name === mk.title);
              if (found) setSelected(found);
            }}
          />
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 데스크톱 테이블 */}
          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">매장명</th>
                  <th className="px-4 py-3">사업자명</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">업종</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.owner_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.region}{r.sub_region ? ` ${r.sub_region}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.business_type ? getBusinessLabel(r.business_type) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.is_contracted
                            ? 'bg-[#e6f9ef] text-[#03C75A]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {r.is_contracted ? '계약완료' : '미계약'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
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
                onClick={() => setSelected(r)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.is_contracted
                        ? 'bg-[#e6f9ef] text-[#03C75A]'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {r.is_contracted ? '계약완료' : '미계약'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {r.owner_name} · {r.phone}
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{r.region}{r.sub_region ? ` ${r.sub_region}` : ''}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 상세 모달 */}
      {selected && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  selected.is_contracted
                    ? 'bg-[#e6f9ef] text-[#03C75A]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {selected.is_contracted ? '계약완료' : '미계약'}
              </span>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">사업자명</dt>
                <dd className="font-medium text-gray-900">{selected.owner_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">연락처</dt>
                <dd className="font-medium text-gray-900">{selected.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">지역</dt>
                <dd className="font-medium text-gray-900">
                  {selected.region}{selected.sub_region ? ` ${selected.sub_region}` : ''}
                </dd>
              </div>
              {selected.address && (
                <div className="flex justify-between">
                  <dt className="shrink-0 text-gray-500">주소</dt>
                  <dd className="ml-4 text-right font-medium text-gray-900">{selected.address}</dd>
                </div>
              )}
              {selected.business_type && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">업종</dt>
                  <dd className="font-medium text-gray-900">{getBusinessLabel(selected.business_type)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">등록일</dt>
                <dd className="font-medium text-gray-900">{formatDate(selected.created_at)}</dd>
              </div>
            </dl>

            {selected.lat != null && selected.lng != null && (
              <div className="mt-4">
                <NaverMap
                  lat={selected.lat}
                  lng={selected.lng}
                  markers={[{
                    lat: selected.lat,
                    lng: selected.lng,
                    title: selected.name,
                  }]}
                  height="200px"
                />
              </div>
            )}

            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
