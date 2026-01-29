import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { HANDLER_LEVELS } from '../../constants/levels';
import { CONSULTATION_STATUS } from '../../constants/consultationStatus';
import type { ConsultationStatusKey } from '../../constants/consultationStatus';
import type { HandlerLevelKey } from '../../constants/levels';
import AttendanceCard from '../../components/attendance/AttendanceCard';

interface RecentConsultation {
  id: string;
  store_name: string;
  status: ConsultationStatusKey;
  created_at: string;
}

interface NoticeRow {
  id: string;
  title: string;
  created_at: string;
}

interface StoryRow {
  id: string;
  title: string;
  author_name: string;
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

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
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
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function HandlerDashboard() {
  const { user } = useAuthStore();

  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const level = (user?.handler_level ?? 1) as HandlerLevelKey;
  const levelInfo = HANDLER_LEVELS[level];

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const uid = user!.id;

      // 통계 카운트 3개 병렬
      const [todayRes, weekRes, monthRes, recentRes, noticeRes, storyRes] =
        await Promise.all([
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('handler_id', uid)
            .gte('created_at', startOfDay()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('handler_id', uid)
            .gte('created_at', startOfWeek()),
          supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('handler_id', uid)
            .gte('created_at', startOfMonth()),
          supabase
            .from('consultations')
            .select('id, store_name, status, created_at')
            .eq('handler_id', uid)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('notices')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('success_stories')
            .select('id, title, author_name, created_at')
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

      setTodayCount(todayRes.count ?? 0);
      setWeekCount(weekRes.count ?? 0);
      setMonthCount(monthRes.count ?? 0);
      setRecentConsultations((recentRes.data as RecentConsultation[]) ?? []);
      setNotices((noticeRes.data as NoticeRow[]) ?? []);
      setStories((storyRes.data as StoryRow[]) ?? []);
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
    <div className="space-y-6">
      {/* 0. 출석 체크 */}
      <AttendanceCard />

      {/* 1. 환영 메시지 + 빠른 상담 신청 */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            안녕하세요, {user?.name}님! 👋
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="text-lg">{levelInfo.icon}</span>{' '}
            Lv.{level} {levelInfo.name} · {levelInfo.description}
          </p>
        </div>
        <Link
          to="/handler/consultation/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#03C75A] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#02b350]"
        >
          + 상담 신청
        </Link>
      </div>

      {/* 2. 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: '오늘 상담', value: todayCount },
          { label: '이번 주 상담', value: weekCount },
          { label: '이번 달 상담', value: monthCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#03C75A]">
              {stat.value}
              <span className="ml-1 text-base font-normal text-gray-400">건</span>
            </p>
          </div>
        ))}
      </div>

      {/* 3 + 4 + 5: 그리드 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 3. 최근 내 상담 */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">최근 내 상담</h3>
            <Link
              to="/handler/consultations"
              className="text-sm text-[#03C75A] hover:underline"
            >
              전체보기
            </Link>
          </div>

          {recentConsultations.length === 0 ? (
            <p className="mt-6 text-center text-sm text-gray-400">
              아직 상담이 없습니다.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {recentConsultations.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {c.store_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? STATUS_BADGE.pending}`}
                    >
                      {CONSULTATION_STATUS[c.status]?.label ?? c.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(c.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 4 + 5: 사이드 */}
        <div className="space-y-6">
          {/* 4. 최근 공지사항 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">공지사항</h3>
              <Link
                to="/notice"
                className="text-sm text-[#03C75A] hover:underline"
              >
                더보기
              </Link>
            </div>

            {notices.length === 0 ? (
              <p className="mt-4 text-center text-sm text-gray-400">
                공지사항이 없습니다.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {notices.map((n) => (
                  <li key={n.id}>
                    <Link
                      to="/notice"
                      className="block truncate text-sm text-gray-700 hover:text-[#03C75A]"
                    >
                      {n.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 5. 최근 성공 후기 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">성공 후기</h3>
              <Link
                to="/success-stories"
                className="text-sm text-[#03C75A] hover:underline"
              >
                더보기
              </Link>
            </div>

            {stories.length === 0 ? (
              <p className="mt-4 text-center text-sm text-gray-400">
                후기가 없습니다.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {stories.map((s) => (
                  <li key={s.id} className="text-sm">
                    <Link
                      to="/success-stories"
                      className="block truncate text-gray-700 hover:text-[#03C75A]"
                    >
                      {s.title}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {s.author_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
