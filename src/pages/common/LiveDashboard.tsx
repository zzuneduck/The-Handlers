import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ACTIVITY_TYPES } from '../../constants/activityTypes';
import { useRealtimeActivities } from '../../hooks/useRealtimeActivities';
import { soundManager } from '../../lib/soundManager';

/* ───── types ───── */
interface RankRow {
  handler_name: string;
  count: number;
}

/* ───── helpers ───── */
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 10) return '방금 전';
  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function startOfDay() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function startOfWeek() {
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d.toISOString();
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString();
}

/* ───── component ───── */
export default function LiveDashboard() {
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [ranking, setRanking] = useState<RankRow[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 실시간 활동 피드 (Supabase Realtime)
  const { activities } = useRealtimeActivities(15);
  const prevCountRef = useRef(0);

  // 새 활동 도착 시 사운드
  useEffect(() => {
    if (activities.length === 0) return;
    if (prevCountRef.current === 0) {
      // 최초 로드 시에는 사운드 안 냄
      prevCountRef.current = activities.length;
      return;
    }
    if (activities.length > prevCountRef.current) {
      const newest = activities[0];
      if (newest?.type === 'contract_success') {
        soundManager.play('success');
      } else {
        soundManager.play('notification');
      }
    }
    prevCountRef.current = activities.length;
  }, [activities]);

  /* ── fetch stats ── */
  const fetchStats = useCallback(async () => {
    const [todayRes, weekRes, monthRes, rankRes] = await Promise.all([
      supabase.from('consultations').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay()),
      supabase.from('consultations').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek()),
      supabase.from('consultations').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth()),
      supabase.from('consultations').select('handler_name, status').eq('status', 'contracted').gte('created_at', startOfMonth()),
    ]);

    setTodayCount(todayRes.count ?? 0);
    setWeekCount(weekRes.count ?? 0);
    setMonthCount(monthRes.count ?? 0);

    // 랭킹 집계
    const map = new Map<string, number>();
    ((rankRes.data as { handler_name: string }[]) ?? []).forEach((r) => {
      map.set(r.handler_name, (map.get(r.handler_name) ?? 0) + 1);
    });
    const sorted = [...map.entries()]
      .map(([handler_name, count]) => ({ handler_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    setRanking(sorted);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // 통계 + timeAgo 갱신 (30초마다)
  useEffect(() => {
    const id = setInterval(() => {
      fetchStats();
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // suppress unused warning
  void tick;

  /* ── fullscreen ── */
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  /* ── medal helper ── */
  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? '';

  /* ───── render ───── */
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6 lg:p-8 -m-6 selection:bg-[#03C75A]/30"
    >
      {/* 1. 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          <span className="text-[#03C75A] drop-shadow-[0_0_8px_#03C75A]">🏆</span>{' '}
          THE HANDLERS{' '}
          <span className="text-[#03C75A] drop-shadow-[0_0_8px_#03C75A]">실시간 현황</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#03C75A] shadow-[0_0_6px_#03C75A]" />
            LIVE
          </span>
          <button
            onClick={toggleFullscreen}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 backdrop-blur hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? '축소' : '전체화면'}
          </button>
        </div>
      </div>

      {/* 2. 통계 카드 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: '오늘', value: todayCount },
          { label: '이번 주', value: weekCount },
          { label: '이번 달', value: monthCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#03C75A]/20 bg-[#03C75A]/5 p-5 shadow-[0_0_20px_rgba(3,199,90,0.08)] backdrop-blur"
          >
            <p className="text-xs uppercase tracking-widest text-gray-500">{s.label}</p>
            <p className="mt-1 text-4xl font-black tabular-nums text-[#03C75A] drop-shadow-[0_0_12px_#03C75A]">
              {s.value}
              <span className="ml-1 text-base font-normal text-gray-500">건</span>
            </p>
          </div>
        ))}
      </div>

      {/* 3 + 4 그리드 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 3. 실시간 피드 */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
            실시간 피드
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[#03C75A] shadow-[0_0_6px_#03C75A]" />
          </h2>

          {activities.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">아직 활동이 없습니다.</p>
          ) : (
            <ul className="space-y-1">
              {activities.map((a) => {
                const info = ACTIVITY_TYPES[a.type] ?? { icon: '📌', label: a.type };
                return (
                  <li
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5 ${
                      a.isNew ? 'animate-slideIn' : ''
                    }`}
                  >
                    <span className="mt-0.5 text-xl leading-none">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">
                        <span className="font-semibold text-white">{a.user_name}</span>{' '}
                        {a.description}
                      </p>
                      {a.store_name && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {a.store_name}
                          {a.region ? ` · ${a.region}` : ''}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-600">{timeAgo(a.created_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                      {info.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 4. TOP 3 랭킹 */}
        <div className="rounded-xl border border-[#03C75A]/20 bg-[#03C75A]/5 p-5 shadow-[0_0_24px_rgba(3,199,90,0.06)] backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
            이달의 TOP 3
          </h2>

          {ranking.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">데이터가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {ranking.map((r, i) => (
                <li
                  key={r.handler_name}
                  className={`flex items-center gap-3 rounded-xl p-4 ${
                    i === 0
                      ? 'border border-[#03C75A]/30 bg-[#03C75A]/10 shadow-[0_0_16px_rgba(3,199,90,0.12)]'
                      : 'border border-white/5 bg-white/[0.03]'
                  }`}
                >
                  <span className="text-2xl">{medal(i)}</span>
                  <div className="flex-1">
                    <p className={`font-semibold ${i === 0 ? 'text-[#03C75A]' : 'text-gray-200'}`}>
                      {r.handler_name}
                    </p>
                  </div>
                  <span className={`text-2xl font-black tabular-nums ${i === 0 ? 'text-[#03C75A] drop-shadow-[0_0_8px_#03C75A]' : 'text-gray-300'}`}>
                    {r.count}
                    <span className="ml-0.5 text-xs font-normal text-gray-500">건</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* keyframe animations */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
