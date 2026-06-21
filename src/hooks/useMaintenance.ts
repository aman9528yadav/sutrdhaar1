import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MaintenanceData {
  isActive: boolean;
  endTime: number | null; // Timestamp in milliseconds
  message: string | null;
  type: 'update' | 'bugfix' | 'checkup' | null;
}

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState<MaintenanceData>({
    isActive: false,
    endTime: null,
    message: null,
    type: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('is_active, end_time, message, type')
          .eq('id', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Supabase Error (Maintenance):", error.message, error.details, error.hint, error);
        } else if (data) {
          setMaintenance({
            isActive: data.is_active || false,
            endTime: data.end_time || null,
            message: data.message || null,
            type: data.type || null,
          });
        }
      } catch (err) {
        console.error("Error fetching maintenance data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const channelName = `maintenance-channel-${Math.random()}`;
    subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance' },
        (payload) => {
          if (payload.new) {
            setMaintenance({
              isActive: payload.new.is_active || false,
              endTime: payload.new.end_time || null,
              message: payload.new.message || null,
              type: payload.new.type || null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  return { maintenance, isLoading };
}
