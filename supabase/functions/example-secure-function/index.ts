/**
 * Example Secure Edge Function
 * Demonstrates best practices for authentication, error handling, and tenant isolation
 */

import { verifyAuth } from '../_shared/secure-auth.ts'
import { handleError, withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { secureQuery, secureUpdate } from '../_shared/db-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Verify authentication (automatically includes rate limiting)
  const { user, supabase } = await verifyAuth(req)

  console.log(`Authenticated user: ${user.id}`)

  // Example: GET request
  if (req.method === 'GET') {
    // Secure query - automatically filters by user_id
    const { data, error } = await secureQuery(supabase, 'products', user.id)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        user_id: user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Example: POST request with validation
  if (req.method === 'POST') {
    const body = await req.json()

    // Validate input
    if (!body.name || typeof body.name !== 'string') {
      throw new ValidationError('Name is required and must be a string')
    }

    if (body.price && (typeof body.price !== 'number' || body.price < 0)) {
      throw new ValidationError('Price must be a positive number')
    }

    // Insert with automatic tenant isolation
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...body,
        user_id: user.id // Enforce tenant isolation
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  // Example: PUT/PATCH request with secure update
  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      throw new ValidationError('Product ID is required')
    }

    // Secure update - verifies user owns the resource
    const updated = await secureUpdate(
      supabase,
      'products',
      id,
      updates,
      user.id
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: updated
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

// Wrap with error handler for automatic error management
Deno.serve(withErrorHandler(handler, corsHeaders))
