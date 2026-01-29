import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES } from '../../constants/roles';
import type { Role } from '../../types';

export default function Header() {
  const { user, logout } = useAuthStore();

  const dashboardPath = user ? USER_ROLES[user.role as Role]?.dashboard ?? '/' : '/';

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <Link to={dashboardPath} className="text-xl font-bold text-text transition-opacity hover:opacity-80 dark:text-gray-100">
          The Handlers
        </Link>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-text dark:text-gray-200">{user.name}</p>
            <p className="text-xs font-medium text-naver">{USER_ROLES[user.role as Role].label}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl bg-gray-100 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
