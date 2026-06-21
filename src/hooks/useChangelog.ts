import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface RoadmapItem {
  id: number;
  title: string;
  date: string;
  version: string;
  status: 'completed' | 'in-progress' | 'planned';
  icon: string;
  description: string;
  details: string[];
}

export interface AboutConfig {
  happyUsers: string;
  calculationsDone: string;
  rating: string;
  uptime: string;
  roadmap: RoadmapItem[];
}

export interface GlobalNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
}

const defaultAboutConfig: AboutConfig = {
  happyUsers: '10k+',
  calculationsDone: '1M+',
  rating: '4.9',
  uptime: '99%',
  roadmap: [
    {
        id: 1,
        title: 'Initial Release',
        date: 'Q3 2024',
        version: 'v1.0',
        status: 'completed',
        icon: 'Sparkles',
        description: 'The foundation of Sutradhaar.',
        details: ['Basic calculators', 'Unit converter', 'Timer']
    }
  ]
};

export function useChangelog() {
  const [changelog, setChangelog] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0.0');
  const [aboutConfig, setAboutConfig] = useState<AboutConfig>(defaultAboutConfig);
  const [globalNotifications, setGlobalNotifications] = useState<GlobalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    const fetchChangelog = async () => {
      try {
        const { data, error } = await supabase
          .from('maintenance')
          .select('message')
          .eq('id', false)
          .single();

        if (data && data.message) {
          try {
            const parsed = JSON.parse(data.message);
            setChangelog(parsed.content || '');
            setVersion(parsed.version || '1.0.0');
            setAboutConfig(parsed.about || defaultAboutConfig);
            
            const notifs = parsed.globalNotifications || [];
            setGlobalNotifications(notifs);
            
            if (notifs.length > 0) {
              const latestId = notifs[0].id;
              const lastSeenId = localStorage.getItem('last_notification_id');
              if (lastSeenId && lastSeenId !== latestId) {
                const audio = new Audio('/sound/new-notification-09-352705.mp3');
                audio.play().catch(e => console.log('Audio play error', e));
              }
              localStorage.setItem('last_notification_id', latestId);
            }
          } catch (e) {
            setChangelog(data.message);
            setVersion('1.0.0');
            setAboutConfig(defaultAboutConfig);
            setGlobalNotifications([]);
          }
        }
      } catch (err) {
        console.error("Error fetching changelog:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelog();

    const channelName = `changelog-channel-${Math.random()}`;
    subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance', filter: 'id=eq.false' },
        (payload) => {
          const newRecord = payload.new as any;
          if (newRecord && newRecord.message) {
            try {
              const parsed = JSON.parse(newRecord.message);
              setChangelog(parsed.content || '');
              setVersion(parsed.version || '1.0.0');
              setAboutConfig(parsed.about || defaultAboutConfig);
              setGlobalNotifications(parsed.globalNotifications || []);
            } catch (e) {
              setChangelog(newRecord.message);
              setVersion('1.0.0');
              setAboutConfig(defaultAboutConfig);
              setGlobalNotifications([]);
            }
            setTimeout(() => {
              window.location.reload();
            }, 500);
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

  const updateChangelog = async (newVersion: string, newChangelog: string) => {
    try {
      const payload = JSON.stringify({ version: newVersion, content: newChangelog, about: aboutConfig });
      const { error } = await supabase
        .from('maintenance')
        .upsert({ id: false, message: payload, is_active: false });
      
      if (error) {
        console.error("Error updating changelog:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error updating changelog:", err);
      return false;
    }
  };

  const updateAboutConfig = async (newAboutConfig: AboutConfig) => {
    try {
      const payload = JSON.stringify({ version, content: changelog, about: newAboutConfig, globalNotifications });
      const { error } = await supabase
        .from('maintenance')
        .upsert({ id: false, message: payload, is_active: false });
      
      if (error) {
        console.error("Error updating about config:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error updating about config:", err);
      return false;
    }
  };

  const addGlobalNotification = async (notification: Omit<GlobalNotification, 'id' | 'timestamp'>) => {
    try {
      const newNotif: GlobalNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      };
      const updatedList = [newNotif, ...globalNotifications];
      const payload = JSON.stringify({ version, content: changelog, about: aboutConfig, globalNotifications: updatedList });
      const { error } = await supabase
        .from('maintenance')
        .upsert({ id: false, message: payload, is_active: false });
      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  const deleteGlobalNotification = async (id: string) => {
    try {
      const updatedList = globalNotifications.filter(n => n.id !== id);
      const payload = JSON.stringify({ version, content: changelog, about: aboutConfig, globalNotifications: updatedList });
      const { error } = await supabase
        .from('maintenance')
        .upsert({ id: false, message: payload, is_active: false });
      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  return { changelog, version, aboutConfig, globalNotifications, isLoading, updateChangelog, updateAboutConfig, addGlobalNotification, deleteGlobalNotification };
}
