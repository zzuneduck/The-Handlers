export const USER_ROLES = {
  super_admin: { label: '슈퍼관리자', dashboard: '/admin' },
  sub_admin: { label: '부관리자', dashboard: '/admin' },
  payn_staff: { label: 'PayN 직원', dashboard: '/payn' },
  geotech_staff: { label: '지오테크넷 직원', dashboard: '/geotech' },
  handler: { label: '핸들러', dashboard: '/handler' },
} as const;

export type RoleKey = keyof typeof USER_ROLES;
