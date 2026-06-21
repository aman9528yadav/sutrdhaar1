import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ToolMaintenance {
  tool_id: string;
  is_maintenance: boolean;
  message: string | null;
}

export interface MaintenanceData {
  isActive: boolean;
  endTime: number | null; // Timestamp in milliseconds
  message: string | null;
  type: 'update' | 'bugfix' | 'checkup' | null;
  tools: Record<string, ToolMaintenance>;
}

export function useMaintenance() {
  const [maintenance, setMaintenance] = useState<MaintenanceData>({
    isActive: false,
    endTime: null,
    message: null,
    type: null,
    tools: {},
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

        const { data: toolsData, error: toolsError } = await supabase
          .from('tool_maintenance')
          .select('*');

        if (error && error.code !== 'PGRST116') {
          console.error("Supabase Error (Maintenance):", error.message, error.details, error.hint, error);
        } else {
          const toolsMap: Record<string, ToolMaintenance> = {};
          if (toolsData) {
            toolsData.forEach(t => {
              toolsMap[t.tool_id] = {
                tool_id: t.tool_id,
                is_maintenance: t.is_maintenance,
                message: t.message
              };
            });
          }

          setMaintenance({
            isActive: data?.is_active || false,
            endTime: data?.end_time || null,
            message: data?.message || null,
            type: data?.type || null,
            tools: toolsMap,
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
            setMaintenance(prev => ({
              ...prev,
              isActive: payload.new.is_active || false,
              endTime: payload.new.end_time || null,
              message: payload.new.message || null,
              type: payload.new.type || null,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tool_maintenance' },
        (payload) => {
          if (payload.new && payload.new.tool_id) {
            setMaintenance(prev => ({
              ...prev,
              tools: {
                ...prev.tools,
                [payload.new.tool_id]: {
                  tool_id: payload.new.tool_id,
                  is_maintenance: payload.new.is_maintenance || false,
                  message: payload.new.message || null
                }
              }
            }));
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
