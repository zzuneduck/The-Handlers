export interface Notice {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}
