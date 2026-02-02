import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../types';

interface MenuItem {
  label: string;
  path: string;
}

interface MenuGroup {
  group: string | null;
  items: MenuItem[];
}

const MENU_GROUPS: Record<Role, MenuGroup[]> = {
  handler: [
    { group: null, items: [
      { label: '영업 체크리스트', path: '/handler/checklist' },
      { label: '대시보드', path: '/handler' },
    ]},
    { group: '상담', items: [
      { label: '상담 신청', path: '/handler/consultation/new' },
      { label: '내 상담', path: '/handler/consultations' },
    ]},
    { group: '영업', items: [
      { label: '영업 기록', path: '/handler/sales/new' },
      { label: '내 영업', path: '/handler/sales' },
      { label: '매장 검색', path: '/handler/stores' },
    ]},
    { group: '정보', items: [
      { label: '핸들러 목록', path: '/handler/handlers' },
      { label: '랭킹', path: '/ranking' },
      { label: '통계', path: '/handler/statistics' },
      { label: '매장 지도', path: '/store-map' },
    ]},
    { group: '자료', items: [
      { label: 'PayN 질의응답', path: '/payn-manual' },
      { label: '공지사항', path: '/notice' },
    ]},
    { group: '커뮤니티', items: [
      { label: 'Q&A', path: '/qna' },
      { label: '성공 후기', path: '/success-stories' },
      { label: '자유게시판', path: '/free-board' },
    ]},
    { group: '기타', items: [
      { label: '실시간 전광판', path: '/live' },
      { label: '내 포인트', path: '/handler/points' },
      { label: '내 프로필', path: '/handler/profile' },
    ]},
  ],
  super_admin: [
    { group: null, items: [{ label: '대시보드', path: '/admin' }] },
    { group: '상담 관리', items: [
      { label: '전체 상담', path: '/admin/consultations' },
      { label: '하드웨어 관리', path: '/admin/hardware' },
    ]},
    { group: '회원 관리', items: [
      { label: '회원 목록', path: '/admin/users' },
      { label: '레벨 관리', path: '/admin/levels' },
      { label: '팀 관리', path: '/admin/teams' },
      { label: '권한 설정', path: '/admin/permissions' },
    ]},
    { group: '콘텐츠', items: [
      { label: '공지 관리', path: '/admin/notices' },
      { label: '공지사항', path: '/notice' },
    ]},
    { group: '통계', items: [
      { label: '전체 통계', path: '/admin/statistics' },
      { label: '랭킹', path: '/ranking' },
      { label: '핸들러 지도', path: '/handler-map' },
      { label: '매장 지도', path: '/store-map' },
    ]},
    { group: '시스템', items: [
      { label: '실시간 전광판', path: '/live' },
    ]},
  ],
  sub_admin: [
    { group: null, items: [{ label: '대시보드', path: '/admin' }] },
    { group: '상담 관리', items: [
      { label: '전체 상담', path: '/admin/consultations' },
      { label: '하드웨어 관리', path: '/admin/hardware' },
    ]},
    { group: '회원 관리', items: [
      { label: '회원 목록', path: '/admin/users' },
      { label: '레벨 관리', path: '/admin/levels' },
      { label: '팀 관리', path: '/admin/teams' },
    ]},
    { group: '콘텐츠', items: [
      { label: '공지 관리', path: '/admin/notices' },
      { label: '공지사항', path: '/notice' },
    ]},
    { group: '통계', items: [
      { label: '전체 통계', path: '/admin/statistics' },
      { label: '랭킹', path: '/ranking' },
      { label: '핸들러 지도', path: '/handler-map' },
      { label: '매장 지도', path: '/store-map' },
    ]},
    { group: '시스템', items: [
      { label: '실시간 전광판', path: '/live' },
    ]},
  ],
  payn_staff: [
    { group: null, items: [{ label: '대시보드', path: '/payn' }] },
    { group: '상담', items: [
      { label: '상담 목록', path: '/payn/consultations' },
    ]},
    { group: '정보', items: [
      { label: '통계', path: '/payn/statistics' },
      { label: '랭킹', path: '/ranking' },
      { label: '핸들러 지도', path: '/handler-map' },
      { label: '매장 지도', path: '/store-map' },
    ]},
    { group: '기타', items: [
      { label: '실시간 전광판', path: '/live' },
      { label: '공지사항', path: '/notice' },
    ]},
  ],
  geotech_staff: [
    { group: null, items: [{ label: '대시보드', path: '/geotech' }] },
    { group: '하드웨어', items: [
      { label: '하드웨어 목록', path: '/geotech/hardware' },
      { label: '설치 일정', path: '/geotech/schedule' },
    ]},
    { group: '정보', items: [
      { label: '통계', path: '/geotech/statistics' },
      { label: '매장 지도', path: '/store-map' },
    ]},
    { group: '기타', items: [
      { label: '실시간 전광판', path: '/live' },
      { label: '공지사항', path: '/notice' },
    ]},
  ],
};

export default memo(function Sidebar() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  if (!user) return null;

  const role = user.role as Role;
  const groups = MENU_GROUPS[role];

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-sidebar text-white dark:border-gray-700">
      <div className="border-b border-sidebar-dark px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-naver">메뉴</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {groups.map((g, gi) => (
          <div key={g.group ?? '_top'} className={gi > 0 ? 'mt-2' : ''}>
            {g.group && (
              <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {g.group}
              </p>
            )}
            <div className="space-y-1">
              {g.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-sound="hover"
                    className={`block rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-naver text-white font-medium shadow-md'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
});
