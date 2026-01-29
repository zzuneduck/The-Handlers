export interface LevelHistory {
  id: string;
  handler_id: string;
  handler_name: string;
  previous_level: number;
  new_level: number;
  reason: string;
  changed_by: string;
  changed_by_name: string;
  created_at: string;
}
