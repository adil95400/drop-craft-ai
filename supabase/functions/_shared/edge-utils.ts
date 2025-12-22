/**
 * Utilitaires centralisés pour toutes les Edge Functions
 * Fournit logging, erreur handling, timeout, et validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'

// Types
export interface EdgeFunctionContext {
  supabase: ReturnType<typeof createClient>
  user: { id: string; email?: string } | null
  startTime: number
}

export interface EdgeFunctionOptions {
  requireAuth?: boolean
  timeoutMs?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Crée un client Supabase avec le service role
 */
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Extrait et valide l'utilisateur depuis le token JWT
 */
export async function extractUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    console.warn('[Auth] Error extracting user:', error.message)
    return null
  }
  
  return user
}

/**
 * Logger structuré pour edge functions
 */
export const logger = {
  debug: (functionName: string, message: string, data?: any) => {
    console.log(`[${functionName}] DEBUG: ${message}`, data ? JSON.stringify(data) : '')
  },
  info: (functionName: string, message: string, data?: any) => {
    console.log(`[${functionName}] INFO: ${message}`, data ? JSON.stringify(data) : '')
  },
  warn: (functionName: string, message: string, data?: any) => {
    console.warn(`[${functionName}] WARN: ${message}`, data ? JSON.stringify(data) : '')
  },
  error: (functionName: string, message: string, error?: any) => {
    console.error(`[${functionName}] ERROR: ${message}`, error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error)
  }
}

/**
 * Réponse JSON standardisée avec CORS
 */
export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Réponse d'erreur standardisée
 */
export function errorResponse(message: string, status = 500, details?: any) {
  console.error(`[Error Response] ${status}: ${message}`, details)
  return new Response(JSON.stringify({ 
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

/**
 * Handler CORS pour OPTIONS
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

/**
 * Wrapper pour edge function avec gestion automatique
 */
export function createEdgeFunction(
  functionName: string,
  handler: (req: Request, ctx: EdgeFunctionContext) => Promise<Response>,
  options: EdgeFunctionOptions = {}
) {
  const { requireAuth = true, timeoutMs = 25000 } = options
  
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now()
    
    // Handle CORS
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse
    
    logger.info(functionName, 'Request received', {
      method: req.method,
      url: req.url
    })
    
    try {
      const supabase = createServiceClient()
      let user = null
      
      // Auth check
      if (requireAuth) {
        user = await extractUser(req, supabase)
        if (!user) {
          return errorResponse('Authentication required', 401)
        }
      }
      
      // Create context
      const ctx: EdgeFunctionContext = { supabase, user, startTime }
      
      // Execute with timeout
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout')), timeoutMs)
      })
      
      const result = await Promise.race([
        handler(req, ctx),
        timeoutPromise
      ])
      
      const duration = Date.now() - startTime
      logger.info(functionName, 'Request completed', { duration, status: 200 })
      
      return result
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      if (error instanceof Error) {
        if (error.message === 'Function timeout') {
          logger.error(functionName, 'Request timed out', { duration, timeoutMs })
          return errorResponse('Request timed out', 504)
        }
        
        logger.error(functionName, 'Request failed', error)
        return errorResponse(error.message, 500)
      }
      
      return errorResponse('Unknown error', 500)
    }
  }
}

/**
 * Valide le body JSON de la requête
 */
export async function parseBody<T>(req: Request): Promise<T> {
  try {
    return await req.json() as T
  } catch {
    throw new Error('Invalid JSON body')
  }
}

/**
 * Check si une variable d'environnement existe
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
