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

    switch (operation) {
      case 'delete':
        return await handleBulkDelete(supabase, entityType, entityIds, user.id)
      
      case 'update':
        return await handleBulkUpdate(supabase, entityType, entityIds, updates, user.id)
      
      case 'duplicate':
        return await handleBulkDuplicate(supabase, entityType, entityIds, user.id)
      
      case 'archive':
        return await handleBulkArchive(supabase, entityType, entityIds, user.id)
      
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

  for (const id of entityIds) {
    try {
      await secureUpdate(supabase, entityType, id, updates, userId)
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
      const { id: _, created_at, updated_at, ...rest } = original
      const duplicate = {
        ...rest,
        name: `${original.name} (copie)`,
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
