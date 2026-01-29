import { supabase } from './supabase';
import type { ActivityTypeKey } from '../constants/activityTypes';

interface LogActivityParams {
  type: ActivityTypeKey;
  handler_id: string;
  handler_name: string;
  user_name: string;
  description: string;
  region?: string | null;
  store_name?: string | null;
  message?: string | null;
  extra_data?: Record<string, unknown> | null;
}

export async function logActivity(params: LogActivityParams) {
  const { error } = await supabase.from('activities').insert({
    type: params.type,
    handler_id: params.handler_id,
    handler_name: params.handler_name,
    user_name: params.user_name,
    description: params.description,
    region: params.region ?? null,
    store_name: params.store_name ?? null,
    message: params.message ?? null,
    extra_data: params.extra_data ?? null,
  });

  if (error) {
    console.error('[logActivity]', error.message);
  }
}
