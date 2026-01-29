import { useAuthStore } from '../../stores/authStore';
import { USER_ROLES } from '../../constants/roles';
import type { Role } from '../../types';

export default function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-navy">The Handlers</h1>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-mint">{USER_ROLES[user.role as Role].label}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
