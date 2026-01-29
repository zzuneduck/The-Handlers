import { PERMISSIONS } from '../constants/permissions';
import type { PermissionKey } from '../constants/permissions';

export function hasPermission(role: string, permission: PermissionKey): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}
