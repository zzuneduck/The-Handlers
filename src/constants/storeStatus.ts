export const STORE_STATUS = {
  active: { label: '영업중', color: 'blue' },
  contracted: { label: '계약완료', color: 'green' },
  pending: { label: '보류', color: 'yellow' },
  failed: { label: '실패', color: 'red' },
} as const;

export type StoreStatusKey = keyof typeof STORE_STATUS;
