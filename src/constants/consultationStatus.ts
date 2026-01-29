export const CONSULTATION_STATUS = {
  pending: { label: '신청', color: 'gray' },
  consulting: { label: '상담중', color: 'blue' },
  contracted: { label: '계약완료', color: 'green' },
  failed: { label: '계약실패', color: 'red' },
} as const;

export type ConsultationStatusKey = keyof typeof CONSULTATION_STATUS;
