import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type EventCategory = 'activation' | 'engagement' | 'conversion' | 'retention' | 'feature';

interface TrackEventOptions {
  eventName: string;
  category?: EventCategory;
  data?: Record<string, string | number | boolean>;
}

/**
 * Lightweight usage event tracker for internal KPIs.
 * Fire-and-forget: never blocks the UI.
 */
export function useUsageTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(
    (opts: TrackEventOptions) => {
      if (!user) return;

      const sessionId =
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('session_id') ?? undefined
          : undefined;

      // Fire and forget
      (supabase as any)
        .from('usage_events')
        .insert({
          user_id: user.id,
          event_name: opts.eventName,
          event_category: opts.category ?? 'general',
          event_data: opts.data ?? {},
          session_id: sessionId,
        })
        .then(({ error }: any) => {
          if (error) console.warn('[UsageTracking]', error.message);
        });
    },
    [user],
  );

  const incrementCounter = useCallback(
    (counterKey: string, increment = 1) => {
      if (!user) return;
      supabase
        .rpc('increment_usage_counter', {
          p_user_id: user.id,
          p_counter_key: counterKey,
          p_increment: increment,
        })
        .then(({ error }) => {
          if (error) console.warn('[UsageCounter]', error.message);
        });
    },
    [user],
  );

  return { trackEvent, incrementCounter };
}
