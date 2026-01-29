export const HANDLER_LEVELS = {
  1: { icon: '🏕️', name: '텐트', description: '이제 시작!' },
  2: { icon: '🏠', name: '주택', description: '첫 발걸음' },
  3: { icon: '🏡', name: '빌라', description: '성장 중' },
  4: { icon: '🏢', name: '오피스텔', description: '실력자' },
  5: { icon: '🏨', name: '호텔', description: '전문가' },
  6: { icon: '🏰', name: '성', description: '마스터' },
  7: { icon: '🏛️', name: '궁전', description: '레전드' },
} as const;

export type HandlerLevelKey = keyof typeof HANDLER_LEVELS;
