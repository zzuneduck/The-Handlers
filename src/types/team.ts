export interface Team {
  id: string;
  name: string;
  leader_id: string | null;
  leader_name: string | null;
  member_count: number;
  region: string | null;
  created_at: string;
}
