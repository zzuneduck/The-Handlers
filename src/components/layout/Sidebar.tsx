import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES } from '../../constants/roles';
import type { Role } from '../../types';

interface MenuItem {
  label: string;
  path: string;
}

const MENU_ITEMS: Record<Role, MenuItem[]> = {
  super_admin: [
    { label: '대시보드', path: '/admin' },
    { label: '회원 관리', path: '/admin/users' },
    { label: '레벨 관리', path: '/admin/levels' },
    { label: '팀 관리', path: '/admin/teams' },
    { label: '상담 관리', path: '/admin/consultations' },
    { label: '하드웨어 관리', path: '/admin/hardware' },
    { label: '공지 관리', path: '/admin/notices' },
    { label: '권한 설정', path: '/admin/permissions' },
    { label: '통계', path: '/admin/statistics' },
  ],
  sub_admin: [
    { label: '대시보드', path: '/admin' },
    { label: '회원 관리', path: '/admin/users' },
    { label: '레벨 관리', path: '/admin/levels' },
    { label: '팀 관리', path: '/admin/teams' },
    { label: '상담 관리', path: '/admin/consultations' },
    { label: '하드웨어 관리', path: '/admin/hardware' },
    { label: '공지 관리', path: '/admin/notices' },
    { label: '통계', path: '/admin/statistics' },
  ],
  payn_staff: [
    { label: '대시보드', path: '/payn' },
    { label: '상담 목록', path: '/payn/consultations' },
    { label: 'PayN 질의응답', path: '/payn-manual' },
    { label: '통계', path: '/payn/statistics' },
    { label: '랭킹', path: '/payn/ranking' },
  ],
  geotech_staff: [
    { label: '대시보드', path: '/geotech' },
    { label: '하드웨어 목록', path: '/geotech/hardware' },
    { label: '설치 일정', path: '/geotech/schedule' },
    { label: '통계', path: '/geotech/statistics' },
    { label: '랭킹', path: '/geotech/ranking' },
  ],
  handler: [
    { label: '대시보드', path: '/handler' },
    { label: '상담 신청', path: '/handler/consultation/new' },
    { label: '내 상담', path: '/handler/consultations' },
    { label: '영업 기록', path: '/handler/sales/new' },
    { label: '내 영업', path: '/handler/sales' },
    { label: '매장 검색', path: '/handler/stores' },
    { label: '핸들러 목록', path: '/handler/handlers' },
    { label: '내 프로필', path: '/handler/profile' },
    { label: 'PayN 질의응답', path: '/payn-manual' },
    { label: '통계', path: '/handler/statistics' },
  ],
};

const COMMON_MENU: MenuItem[] = [
  { label: '실시간 전광판', path: '/live' },
  { label: '랭킹', path: '/ranking' },
  { label: '공지사항', path: '/notice' },
  { label: 'Q&A', path: '/qna' },
  { label: '성공 후기', path: '/success-stories' },
  { label: '자유게시판', path: '/free-board' },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  if (!user) return null;

  const role = user.role as Role;
  const items = MENU_ITEMS[role];
  const basePath = USER_ROLES[role].dashboard;

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-sidebar text-white">
      <div className="border-b border-sidebar-dark px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-naver">메뉴</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === basePath}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-naver text-white font-medium shadow-md'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div className="my-3 border-t border-white/10" />
        <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">공통</p>
        {COMMON_MENU.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-naver text-white font-medium shadow-md'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
