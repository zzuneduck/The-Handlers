export const HARDWARE_STATUS = {
  received: { label: '접수', color: 'gray' },
  scheduled: { label: '설치예정', color: 'blue' },
  completed: { label: '설치완료', color: 'green' },
} as const;

export type HardwareStatusKey = keyof typeof HARDWARE_STATUS;
