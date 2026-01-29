export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  author_id: string;
  author_name: string;
  download_count: number;
  created_at: string;
}
