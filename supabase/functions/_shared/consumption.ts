/**
 * Shared consumption tracking helper for edge functions.
 * Logs usage events to `consumption_logs` for quota enforcement.
 */
import { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ConsumptionAction =
  | 'import'
  | 'seo_audit'
  | 'seo_generation'
  | 'ai_enrichment'
  | 'scraping'
  | 'deduplication'
  | 'bulk_optimization'
  | 'scheduled_import';

interface ConsumptionEvent {
  userId: string;
  action: ConsumptionAction;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export async function logConsumption(
  supabase: SupabaseClient,
  event: ConsumptionEvent
): Promise<void> {
  try {
    await supabase.from("consumption_logs").insert({
      user_id: event.userId,
      action: event.action,
      quantity: event.quantity ?? 1,
      metadata: event.metadata ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking: quota logging should never break the main flow
    console.error("[consumption] Failed to log:", err);
  }
}
