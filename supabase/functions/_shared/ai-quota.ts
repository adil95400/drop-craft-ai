/**
 * AI Quota Checking - Integrates with check_user_quota before AI calls
 * P1: Prevents uncontrolled consumption
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const QUOTA_KEY_MAP: Record<string, string> = {
  seo: 'ai_seo_generations',
  product: 'ai_product_generations',
  marketing: 'ai_marketing_generations',
  chat: 'ai_chat_messages',
  automation: 'ai_automation_runs',
  translation: 'ai_translations',
  general: 'ai_generations',
}

export async function checkAndIncrementQuota(
  userId: string,
  module: string,
  increment = 1
): Promise<{ allowed: boolean; usage?: number; limit?: number; remaining?: number }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const quotaKey = QUOTA_KEY_MAP[module] || QUOTA_KEY_MAP.general

    // Check quota
    const { data: checkResult } = await supabase.rpc('check_user_quota', {
      p_user_id: userId,
      p_quota_key: quotaKey,
      p_increment: increment,
    })

    if (!checkResult) {
      // If quota system not set up, allow by default
      console.warn(`[AI-QUOTA] No quota config for ${quotaKey}, allowing by default`)
      return { allowed: true }
    }

    if (!checkResult.can_proceed) {
      console.warn(`[AI-QUOTA] Quota exceeded for user ${userId}, key ${quotaKey}: ${checkResult.current_usage}/${checkResult.limit}`)
      return {
        allowed: false,
        usage: checkResult.current_usage,
        limit: checkResult.limit,
        remaining: checkResult.remaining,
      }
    }

    // Increment usage
    await supabase.rpc('increment_user_quota', {
      p_user_id: userId,
      p_quota_key: quotaKey,
      p_increment: increment,
    })

    // Log consumption
    await supabase.rpc('log_consumption_and_check_alerts', {
      p_user_id: userId,
      p_quota_key: quotaKey,
      p_action_type: `ai_${module}`,
      p_action_detail: JSON.stringify({ module, increment }),
      p_tokens_used: 0,
      p_cost_estimate: 0,
      p_source: 'edge_function',
    }).catch(() => {}) // Non-blocking

    return {
      allowed: true,
      usage: checkResult.current_usage + increment,
      limit: checkResult.limit,
      remaining: checkResult.remaining - increment,
    }
  } catch (err) {
    console.error('[AI-QUOTA] Error checking quota:', err)
    // Fail-open: allow if quota system errors
    return { allowed: true }
  }
}

export function quotaExceededResponse(corsHeaders: Record<string, string>, quotaInfo?: any) {
  return new Response(
    JSON.stringify({
      error: 'Quota IA dépassé. Passez au plan supérieur pour continuer.',
      code: 'QUOTA_EXCEEDED',
      usage: quotaInfo?.usage,
      limit: quotaInfo?.limit,
    }),
    {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
