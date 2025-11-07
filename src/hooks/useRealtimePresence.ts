import { useEffect, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface PresenceState {
  userId: string;
  userName: string;
  userEmail: string;
  onlineAt: string;
}

interface UseRealtimePresenceOptions {
  channelName: string;
  entityId?: string; // e.g., paper_id or review_id
}

export const useRealtimePresence = ({ channelName, entityId }: UseRealtimePresenceOptions) => {
  const [presences, setPresences] = useState<Record<string, PresenceState[]>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullChannelName = entityId ? `${channelName}:${entityId}` : channelName;
      const presenceChannel = supabase.channel(fullChannelName);

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState() as Record<string, PresenceState[]>;
          console.log('[PRESENCE] Sync:', state);
          setPresences(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[PRESENCE] Join:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[PRESENCE] Leave:', key, leftPresences);
        })
        .subscribe(async (status) => {
          console.log('[PRESENCE] Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            const presenceState: PresenceState = {
              userId: user.id,
              userName: user.user_metadata?.full_name || 'Anonymous',
              userEmail: user.email || '',
              onlineAt: new Date().toISOString(),
            };

            await presenceChannel.track(presenceState);
            console.log('[PRESENCE] Tracking presence:', presenceState);
          }
        });

      setChannel(presenceChannel);

      return () => {
        console.log('[PRESENCE] Unsubscribing');
        presenceChannel.unsubscribe();
      };
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channelName, entityId]);

  // Get active users (flattened array)
  const activeUsers = Object.values(presences)
    .flat()
    .filter((presence, index, self) => 
      index === self.findIndex((p) => p.userId === presence.userId)
    );

  return {
    activeUsers,
    isConnected,
    presences,
  };
};
