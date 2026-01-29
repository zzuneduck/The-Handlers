export interface Consultation {
  id: string;
  handler_id: string;
  store_name: string;
  owner_name: string;
  owner_phone: string;
  region: string;
  address: string;
  business_type: string;
  store_size: string;
  status: 'pending' | 'consulting' | 'contracted' | 'failed';
  memo: string | null;
  payn_memo: string | null;
  revenue: number | null;
  needs_hardware: boolean;
  attachments: string[];
  created_at: string;
  updated_at: string;
}
