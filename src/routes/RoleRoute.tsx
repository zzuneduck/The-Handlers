import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { USER_ROLES } from '../constants/roles';
import type { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as Role)) {
    return <Navigate to={USER_ROLES[user.role as Role].dashboard} replace />;
  }

  return <Outlet />;
}
