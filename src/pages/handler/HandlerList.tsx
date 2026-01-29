import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { HANDLER_LEVELS } from '../../constants/levels';
import type { HandlerLevelKey } from '../../constants/levels';

interface HandlerRow {
  id: string;
  name: string;
  email: string;
  handler_level: HandlerLevelKey | null;
  region: string | null;
  created_at: string;
}

type SortKey = 'level' | 'name' | 'created_at';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function levelLabel(lv: HandlerLevelKey | null) {
  if (!lv) return { icon: '❓', text: 'Lv.?' };
  const info = HANDLER_LEVELS[lv];
  return { icon: info.icon, text: `Lv.${lv} ${info.name}` };
}

export default function HandlerList() {
  const [rows, setRows] = useState<HandlerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('level');

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, handler_level, region, created_at')
      .eq('role', 'handler')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[HandlerList]', error.message);
    }
    setRows((data as HandlerRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = useMemo(() => {
    let list = rows;

    if (levelFilter !== 'all') {
      const lv = Number(levelFilter) as HandlerLevelKey;
      list = list.filter((r) => r.handler_level === lv);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (sortKey === 'level') {
      sorted.sort((a, b) => (b.handler_level ?? 0) - (a.handler_level ?? 0));
    } else if (sortKey === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return sorted;
  }, [rows, levelFilter, search, sortKey]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">핸들러 목록</h2>
        <p className="mt-1 text-sm text-gray-500">총 {filtered.length}명</p>
      </div>

      {/* 레벨 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLevelFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            levelFilter === 'all'
              ? 'bg-[#03C75A] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {([1, 2, 3, 4, 5, 6, 7] as HandlerLevelKey[]).map((lv) => (
          <button
            key={lv}
            onClick={() => setLevelFilter(String(lv))}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              levelFilter === String(lv)
                ? 'bg-[#03C75A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {HANDLER_LEVELS[lv].icon} Lv.{lv}
          </button>
        ))}
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름으로 검색"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-64"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-36"
        >
          <option value="level">레벨순</option>
          <option value="name">이름순</option>
          <option value="created_at">가입일순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
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
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">레벨</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const lv = levelLabel(r.handler_level);
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-0.5 text-xs font-medium text-[#03C75A]">
                          {lv.icon} {lv.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.region ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{r.email}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => {
              const lv = levelLabel(r.handler_level);
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-0.5 text-xs font-medium text-[#03C75A]">
                      {lv.icon} {lv.text}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">{r.email}</div>
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{r.region ?? '지역 없음'}</span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
