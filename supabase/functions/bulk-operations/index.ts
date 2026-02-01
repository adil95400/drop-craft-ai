import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { secureUpdate, secureDelete } from '../_shared/db-helpers.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Input validation schemas
const OperationSchema = z.enum(['delete', 'update', 'duplicate', 'archive'])
const EntityTypeSchema = z.enum(['products', 'imported_products', 'orders', 'customers', 'suppliers'])
const BulkRequestSchema = z.object({
  operation: OperationSchema,
  entityType: EntityTypeSchema,
  entityIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.record(z.unknown()).optional(),
})

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    // 2. Rate limiting
    const rateCheck = await checkRateLimit(supabase, userId, 'bulk_operations', RATE_LIMITS.API_GENERAL)
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, corsHeaders)
    }
    
    // 3. Validation des entrées
    const body = await req.json()
    const parseResult = BulkRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { operation, entityType, entityIds, updates } = parseResult.data

    console.log(`[SECURE] Bulk ${operation} on ${entityType}: ${entityIds.length} items by user ${userId}`)

    switch (operation) {
      case 'delete':
        return await handleBulkDelete(supabase, entityType, entityIds, userId, corsHeaders)
      
      case 'update':
        return await handleBulkUpdate(supabase, entityType, entityIds, updates || {}, userId, corsHeaders)
      
      case 'duplicate':
        return await handleBulkDuplicate(supabase, entityType, entityIds, userId, corsHeaders)
      
      case 'archive':
        return await handleBulkArchive(supabase, entityType, entityIds, userId, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in bulk-operations:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})

async function handleBulkDelete(
  supabase: any, 
  entityType: string, 
  entityIds: string[], 
  userId: string,
  corsHeaders: Record<string, string>
) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  for (const id of entityIds) {
    try {
      // secureDelete vérifie l'ownership via user_id
      await secureDelete(supabase, entityType, id, userId)
      results.success.push(id)
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'bulk_delete',
    entity_type: entityType,
    description: `Bulk delete: ${results.success.length}/${entityIds.length} items`,
    metadata: { operation: 'delete', success_count: results.success.length, error_count: results.errors.length }
  })

  return new Response(
    JSON.stringify({
      success: true,
      message: `Deleted ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkUpdate(
  supabase: any, 
  entityType: string, 
  entityIds: string[], 
  updates: Record<string, unknown>, 
  userId: string,
  corsHeaders: Record<string, string>
) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  // Sanitize updates - remove protected fields
  const sanitizedUpdates = { ...updates }
  delete sanitizedUpdates.id
  delete sanitizedUpdates.user_id
  delete sanitizedUpdates.created_at

  for (const id of entityIds) {
    try {
      // secureUpdate vérifie l'ownership via user_id
      await secureUpdate(supabase, entityType, id, sanitizedUpdates, userId)
      results.success.push(id)
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'bulk_update',
    entity_type: entityType,
    description: `Bulk update: ${results.success.length}/${entityIds.length} items`,
    metadata: { operation: 'update', success_count: results.success.length, error_count: results.errors.length }
  })

  return new Response(
    JSON.stringify({
      success: true,
      message: `Updated ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkDuplicate(
  supabase: any, 
  entityType: string, 
  entityIds: string[], 
  userId: string,
  corsHeaders: Record<string, string>
) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  for (const id of entityIds) {
    try {
      // Fetch original - SCOPED by user_id
      const { data: original, error: fetchError } = await supabase
        .from(entityType)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // CRITICAL: scope to user
        .single()

      if (fetchError) throw fetchError
      if (!original) throw new Error('Item not found or unauthorized')

      // Create duplicate - force user_id
      const { id: _, created_at, updated_at, ...rest } = original
      const duplicate = {
        ...rest,
        name: `${original.name || original.title || 'Item'} (copie)`,
        user_id: userId // CRITICAL: force user ownership
      }

      const { data: newItem, error: insertError } = await supabase
        .from(entityType)
        .insert(duplicate)
        .select()
        .single()

      if (insertError) throw insertError

      results.success.push(newItem.id)
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'bulk_duplicate',
    entity_type: entityType,
    description: `Bulk duplicate: ${results.success.length}/${entityIds.length} items`,
    metadata: { operation: 'duplicate', success_count: results.success.length, error_count: results.errors.length }
  })

  return new Response(
    JSON.stringify({
      success: true,
      message: `Duplicated ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkArchive(
  supabase: any, 
  entityType: string, 
  entityIds: string[], 
  userId: string,
  corsHeaders: Record<string, string>
) {
  return await handleBulkUpdate(supabase, entityType, entityIds, { status: 'archived' }, userId, corsHeaders)
}
