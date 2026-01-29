import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityTypeKey } from '../constants/activityTypes';

export interface ActivityRow {
  id: string;
  type: ActivityTypeKey;
  handler_id: string | null;
  handler_name: string | null;
  user_name: string;
  region: string | null;
  store_name: string | null;
  description: string;
  message: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  isNew?: boolean;
}

const SELECT_COLS =
  'id, type, handler_id, handler_name, user_name, region, store_name, description, message, extra_data, created_at';

export function useRealtimeActivities(limit = 20) {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('activities')
      .select(SELECT_COLS)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[useRealtimeActivities] fetch', error.message);
    }
    setActivities((data as ActivityRow[]) ?? []);
    setLoading(false);
    initialFetchDone.current = true;
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Supabase Realtime 구독
  useEffect(() => {
    const channel = supabase
      .channel('activities-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        (payload) => {
          const newRow = payload.new as ActivityRow;
          newRow.isNew = true;

          setActivities((prev) => {
            const updated = [newRow, ...prev];
            // limit 초과 시 오래된 항목 제거
            if (updated.length > limit) {
              return updated.slice(0, limit);
            }
            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { activities, loading, refetch: fetchActivities };
}
