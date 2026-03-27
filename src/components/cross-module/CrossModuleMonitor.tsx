/**
 * CrossModuleMonitor - Invisible component that auto-emits cross-module events,
 * bridges inbound webhooks, and listens to Realtime for instant reactivity.
 */
import { useAutoEmitCrossModuleEvents } from '@/hooks/useAutoEmitCrossModuleEvents';
import { useWebhookCrossModuleBridge } from '@/hooks/useWebhookCrossModuleBridge';
import { useCrossModuleRealtime } from '@/hooks/useCrossModuleRealtime';

export function CrossModuleMonitor() {
  useAutoEmitCrossModuleEvents();
  useWebhookCrossModuleBridge();
  useCrossModuleRealtime();
  return null;
}
