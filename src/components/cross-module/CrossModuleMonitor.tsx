/**
 * CrossModuleMonitor - Invisible component that auto-emits cross-module events
 */
import { useAutoEmitCrossModuleEvents } from '@/hooks/useAutoEmitCrossModuleEvents';
import { useWebhookEventBridge } from '@/hooks/useWebhookEventBridge';

export function CrossModuleMonitor() {
  useAutoEmitCrossModuleEvents();
  useWebhookEventBridge();
  return null;
}
