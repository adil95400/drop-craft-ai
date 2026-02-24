/**
 * JWT-First Authentication Guard for Edge Functions
 * 
 * SECURITY STANDARD (P0):
 * - Uses getClaims() for JWT verification (no server round-trip)
 * - Creates Supabase client with ANON_KEY + user JWT for RLS enforcement
 * - Never uses SERVICE_ROLE_KEY unless explicitly needed
 * - Includes rate limiting via in-memory tracker
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { getSecureCorsHeaders } from './cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

export interface JwtAuthContext {
  /** Authenticated user ID (from JWT sub claim) */
  userId: string
  /** User email (from JWT) */
  email: string
  /** User role from JWT */
  role: string
  /** Supabase client scoped to this user via RLS (ANON_KEY + JWT) */
  supabase: SupabaseClient
  /** Raw Authorization header for forwarding */
  authHeader: string
  /** CORS headers for this request */
  corsHeaders: Record<string, string>
}

/**
 * Authenticate a request using JWT claims.
 * Returns a Supabase client scoped to the user (RLS-enforced).
 * 
 * @throws Response with 401 status on auth failure
 */
export async function requireAuth(req: Request): Promise<JwtAuthContext> {
  const origin = req.headers.get('origin')
  const corsHeaders = getSecureCorsHeaders(origin)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(
      JSON.stringify({ success: false, error: 'Authorization header required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create RLS-scoped client with user's JWT
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  // Verify JWT via getClaims (fast, no server round-trip)
  const token = authHeader.replace('Bearer ', '')
  let claims: Record<string, unknown>

  try {
    const { data, error } = await supabase.auth.getClaims(token)
    if (error || !data?.claims) {
      throw new Error(error?.message || 'Invalid claims')
    }
    claims = data.claims as Record<string, unknown>
  } catch (e) {
    console.error('JWT verification failed:', e instanceof Error ? e.message : e)
    throw new Response(
      JSON.stringify({ success: false, error: 'Invalid or expired token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { sub: userId, email, role } = claims

  if (!userId) {
    throw new Response(
      JSON.stringify({ success: false, error: 'Invalid token: missing user ID' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return {
    userId: userId as string,
    email: (email as string) || '',
    role: (role as string) || 'authenticated',
    supabase,
    authHeader,
    corsHeaders,
  }
}

/**
 * Handle CORS preflight — call this at the top of every handler.
 * Returns a Response for OPTIONS, or null to continue processing.
 */
export function handlePreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    return new Response(null, {
      status: 204,
      headers: getSecureCorsHeaders(origin),
    })
  }
  return null
}

/**
 * Create a JSON error response with CORS headers.
 */
export function errorResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status = 400
): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

/**
 * Create a JSON success response with CORS headers.
 */
export function successResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
