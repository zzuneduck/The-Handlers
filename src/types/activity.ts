export interface Activity {
  id: string;
  type: 'contract_success' | 'consultation_new' | 'install_complete' | 'new_member' | 'level_up' | 'goal_achieved' | 'consecutive_contract';
  user_id: string;
  user_name: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
