import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface AttendanceCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  dates: string[]; // initial month dates
  streak: number;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export default function AttendanceCalendar({ isOpen, onClose, dates: initialDates, streak }: AttendanceCalendarProps) {
  const { user } = useAuthStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set(initialDates));
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const fetchMonth = async (y: number, m: number) => {
    if (!user) return;
    setLoading(true);
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const nextM = new Date(y, m + 1, 1);
    const end = `${nextM.getFullYear()}-${String(nextM.getMonth() + 1).padStart(2, '0')}-01`;

    const { data } = await supabase
      .from('attendance')
      .select('check_date')
      .eq('user_id', user.id)
      .gte('check_date', start)
      .lt('check_date', end);

    setCheckedDates(new Set((data ?? []).map((r) => r.check_date as string)));
    setLoading(false);
  };

  const goMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setYear(newYear);
    setMonth(newMonth);
    fetchMonth(newYear, newMonth);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthCheckedCount = checkedDates.size;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">출석 달력</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 월 네비게이션 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => goMonth(-1)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-gray-900">{year}년 {month + 1}월</p>
          <button onClick={() => goMonth(1)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* 달력 */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#03C75A] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const checked = checkedDates.has(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm mx-auto ${
                    checked
                      ? 'bg-[#03C75A] font-semibold text-white'
                      : isToday
                        ? 'border-2 border-[#03C75A] font-semibold text-[#03C75A]'
                        : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        )}

        {/* 요약 */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <div className="text-center">
            <p className="text-xs text-gray-400">이번 달 출석</p>
            <p className="text-lg font-bold text-[#03C75A]">{monthCheckedCount}일</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">연속 출석</p>
            <p className="text-lg font-bold text-[#03C75A]">{streak}일</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
