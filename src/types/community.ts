export interface Post {
  id: string;
  type: 'qna' | 'success_story' | 'payn_tip' | 'free_board';
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  category: string | null;
  likes: number;
  view_count: number;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}
