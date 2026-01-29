import type { Role } from './user';

export interface Permission {
  key: string;
  label: string;
  roles: Role[];
}
