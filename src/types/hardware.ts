export interface Hardware {
  id: string;
  consultation_id: string;
  handler_id: string;
  store_name: string;
  owner_name: string;
  owner_phone: string;
  region: string;
  address: string;
  hardware_type: 'new' | 'replace';
  status: 'received' | 'scheduled' | 'completed';
  install_date: string | null;
  memo: string | null;
  geotech_memo: string | null;
  created_at: string;
  updated_at: string;
}
