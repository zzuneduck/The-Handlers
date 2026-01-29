import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import ConsultationDetailModal from '../../components/consultation/ConsultationDetailModal';
import type { ConsultationDetail } from '../../components/consultation/ConsultationDetailModal';

interface ScheduleRow {
  id: string;
  store_name: string;
  owner_phone: string | null;
  region: string;
  sub_region: string | null;
  hardware_type: string | null;
  hardware_qty: number | null;
  hardware_status: string | null;
  preferred_install_date: string | null;
  scheduled_install_date: string | null;
  status: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }
  // 끝을 7의 배수로 맞춤
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export default function InstallSchedule() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ConsultationDetail | null>(null);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from('consultations')
      .select(
        'id, store_name, owner_phone, region, sub_region, hardware_type, hardware_qty, hardware_status, preferred_install_date, scheduled_install_date, status',
      )
      .not('hardware_status', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InstallSchedule]', error.message);
    }
    setRows((data as ScheduleRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // 날짜별 매핑
  const dateMap = useMemo(() => {
    const map: Record<string, { preferred: ScheduleRow[]; scheduled: ScheduleRow[] }> = {};

    const ensure = (key: string) => {
      if (!map[key]) map[key] = { preferred: [], scheduled: [] };
    };

    for (const r of rows) {
      if (r.preferred_install_date) {
        const key = r.preferred_install_date.slice(0, 10);
        ensure(key);
        map[key].preferred.push(r);
      }
      if (r.scheduled_install_date) {
        const key = r.scheduled_install_date.slice(0, 10);
        ensure(key);
        map[key].scheduled.push(r);
      }
    }

    return map;
  }, [rows]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const todayKey = toDateKey(new Date());

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const handleDateClick = (dateKey: string) => {
    if (dateMap[dateKey]) {
      setSelectedDate(dateKey);
    }
  };

  const handleDetailClick = async (id: string) => {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('[InstallSchedule detail]', error.message);
      return;
    }
    setDetailData(data as ConsultationDetail);
  };

  // 선택한 날짜의 설치 건
  const selectedItems = selectedDate ? dateMap[selectedDate] : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#03C75A] border-t-transparent" />
      </div>
    );
  }

  if (user?.role === 'geotech_staff' && !user?.is_approved) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
          <p className="text-lg font-semibold text-yellow-700">관리자 승인 대기 중입니다</p>
          <p className="mt-2 text-sm text-yellow-600">승인이 완료되면 이 페이지를 이용할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  // 이번 달 설치 건수 통계
  const monthPrefix = `${currentYear}-${pad(currentMonth + 1)}`;
  const monthPreferredCount = rows.filter(
    (r) => r.preferred_install_date?.startsWith(monthPrefix),
  ).length;
  const monthScheduledCount = rows.filter(
    (r) => r.scheduled_install_date?.startsWith(monthPrefix),
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">설치 일정</h2>
        <p className="mt-1 text-sm text-gray-500">
          총 {rows.length}건의 하드웨어 설치 건
        </p>
      </div>

      {/* 월간 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">전체 설치 건</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">이번 달 희망일</p>
          <p className="mt-1 text-2xl font-bold text-[#03C75A]">{monthPreferredCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">이번 달 확정일</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{monthScheduledCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">범례</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#03C75A]" /> 희망일
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" /> 확정일
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={goToPrevMonth}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">
            {currentYear}년 {currentMonth + 1}월
          </h3>
          <button
            onClick={goToToday}
            className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            오늘
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 캘린더 그리드 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="border-b border-r border-gray-100 bg-gray-50/50 p-2 min-h-[80px]" />;
            }

            const dateKey = toDateKey(day);
            const isToday = dateKey === todayKey;
            const dayOfWeek = day.getDay();
            const entry = dateMap[dateKey];
            const hasPreferred = entry && entry.preferred.length > 0;
            const hasScheduled = entry && entry.scheduled.length > 0;
            const totalCount = (entry?.preferred.length ?? 0) + (entry?.scheduled.length ?? 0);

            return (
              <div
                key={dateKey}
                onClick={() => handleDateClick(dateKey)}
                className={`border-b border-r border-gray-100 p-2 min-h-[80px] transition-colors ${
                  entry ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${isToday ? 'bg-[#03C75A]/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday
                        ? 'bg-[#03C75A] font-bold text-white'
                        : dayOfWeek === 0
                          ? 'text-red-400'
                          : dayOfWeek === 6
                            ? 'text-blue-400'
                            : 'text-gray-700'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  {totalCount > 0 && (
                    <span className="text-[10px] font-medium text-gray-400">{totalCount}건</span>
                  )}
                </div>

                {/* 점 표시 */}
                {(hasPreferred || hasScheduled) && (
                  <div className="mt-1 flex items-center gap-1">
                    {hasPreferred && (
                      <div className="flex items-center gap-0.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#03C75A]" />
                        <span className="text-[10px] text-gray-400">{entry.preferred.length}</span>
                      </div>
                    )}
                    {hasScheduled && (
                      <div className="flex items-center gap-0.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] text-gray-400">{entry.scheduled.length}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 날짜 클릭 모달 */}
      {selectedDate && selectedItems && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDate.replace(/-/g, '.')} 설치 일정
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* 희망 설치일 */}
              {selectedItems.preferred.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#03C75A]" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      희망 설치일 ({selectedItems.preferred.length}건)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedItems.preferred.map((r) => (
                      <ScheduleCard
                        key={`pref-${r.id}`}
                        row={r}
                        onClick={() => handleDetailClick(r.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 확정 설치일 */}
              {selectedItems.scheduled.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      확정 설치일 ({selectedItems.scheduled.length}건)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {selectedItems.scheduled.map((r) => (
                      <ScheduleCard
                        key={`sched-${r.id}`}
                        row={r}
                        onClick={() => handleDetailClick(r.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="mt-5 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 상세 모달 (재사용) */}
      <ConsultationDetailModal
        consultation={detailData}
        isOpen={!!detailData}
        onClose={() => setDetailData(null)}
      />
    </div>
  );
}

function ScheduleCard({ row, onClick }: { row: ScheduleRow; onClick: () => void }) {
  const hwStatus: Record<string, { label: string; cls: string }> = {
    pending: { label: '대기', cls: 'bg-gray-100 text-gray-600' },
    ordered: { label: '발주완료', cls: 'bg-blue-100 text-blue-700' },
    shipping: { label: '배송중', cls: 'bg-orange-100 text-orange-700' },
    delivered: { label: '배송완료', cls: 'bg-[#e6f9ef] text-[#03C75A]' },
    installed: { label: '설치완료', cls: 'bg-[#e6f9ef] text-[#03C75A]' },
  };

  const statusInfo = row.hardware_status ? hwStatus[row.hardware_status] : null;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-900">{row.store_name}</p>
        {statusInfo && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
        )}
      </div>
      <div className="mt-1.5 space-y-0.5 text-sm text-gray-500">
        {row.owner_phone && <p>연락처: {row.owner_phone}</p>}
        <p>
          지역: {row.region}
          {row.sub_region ? ` ${row.sub_region}` : ''}
        </p>
        {row.hardware_type && (
          <p>
            하드웨어: {row.hardware_type}
            {row.hardware_qty != null ? ` ${row.hardware_qty}대` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
