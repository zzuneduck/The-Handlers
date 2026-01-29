export interface Store {
  id: string;
  handler_id: string;
  name: string;
  owner_name: string;
  owner_phone: string;
  region: string;
  address: string;
  business_type: string;
  store_size: string;
  status: 'active' | 'contracted' | 'pending' | 'failed';
  latitude: number | null;
  longitude: number | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}
