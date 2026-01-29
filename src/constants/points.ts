export const POINT_RULES = {
  DAILY_ATTENDANCE: { points: 10, label: '일일 출석' },
  STREAK_7: { points: 50, label: '7일 연속 출석 보너스' },
  STREAK_14: { points: 100, label: '14일 연속 출석 보너스' },
  STREAK_30: { points: 300, label: '30일 연속 출석 보너스' },
} as const;

export type PointRuleKey = keyof typeof POINT_RULES;
