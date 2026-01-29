export interface RankingEntry {
  rank: number;
  handler_id: string;
  handler_name: string;
  handler_level: number;
  team_name: string | null;
  region: string | null;
  contract_count: number;
  consultation_count: number;
  score: number;
}
