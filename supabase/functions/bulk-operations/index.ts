import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { secureUpdate, secureDelete } from '../_shared/db-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('Bulk Operations Function called:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { user } = await authenticateUser(req, supabase)
    
    const body = await req.json()
    const { operation, entityType, entityIds, updates } = body

    console.log(`Bulk ${operation} on ${entityType}: ${entityIds?.length || 0} items`)

    if (!entityIds || entityIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No entity IDs provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result;
    
    switch (operation) {
      case 'delete':
        result = await handleBulkDelete(supabase, entityType, entityIds, user.id)
        break
      
      case 'update':
        result = await handleBulkUpdate(supabase, entityType, entityIds, updates, user.id)
        break
      
      case 'duplicate':
        result = await handleBulkDuplicate(supabase, entityType, entityIds, user.id)
        break
      
      case 'archive':
        result = await handleBulkArchive(supabase, entityType, entityIds, user.id)
        break
      
      case 'activate':
        result = await handleBulkUpdate(supabase, entityType, entityIds, { status: 'active' }, user.id)
        break
      
      case 'deactivate':
        result = await handleBulkUpdate(supabase, entityType, entityIds, { status: 'inactive' }, user.id)
        break
      
      case 'update-prices':
        result = await handleBulkPriceUpdate(supabase, entityType, entityIds, updates, user.id)
        break
      
      case 'export':
        result = await handleBulkExport(supabase, entityType, entityIds, user.id)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown operation: ${operation}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log the bulk operation to activity_logs
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: `bulk_${operation}`,
      entity_type: entityType,
      description: `Bulk ${operation} on ${entityIds.length} ${entityType}`,
      metadata: { 
        operation, 
        entityType, 
        count: entityIds.length,
        success_count: result.data?.success?.length || 0,
        error_count: result.data?.errors?.length || 0
      }
    })

    return result

  } catch (error) {
    console.error('Error in bulk-operations:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleBulkDelete(supabase: any, entityType: string, entityIds: string[], userId: string) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  for (const id of entityIds) {
    try {
      await secureDelete(supabase, entityType, id, userId)
      results.success.push(id)
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Deleted ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkUpdate(supabase: any, entityType: string, entityIds: string[], updates: any, userId: string) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  // Batch update for better performance
  const { data, error } = await supabase
    .from(entityType)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', entityIds)
    .eq('user_id', userId)
    .select('id')

  if (error) {
    // Fallback to individual updates if batch fails
    for (const id of entityIds) {
      try {
        await secureUpdate(supabase, entityType, id, updates, userId)
        results.success.push(id)
      } catch (err) {
        results.errors.push({
          id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
  } else {
    results.success = data?.map((r: any) => r.id) || entityIds
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Updated ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkDuplicate(supabase: any, entityType: string, entityIds: string[], userId: string) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  for (const id of entityIds) {
    try {
      // Fetch original
      const { data: original, error: fetchError } = await supabase
        .from(entityType)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (fetchError) throw fetchError

      // Create duplicate
      const { id: _, created_at, updated_at, sku, ...rest } = original
      const duplicate = {
        ...rest,
        name: `${original.name} (copie)`,
        sku: sku ? `${sku}-copy-${Date.now()}` : null,
        status: 'draft',
        user_id: userId
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

  return new Response(
    JSON.stringify({
      success: true,
      message: `Duplicated ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkArchive(supabase: any, entityType: string, entityIds: string[], userId: string) {
  return await handleBulkUpdate(supabase, entityType, entityIds, { status: 'archived' }, userId)
}

async function handleBulkPriceUpdate(supabase: any, entityType: string, entityIds: string[], updates: any, userId: string) {
  const results = {
    success: [] as string[],
    errors: [] as { id: string; error: string }[]
  }

  const multiplier = updates?.multiplier as number || 1
  const fixedAmount = updates?.fixedAmount as number || 0
  const operation = updates?.priceOperation || 'multiply' // 'multiply', 'add', 'set'

  // Fetch current prices
  const { data: products, error: fetchError } = await supabase
    .from(entityType)
    .select('id, price, cost_price')
    .in('id', entityIds)
    .eq('user_id', userId)

  if (fetchError) {
    return new Response(
      JSON.stringify({ success: false, error: fetchError.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  for (const product of products || []) {
    let newPrice: number

    switch (operation) {
      case 'multiply':
        newPrice = Math.round((product.price || 0) * multiplier * 100) / 100
        break
      case 'add':
        newPrice = Math.round(((product.price || 0) + fixedAmount) * 100) / 100
        break
      case 'set':
        newPrice = fixedAmount
        break
      case 'margin':
        // Calculate price based on cost and target margin
        const costPrice = product.cost_price || 0
        const targetMargin = multiplier // Use multiplier as margin percentage
        newPrice = Math.round(costPrice * (1 + targetMargin / 100) * 100) / 100
        break
      default:
        newPrice = Math.round((product.price || 0) * multiplier * 100) / 100
    }

    const { error } = await supabase
      .from(entityType)
      .update({ price: newPrice, updated_at: new Date().toISOString() })
      .eq('id', product.id)
      .eq('user_id', userId)

    if (error) {
      results.errors.push({ id: product.id, error: error.message })
    } else {
      results.success.push(product.id)
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Updated prices for ${results.success.length}/${entityIds.length} items`,
      data: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkExport(supabase: any, entityType: string, entityIds: string[], userId: string) {
  const { data, error } = await supabase
    .from(entityType)
    .select('*')
    .in('id', entityIds)
    .eq('user_id', userId)

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Exported ${data?.length || 0} items`,
      data: { items: data, success: entityIds, errors: [] }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
