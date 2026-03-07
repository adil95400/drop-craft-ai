/**
 * CrossModuleMonitor - Invisible component that auto-emits cross-module events
 */
import { useAutoEmitCrossModuleEvents } from '@/hooks/useAutoEmitCrossModuleEvents';

export function CrossModuleMonitor() {
  useAutoEmitCrossModuleEvents();
  return null;
}
