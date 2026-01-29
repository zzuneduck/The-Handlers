import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { HANDLER_LEVELS } from '../../constants/levels';
import type { HandlerLevelKey } from '../../constants/levels';

interface RankEntry {
  handler_id: string;
  handler_name: string;
  handler_level: HandlerLevelKey;
  region: string | null;
  count: number;
}

type Period = 'month' | 'week' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: '이번 달' },
  { value: 'week', label: '이번 주' },
  { value: 'all', label: '전체' },
];

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const MEDAL = ['🥇', '🥈', '🥉'];

const PODIUM_BORDER = [
  'border-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.15)]',
  'border-[#C0C0C0] shadow-[0_0_12px_rgba(192,192,192,0.15)]',
  'border-[#CD7F32] shadow-[0_0_12px_rgba(205,127,50,0.15)]',
];

const PODIUM_COUNT_COLOR = [
  'text-[#FFD700]',
  'text-[#C0C0C0]',
  'text-[#CD7F32]',
];

export default function Ranking() {
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);

      let query = supabase
        .from('consultations')
        .select('handler_id')
        .eq('status', 'contracted');

      if (period === 'month') {
        query = query.gte('created_at', startOfMonth());
      } else if (period === 'week') {
        query = query.gte('created_at', startOfWeek());
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Ranking]', error.message);
        setLoading(false);
        return;
      }

      // handler_id로 그룹핑
      const countMap = new Map<string, number>();
      ((data ?? []) as { handler_id: string }[]).forEach((r) => {
        countMap.set(r.handler_id, (countMap.get(r.handler_id) ?? 0) + 1);
      });

      const handlerIds = [...countMap.keys()];

      if (handlerIds.length === 0) {
        setRanking([]);
        setLoading(false);
        return;
      }

      // profiles 조회
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, handler_level, region')
        .in('id', handlerIds);

      const profileMap = new Map<string, { name: string; handler_level: HandlerLevelKey; region: string | null }>();
      ((profiles ?? []) as { id: string; name: string; handler_level: number | null; region: string | null }[]).forEach((p) => {
        profileMap.set(p.id, {
          name: p.name,
          handler_level: (p.handler_level ?? 1) as HandlerLevelKey,
          region: p.region,
        });
      });

      const sorted = handlerIds
        .map((id) => {
          const profile = profileMap.get(id);
          return {
            handler_id: id,
            handler_name: profile?.name ?? '핸들러',
            handler_level: profile?.handler_level ?? (1 as HandlerLevelKey),
            region: profile?.region ?? null,
            count: countMap.get(id) ?? 0,
          };
        })
        .sort((a, b) => b.count - a.count);

      setRanking(sorted);
      setLoading(false);
    }

    fetchRanking();
  }, [period]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="mx-auto max-w-4xl">
      {/* 헤더 + 기간 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">핸들러 랭킹</h2>
          <p className="mt-1 text-sm text-gray-500">계약 완료 건수 기준</p>
        </div>

        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                period === o.value
                  ? 'bg-[#03C75A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <p className="text-gray-400">해당 기간에 계약 완료 건이 없습니다.</p>
        </div>
      ) : (
        <>
          {/* TOP 3 카드 */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {top3.map((r, i) => {
              const levelInfo = HANDLER_LEVELS[r.handler_level];
              return (
                <div
                  key={r.handler_id}
                  className={`relative rounded-xl border-2 bg-white p-5 text-center ${PODIUM_BORDER[i]}`}
                >
                  {/* 메달 */}
                  <span className="text-4xl">{MEDAL[i]}</span>

                  {/* 이름 */}
                  <p className="mt-2 text-lg font-bold text-gray-900">
                    {r.handler_name}
                  </p>

                  {/* 레벨 */}
                  <p className="mt-1 text-sm text-gray-500">
                    {levelInfo.icon} Lv.{r.handler_level} {levelInfo.name}
                  </p>

                  {/* 지역 */}
                  {r.region && (
                    <p className="mt-0.5 text-xs text-gray-400">{r.region}</p>
                  )}

                  {/* 건수 */}
                  <p className={`mt-3 text-3xl font-black tabular-nums ${PODIUM_COUNT_COLOR[i]}`}>
                    {r.count}
                    <span className="ml-1 text-sm font-normal text-gray-400">건</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* 4위부터 테이블 */}
          {rest.length > 0 && (
            <>
              {/* 데스크톱 */}
              <div className="mt-6 hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">순위</th>
                      <th className="px-4 py-3">이름</th>
                      <th className="px-4 py-3">레벨</th>
                      <th className="px-4 py-3">지역</th>
                      <th className="px-4 py-3 text-right">계약 건수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rest.map((r, i) => {
                      const rank = i + 4;
                      const levelInfo = HANDLER_LEVELS[r.handler_level];
                      return (
                        <tr key={r.handler_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-center font-semibold text-gray-500">
                            {rank}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {r.handler_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {levelInfo.icon} Lv.{r.handler_level}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {r.region ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#03C75A]">
                            {r.count}
                            <span className="ml-0.5 font-normal text-gray-400">건</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 */}
              <div className="mt-4 space-y-2 md:hidden">
                {rest.map((r, i) => {
                  const rank = i + 4;
                  const levelInfo = HANDLER_LEVELS[r.handler_level];
                  return (
                    <div
                      key={r.handler_id}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <span className="w-8 text-center text-lg font-bold text-gray-400">
                        {rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{r.handler_name}</p>
                        <p className="text-xs text-gray-500">
                          {levelInfo.icon} Lv.{r.handler_level} · {r.region ?? '지역 없음'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-[#03C75A]">
                        {r.count}
                        <span className="ml-0.5 text-xs font-normal text-gray-400">건</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
