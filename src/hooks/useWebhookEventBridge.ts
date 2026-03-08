/**
 * useWebhookEventBridge — Bridges inbound webhook events to CrossModuleEventBus
 * Listens to webhook_events via Supabase Realtime and emits cross-module events
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useCrossModuleEvents, type CrossModuleEventType } from '@/services/cross-module/CrossModuleEventBus';

/** Map webhook event_type strings to CrossModuleEventBus event types */
function mapWebhookToEventType(platform: string, eventType: string): CrossModuleEventType {
  const normalized = eventType.toLowerCase();

  // Order events
  if (
    normalized.includes('order') &&
    (normalized.includes('create') || normalized.includes('created') || normalized.includes('paid'))
  ) {
    return 'webhook.order_received';
  }

  // Product events
  if (normalized.includes('product') && (normalized.includes('update') || normalized.includes('updated'))) {
    return 'webhook.product_updated';
  }

  // Inventory events
  if (normalized.includes('inventory') || normalized.includes('stock')) {
    return 'webhook.inventory_changed';
  }

  // Fallback
  return 'webhook.received';
}

export function useWebhookEventBridge() {
  const { user } = useUnifiedAuth();
  const emit = useCrossModuleEvents((s) => s.emit);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new webhook_events via Realtime
    const channel = supabase
      .channel('webhook-events-bridge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as {
            platform: string;
            event_type: string;
            payload: Record<string, any>;
            status: string;
          };

          if (row.status === 'failed') return; // Don't emit for signature failures

          const busEventType = mapWebhookToEventType(row.platform, row.event_type);
          emit(busEventType, 'webhook', {
            platform: row.platform,
            event_type: row.event_type,
            webhook_payload: row.payload,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, emit]);
}
