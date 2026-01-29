export type Role = 'super_admin' | 'sub_admin' | 'payn_staff' | 'geotech_staff' | 'handler';

export type HandlerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  handler_level: HandlerLevel | null;
  phone: string | null;
  team_id: string | null;
  region: string | null;
  created_at: string;
  is_active: boolean;
}
