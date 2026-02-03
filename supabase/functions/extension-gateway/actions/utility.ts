/**
 * Utility Handler
 * Handles CHECK_VERSION, GET_SETTINGS, LOG_*, CHECK_QUOTA actions
 */

import { z } from "zod"
import { GatewayContext, HandlerResult, CURRENT_EXTENSION_VERSION, MIN_EXTENSION_VERSION, GATEWAY_VERSION } from '../types.ts'
import { compareVersions } from '../utils.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const LogActionPayload = z.object({
  action_type: z.string().min(1).max(50),
  action_status: z.enum(['success', 'error', 'pending']).optional().default('success'),
  platform: z.string().max(50).optional(),
  product_title: z.string().max(200).optional(),
  product_url: z.string().url().max(2000).optional(),
  product_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
})

const LogAnalyticsPayload = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional().default({}),
})

// =============================================================================
// HANDLERS
// =============================================================================

async function handleCheckVersion(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const clientVersion = ctx.extensionVersion
  const updateAvailable = compareVersions(CURRENT_EXTENSION_VERSION, clientVersion) > 0
  const updateRequired = compareVersions(MIN_EXTENSION_VERSION, clientVersion) > 0

  return {
    success: true,
    data: {
      currentVersion: clientVersion,
      latestVersion: CURRENT_EXTENSION_VERSION,
      minVersion: MIN_EXTENSION_VERSION,
      gatewayVersion: GATEWAY_VERSION,
      updateAvailable,
      updateRequired,
      changelog: updateAvailable ? [
        'Improved performance and stability',
        'Enhanced security features',
        'Bug fixes and optimizations',
      ] : [],
    }
  }
}

async function handleGetSettings(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Get user settings
    const { data: settings } = await ctx.supabase
      .from('extension_settings')
      .select('*')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    // Get user profile for plan info
    const { data: profile } = await ctx.supabase
      .from('user_profiles')
      .select('plan, subscription_status')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    return {
      success: true,
      data: {
        settings: settings || {
          autoImport: false,
          defaultMargin: 30,
          roundPrices: true,
          defaultLanguage: 'fr',
        },
        user: {
          plan: profile?.plan || 'free',
          subscriptionStatus: profile?.subscription_status || 'inactive',
        },
        features: {
          aiOptimization: true,
          bulkImport: profile?.plan !== 'free',
          priceMonitoring: profile?.plan === 'ultrapro',
          reviewScraping: true,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleLogAction(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = LogActionPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid log action payload' }
    }
  }

  try {
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: parsed.data.action_type,
      action_status: parsed.data.action_status,
      platform: parsed.data.platform,
      product_title: parsed.data.product_title,
      product_url: parsed.data.product_url,
      product_id: parsed.data.product_id,
      metadata: parsed.data.metadata,
      extension_version: ctx.extensionVersion,
    })

    return {
      success: true,
      data: { logged: true }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleLogAnalytics(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = LogAnalyticsPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid analytics payload' }
    }
  }

  try {
    await ctx.supabase.from('extension_analytics').insert({
      user_id: ctx.userId,
      event_name: parsed.data.event,
      event_properties: parsed.data.properties,
      extension_version: ctx.extensionVersion,
    })

    return {
      success: true,
      data: { logged: true }
    }
  } catch (error) {
    // Analytics logging should not fail the request
    return {
      success: true,
      data: { logged: false }
    }
  }
}

async function handleCheckQuota(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Get user profile for plan info
    const { data: profile } = await ctx.supabase
      .from('user_profiles')
      .select('plan')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    const plan = profile?.plan || 'free'

    // Define quotas by plan
    const quotas: Record<string, any> = {
      free: {
        dailyImports: 10,
        dailyAiOptimizations: 5,
        monthlyProducts: 50,
      },
      pro: {
        dailyImports: 100,
        dailyAiOptimizations: 50,
        monthlyProducts: 500,
      },
      ultrapro: {
        dailyImports: -1, // unlimited
        dailyAiOptimizations: -1,
        monthlyProducts: -1,
      },
    }

    const userQuota = quotas[plan] || quotas.free

    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: importsToday } = await ctx.supabase
      .from('extension_action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .in('action_type', ['IMPORT_PRODUCT', 'IMPORT_BULK'])
      .gte('created_at', today.toISOString())

    const { count: aiToday } = await ctx.supabase
      .from('extension_action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .like('action_type', 'AI_%')
      .gte('created_at', today.toISOString())

    // Get monthly product count
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count: productsThisMonth } = await ctx.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .gte('created_at', monthStart.toISOString())

    return {
      success: true,
      data: {
        plan,
        quotas: userQuota,
        usage: {
          importsToday: importsToday || 0,
          aiOptimizationsToday: aiToday || 0,
          productsThisMonth: productsThisMonth || 0,
        },
        remaining: {
          dailyImports: userQuota.dailyImports === -1 ? -1 : Math.max(0, userQuota.dailyImports - (importsToday || 0)),
          dailyAiOptimizations: userQuota.dailyAiOptimizations === -1 ? -1 : Math.max(0, userQuota.dailyAiOptimizations - (aiToday || 0)),
          monthlyProducts: userQuota.monthlyProducts === -1 ? -1 : Math.max(0, userQuota.monthlyProducts - (productsThisMonth || 0)),
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleUtilityAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'CHECK_VERSION':
      return handleCheckVersion(payload, ctx)
    case 'GET_SETTINGS':
      return handleGetSettings(payload, ctx)
    case 'LOG_ACTION':
      return handleLogAction(payload, ctx)
    case 'LOG_ANALYTICS':
      return handleLogAnalytics(payload, ctx)
    case 'CHECK_QUOTA':
      return handleCheckQuota(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown utility action: ${action}` }
      }
  }
}
