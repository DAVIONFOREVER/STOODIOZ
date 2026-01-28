import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import * as apiService from '../services/apiService';

export interface LiveRoom {
  id: string;
  host_id: string;
  title: string;
  conversation_id?: string | null;
  listeners?: number;
  created_at?: string;
}

export const useLiveRooms = () => {
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchLiveRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load live rooms', e);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel('public:live_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_room_participants' }, refresh)
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('[useLiveRooms] removeChannel failed:', e);
      }
    };
  }, [refresh]);

  return { rooms, isLoading, refresh };
};
