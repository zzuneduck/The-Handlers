import { supabase } from './supabase';
import { POINT_RULES } from '../constants/points';

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface AttendanceInfo {
  checkedInToday: boolean;
  currentStreak: number;
  totalPoints: number;
  monthlyDates: string[]; // YYYY-MM-DD[]
}

/** 오늘 출석 여부 + 연속일수 + 포인트 + 이번달 출석 날짜 */
export async function getAttendanceInfo(userId: string): Promise<AttendanceInfo> {
  const today = todayDateStr();
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

  const [todayRes, streakRes, pointsRes, monthRes] = await Promise.all([
    // 오늘 출석 여부
    supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('check_date', today),
    // 연속 출석일 계산 - 최근 60일 조회
    supabase
      .from('attendance')
      .select('check_date')
      .eq('user_id', userId)
      .order('check_date', { ascending: false })
      .limit(60),
    // 총 포인트
    supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', userId)
      .single(),
    // 이번달 출석 날짜
    supabase
      .from('attendance')
      .select('check_date')
      .eq('user_id', userId)
      .gte('check_date', monthStart)
      .lt('check_date', monthEnd)
      .order('check_date', { ascending: true }),
  ]);

  const checkedInToday = (todayRes.count ?? 0) > 0;

  // 연속일수 계산
  let currentStreak = 0;
  if (streakRes.data) {
    const dates = streakRes.data.map((r) => r.check_date as string).sort().reverse();
    const todayDate = new Date(today);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      if (dates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const totalPoints = pointsRes.data?.total_points ?? 0;
  const monthlyDates = (monthRes.data ?? []).map((r) => r.check_date as string);

  return { checkedInToday, currentStreak, totalPoints, monthlyDates };
}

/** 출석 체크 (하루 1회) */
export async function checkIn(userId: string): Promise<{ success: boolean; pointsEarned: number; bonusLabel?: string; error?: string }> {
  const today = todayDateStr();

  // 이미 출석했는지 확인
  const { count } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('check_date', today);

  if ((count ?? 0) > 0) {
    return { success: false, pointsEarned: 0, error: '이미 오늘 출석했습니다.' };
  }

  // 출석 기록 삽입
  const { error: insertErr } = await supabase
    .from('attendance')
    .insert({ user_id: userId, check_date: today });

  if (insertErr) {
    return { success: false, pointsEarned: 0, error: insertErr.message };
  }

  // 연속일수 계산 (오늘 포함)
  const { data: recentDates } = await supabase
    .from('attendance')
    .select('check_date')
    .eq('user_id', userId)
    .order('check_date', { ascending: false })
    .limit(60);

  let streak = 0;
  if (recentDates) {
    const dates = recentDates.map((r) => r.check_date as string).sort().reverse();
    const todayDate = new Date(today);
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      if (dates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
  }

  // 기본 출석 포인트
  let totalEarned = POINT_RULES.DAILY_ATTENDANCE.points;
  let bonusLabel: string | undefined;

  // 연속 출석 보너스 체크
  if (streak === 30) {
    totalEarned += POINT_RULES.STREAK_30.points;
    bonusLabel = POINT_RULES.STREAK_30.label;
  } else if (streak === 14) {
    totalEarned += POINT_RULES.STREAK_14.points;
    bonusLabel = POINT_RULES.STREAK_14.label;
  } else if (streak === 7) {
    totalEarned += POINT_RULES.STREAK_7.points;
    bonusLabel = POINT_RULES.STREAK_7.label;
  }

  // 포인트 기록 + 잔액 업데이트
  await supabase.from('point_history').insert({
    user_id: userId,
    amount: totalEarned,
    reason: bonusLabel ? `${POINT_RULES.DAILY_ATTENDANCE.label} + ${bonusLabel}` : POINT_RULES.DAILY_ATTENDANCE.label,
  });

  // upsert user_points
  const { data: existing } = await supabase
    .from('user_points')
    .select('total_points')
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase
      .from('user_points')
      .update({ total_points: existing.total_points + totalEarned })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_points')
      .insert({ user_id: userId, total_points: totalEarned });
  }

  return { success: true, pointsEarned: totalEarned, bonusLabel };
}
