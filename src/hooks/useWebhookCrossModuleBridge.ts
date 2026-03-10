/**
 * useWebhookCrossModuleBridge — Listens to webhook_events via Realtime
 * and emits corresponding CrossModuleEventBus events to trigger
 * automatic actions (repricing, stock alerts, order fulfillment).
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCrossModuleEvents, type CrossModuleEventType } from '@/services/cross-module/CrossModuleEventBus';
import { useApplyPricingRules, useSyncStockAlerts } from '@/hooks/useCrossModuleSync';

interface WebhookEventPayload {
  id: string;
  platform: string;
  event_type: string;
  payload: Record<string, any>;
  status: string;
  user_id: string;
}

/**
 * Maps a webhook event_type + platform to a CrossModule event type
 */
function mapWebhookToModuleEvent(
  platform: string,
  eventType: string
): { moduleEvent: CrossModuleEventType; source: string } | null {
  const key = `${platform}:${eventType}`.toLowerCase();

  // Order events
  if (
    key.includes('orders/create') ||
    key.includes('order.created') ||
    key.includes('orders/updated') ||
    key.includes('order.updated')
  ) {
    return { moduleEvent: 'webhook.order_received', source: `webhook-${platform}` };
  }

  // Product update events
  if (
    key.includes('products/update') ||
    key.includes('product.updated') ||
    key.includes('products/create') ||
    key.includes('product.created')
  ) {
    return { moduleEvent: 'webhook.product_updated', source: `webhook-${platform}` };
  }

  // Inventory / stock events
  if (
    key.includes('inventory_levels') ||
    key.includes('stock') ||
    key.includes('inventory')
  ) {
    return { moduleEvent: 'webhook.inventory_changed', source: `webhook-${platform}` };
  }

  // Refund events
  if (key.includes('refund') || key.includes('orders/cancelled')) {
    return { moduleEvent: 'webhook.refund_received', source: `webhook-${platform}` };
  }

  return null;
}

export function useWebhookCrossModuleBridge() {
  const emit = useCrossModuleEvents((s) => s.emit);
  const processedIds = useRef<Set<string>>(new Set());
  const applyPricing = useApplyPricingRules();
  const syncStockAlerts = useSyncStockAlerts();

  useEffect(() => {
    const channel = supabase
      .channel('webhook-cross-module-bridge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_events',
          filter: 'status=eq.received',
        },
        (payload) => {
          const event = payload.new as WebhookEventPayload;
          if (!event?.id || processedIds.current.has(event.id)) return;
          processedIds.current.add(event.id);

          // Keep set bounded
          if (processedIds.current.size > 200) {
            const arr = [...processedIds.current];
            processedIds.current = new Set(arr.slice(-100));
          }

          const mapping = mapWebhookToModuleEvent(event.platform, event.event_type);
          if (!mapping) return;

          // Emit to CrossModuleEventBus
          emit(mapping.moduleEvent, mapping.source, {
            webhookEventId: event.id,
            platform: event.platform,
            eventType: event.event_type,
            payload: event.payload,
          });

          // Trigger automatic actions based on event type
          switch (mapping.moduleEvent) {
            case 'webhook.inventory_changed':
              // Auto-check stock alerts when inventory changes
              syncStockAlerts.mutate();
              break;

            case 'webhook.product_updated':
              // Auto-apply pricing rules when products are updated
              applyPricing.mutate();
              break;

            case 'webhook.order_received':
              // Also emit the generic orders.created for existing suggestions
              emit('orders.created', mapping.source, {
                count: 1,
                platform: event.platform,
                webhookEventId: event.id,
              });
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [emit, applyPricing, syncStockAlerts]);
}
