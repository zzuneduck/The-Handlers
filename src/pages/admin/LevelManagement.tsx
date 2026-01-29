import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
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
  checked?: boolean;
}

const LEVEL_OPTIONS: HandlerLevelKey[] = [1, 2, 3, 4, 5, 6, 7];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function LevelManagement() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<HandlerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [batchLevel, setBatchLevel] = useState<HandlerLevelKey>(1);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, handler_level, region, created_at')
      .eq('role', 'handler')
      .order('handler_level', { ascending: false });

    if (error) {
      console.error('[LevelManagement]', error.message);
    }
    setRows(((data as HandlerRow[]) ?? []).map((r) => ({ ...r, checked: false })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = rows.filter((r) => {
    if (levelFilter !== 'all' && r.handler_level !== Number(levelFilter)) return false;
    if (search.trim()) {
      return r.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const checkedCount = filtered.filter((r) => r.checked).length;

  const toggleCheck = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));
  };

  const toggleAll = () => {
    const allChecked = filtered.every((r) => r.checked);
    const filteredIds = new Set(filtered.map((r) => r.id));
    setRows((prev) =>
      prev.map((r) => (filteredIds.has(r.id) ? { ...r, checked: !allChecked } : r)),
    );
  };

  const changeLevel = async (id: string, oldLevel: HandlerLevelKey | null, newLevel: HandlerLevelKey) => {
    setUpdating(id);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ handler_level: newLevel })
      .eq('id', id);

    if (error) {
      setMessage({ type: 'error', text: `변경 실패: ${error.message}` });
    } else {
      // 이력 저장 (테이블 없으면 무시)
      await supabase.from('level_history').insert({
        handler_id: id,
        old_level: oldLevel ?? 0,
        new_level: newLevel,
        changed_by: user?.id,
      }).then(() => {});

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, handler_level: newLevel } : r)),
      );
      setMessage({ type: 'success', text: '레벨이 변경되었습니다.' });
    }
    setUpdating(null);
  };

  const batchChange = async () => {
    const targets = filtered.filter((r) => r.checked);
    if (targets.length === 0) return;
    if (!confirm(`선택한 ${targets.length}명의 레벨을 Lv.${batchLevel}로 변경하시겠습니까?`)) return;

    setBatchUpdating(true);
    setMessage(null);

    const ids = targets.map((r) => r.id);
    const { error } = await supabase
      .from('profiles')
      .update({ handler_level: batchLevel })
      .in('id', ids);

    if (error) {
      setMessage({ type: 'error', text: `일괄 변경 실패: ${error.message}` });
    } else {
      // 이력 일괄 저장
      const historyRows = targets.map((r) => ({
        handler_id: r.id,
        old_level: r.handler_level ?? 0,
        new_level: batchLevel,
        changed_by: user?.id,
      }));
      await supabase.from('level_history').insert(historyRows).then(() => {});

      setRows((prev) =>
        prev.map((r) => (ids.includes(r.id) ? { ...r, handler_level: batchLevel, checked: false } : r)),
      );
      setMessage({ type: 'success', text: `${targets.length}명의 레벨이 Lv.${batchLevel}로 변경되었습니다.` });
    }
    setBatchUpdating(false);
  };

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
        <h2 className="text-2xl font-bold text-gray-900">핸들러 레벨 관리</h2>
        <p className="mt-1 text-sm text-gray-500">총 {filtered.length}명</p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${
            message.type === 'success' ? 'bg-[#e6f9ef] text-[#03C75A]' : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 레벨 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLevelFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            levelFilter === 'all' ? 'bg-[#03C75A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {LEVEL_OPTIONS.map((lv) => (
          <button
            key={lv}
            onClick={() => setLevelFilter(String(lv))}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              levelFilter === String(lv) ? 'bg-[#03C75A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {HANDLER_LEVELS[lv].icon} Lv.{lv}
          </button>
        ))}
      </div>

      {/* 검색 + 일괄 변경 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름으로 검색"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#03C75A] focus:outline-none focus:ring-2 focus:ring-[#03C75A]/20 sm:w-64"
        />

        {checkedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{checkedCount}명 선택</span>
            <select
              value={batchLevel}
              onChange={(e) => setBatchLevel(Number(e.target.value) as HandlerLevelKey)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-[#03C75A] focus:outline-none"
            >
              {LEVEL_OPTIONS.map((lv) => (
                <option key={lv} value={lv}>
                  {HANDLER_LEVELS[lv].icon} Lv.{lv} {HANDLER_LEVELS[lv].name}
                </option>
              ))}
            </select>
            <button
              onClick={batchChange}
              disabled={batchUpdating}
              className="rounded-lg bg-[#03C75A] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#02B150] disabled:opacity-50"
            >
              {batchUpdating ? '변경 중...' : '일괄 변경'}
            </button>
          </div>
        )}
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
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && filtered.every((r) => r.checked)}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">현재 레벨</th>
                  <th className="px-4 py-3">레벨 변경</th>
                  <th className="px-4 py-3">지역</th>
                  <th className="px-4 py-3">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => {
                  const lv = r.handler_level;
                  const info = lv ? HANDLER_LEVELS[lv] : null;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${updating === r.id ? 'opacity-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={r.checked ?? false}
                          onChange={() => toggleCheck(r.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {info ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-0.5 text-xs font-medium text-[#03C75A]">
                            {info.icon} Lv.{lv} {info.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lv ?? 1}
                          onChange={(e) => changeLevel(r.id, lv, Number(e.target.value) as HandlerLevelKey)}
                          disabled={updating === r.id}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#03C75A] focus:outline-none"
                        >
                          {LEVEL_OPTIONS.map((l) => (
                            <option key={l} value={l}>
                              {HANDLER_LEVELS[l].icon} Lv.{l} {HANDLER_LEVELS[l].name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.region ?? '-'}</td>
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
              const lv = r.handler_level;
              const info = lv ? HANDLER_LEVELS[lv] : null;
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${updating === r.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={r.checked ?? false}
                      onChange={() => toggleCheck(r.id)}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        {info && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f9ef] px-2.5 py-0.5 text-xs font-medium text-[#03C75A]">
                            {info.icon} Lv.{lv}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{r.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <select
                      value={lv ?? 1}
                      onChange={(e) => changeLevel(r.id, lv, Number(e.target.value) as HandlerLevelKey)}
                      disabled={updating === r.id}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-[#03C75A] focus:outline-none"
                    >
                      {LEVEL_OPTIONS.map((l) => (
                        <option key={l} value={l}>
                          {HANDLER_LEVELS[l].icon} Lv.{l} {HANDLER_LEVELS[l].name}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-400">
                      <span>{r.region ?? '지역 없음'}</span>
                      <span className="mx-1">·</span>
                      <span>{formatDate(r.created_at)}</span>
                    </div>
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
