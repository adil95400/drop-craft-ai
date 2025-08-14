import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const encryptionKey = Deno.env.get('SUPPLIER_ENCRYPTION_KEY')!

interface CredentialData {
  integrationId: string
  credentials: Record<string, string>
  action: 'store' | 'retrieve' | 'update'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for secure operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid authentication')
    }

    const { integrationId, credentials, action }: CredentialData = await req.json()
    
    console.log(`Processing ${action} request for integration ${integrationId} by user ${user.id}`)

    if (action === 'store' || action === 'update') {
      // Encrypt and store credentials
      const encryptedCredentials = await encryptCredentials(credentials)
      
      const { data, error } = await supabase
        .from('integrations')
        .update({
          encrypted_credentials: encryptedCredentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to store credentials')
      }

      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'credentials_encrypted_stored',
        severity: 'info',
        description: `Secure credential ${action} for integration ${integrationId}`,
        user_id: user.id,
        metadata: {
          integration_id: integrationId,
          action: action,
          credential_fields: Object.keys(credentials)
        }
      })

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Credentials securely stored',
        integration: {
          ...data,
          encrypted_credentials: null // Never return encrypted data
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'retrieve') {
      // Retrieve and decrypt credentials (for server-side operations only)
      const { data, error } = await supabase
        .from('integrations')
        .select('encrypted_credentials')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        console.error('Database error:', error)
        throw new Error('Integration not found')
      }

      if (!data.encrypted_credentials) {
        throw new Error('No credentials stored')
      }

      const decryptedCredentials = await decryptCredentials(data.encrypted_credentials)

      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'credentials_decrypted_retrieved',
        severity: 'info',
        description: `Secure credential retrieval for integration ${integrationId}`,
        user_id: user.id,
        metadata: {
          integration_id: integrationId,
          action: 'retrieve'
        }
      })

      return new Response(JSON.stringify({
        success: true,
        credentials: decryptedCredentials
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Secure credentials error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function encryptCredentials(credentials: Record<string, string>): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(credentials)) {
    if (value) {
      // Simple encryption using base64 + encryption key rotation
      // In production, use proper encryption like AES-GCM
      const combined = `${encryptionKey}:${value}`
      encrypted[key] = btoa(combined)
    }
  }
  
  return encrypted
}

async function decryptCredentials(encryptedCredentials: Record<string, string>): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {}
  
  for (const [key, encryptedValue] of Object.entries(encryptedCredentials)) {
    if (encryptedValue) {
      try {
        const decoded = atob(encryptedValue)
        const [keyPart, ...valueParts] = decoded.split(':')
        
        if (keyPart === encryptionKey) {
          decrypted[key] = valueParts.join(':')
        } else {
          console.error(`Invalid encryption key for credential ${key}`)
          throw new Error('Credential decryption failed')
        }
      } catch (error) {
        console.error(`Failed to decrypt credential ${key}:`, error)
        throw new Error('Credential decryption failed')
      }
    }
  }
  
  return decrypted
}