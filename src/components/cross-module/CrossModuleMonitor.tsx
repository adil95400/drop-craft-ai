/**
 * CrossModuleMonitor - Invisible component that auto-emits cross-module events
 * and bridges inbound webhooks to the event bus
 */
import { useAutoEmitCrossModuleEvents } from '@/hooks/useAutoEmitCrossModuleEvents';
import { useWebhookCrossModuleBridge } from '@/hooks/useWebhookCrossModuleBridge';

export function CrossModuleMonitor() {
  useAutoEmitCrossModuleEvents();
  useWebhookCrossModuleBridge();
  return null;
}
