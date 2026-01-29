import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getAttendanceInfo, checkIn } from '../../lib/attendanceService';
import type { AttendanceInfo } from '../../lib/attendanceService';
import AttendanceCalendar from './AttendanceCalendar';

export default function AttendanceCard() {
  const { user } = useAuthStore();
  const [info, setInfo] = useState<AttendanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getAttendanceInfo(user.id).then((data) => {
      setInfo(data);
      setLoading(false);
    });
  }, [user]);

  const handleCheckIn = async () => {
    if (!user || checking) return;
    setChecking(true);
    setResult(null);

    const res = await checkIn(user.id);

    if (res.success) {
      const msg = res.bonusLabel
        ? `+${res.pointsEarned}P (${res.bonusLabel})`
        : `+${res.pointsEarned}P 출석 완료!`;
      setResult({ type: 'success', text: msg });
      // 정보 갱신
      const updated = await getAttendanceInfo(user.id);
      setInfo(updated);
    } else {
      setResult({ type: 'error', text: res.error ?? '출석 실패' });
    }

    setChecking(false);
  };

  if (loading || !info) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex h-20 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#03C75A] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* 왼쪽: 출석 정보 */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f9ef] text-2xl">
              {info.checkedInToday ? '✅' : '📅'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {info.checkedInToday ? '오늘 출석 완료!' : '오늘 출석하셨나요?'}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                연속 {info.currentStreak}일 · 보유 {info.totalPoints.toLocaleString()}P
              </p>
            </div>
          </div>

          {/* 오른쪽: 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={() => setCalendarOpen(true)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              출석 달력
            </button>
            {!info.checkedInToday && (
              <button
                onClick={handleCheckIn}
                disabled={checking}
                className="rounded-lg bg-[#03C75A] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#02b350] disabled:opacity-50"
              >
                {checking ? '출석 중...' : '출석하기'}
              </button>
            )}
          </div>
        </div>

        {/* 결과 메시지 */}
        {result && (
          <div
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              result.type === 'success' ? 'bg-[#e6f9ef] text-[#03C75A]' : 'bg-red-50 text-red-600'
            }`}
          >
            {result.text}
          </div>
        )}
      </div>

      <AttendanceCalendar
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        dates={info.monthlyDates}
        streak={info.currentStreak}
      />
    </>
  );
}
