import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

// Supabase Realtime Presence — ephemeral, no DB writes needed.
// Each active focus session broadcasts presence to a shared channel.
// When the session ends, presence is automatically removed.

interface PresenceState {
  user_id: string;
  started_at: string;
}

export function useBodyDoubling(isSessionActive: boolean) {
  const { user } = useAppStore();
  const [focuserCount, setFocuserCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('aware_focus_room', {
      config: { presence: { key: user.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceState>();
      // Count all OTHER users currently focusing (exclude self)
      const others = Object.keys(state).filter(k => k !== user.id).length;
      setFocuserCount(others);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && isSessionActive) {
        await channel.track({
          user_id: user.id,
          started_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id]);

  // Track/untrack when session starts or stops
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !user?.id) return;
    if (isSessionActive) {
      channel.track({ user_id: user.id, started_at: new Date().toISOString() });
    } else {
      channel.untrack();
    }
  }, [isSessionActive, user?.id]);

  return { focuserCount };
}
