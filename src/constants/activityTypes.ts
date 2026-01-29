export const ACTIVITY_TYPES = {
  contract_success: { label: '계약성공', icon: '🎉', color: 'green' },
  consultation_new: { label: '상담신청', icon: '📝', color: 'blue' },
  install_complete: { label: '설치완료', icon: '🖥️', color: 'purple' },
  new_member: { label: '신규가입', icon: '👋', color: 'cyan' },
  level_up: { label: '레벨업', icon: '🏢', color: 'gold' },
  goal_achieved: { label: '목표달성', icon: '🏆', color: 'orange' },
  consecutive_contract: { label: '연속계약', icon: '🔥', color: 'red' },
} as const;

export type ActivityTypeKey = keyof typeof ACTIVITY_TYPES;
