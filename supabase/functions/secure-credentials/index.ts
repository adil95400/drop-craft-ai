import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ENCRYPTION_KEY_NAME = 'CREDENTIALS_ENCRYPTION_KEY'

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
      // Encrypt credentials using AES-256-GCM
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
        message: 'Credentials securely stored with AES-256-GCM encryption',
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

/**
 * Get or generate encryption key from environment
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyString = Deno.env.get(ENCRYPTION_KEY_NAME);
  
  if (!keyString) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY not configured in environment');
  }

  // Convert base64 key to ArrayBuffer
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  
  // Import the key for AES-GCM
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt credentials using AES-256-GCM
 * Returns base64-encoded: IV + encrypted data + auth tag
 */
async function encryptCredentials(
  credentials: Record<string, string>
): Promise<Record<string, string>> {
  const key = await getEncryptionKey();
  const encrypted: Record<string, string> = {};

  for (const [field, value] of Object.entries(credentials)) {
    if (!value) {
      encrypted[field] = '';
      continue;
    }

    // Generate random 12-byte IV (recommended for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the value
    const encodedValue = new TextEncoder().encode(value);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedValue
    );

    // Combine IV + encrypted data for storage
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Encode as base64 for storage
    encrypted[field] = btoa(String.fromCharCode(...combined));
  }

  return encrypted;
}

/**
 * Decrypt credentials using AES-256-GCM
 * Expects base64-encoded: IV + encrypted data + auth tag
 */
async function decryptCredentials(
  encryptedCredentials: Record<string, string>
): Promise<Record<string, string>> {
  const key = await getEncryptionKey();
  const decrypted: Record<string, string> = {};

  for (const [field, encryptedValue] of Object.entries(encryptedCredentials)) {
    if (!encryptedValue) {
      decrypted[field] = '';
      continue;
    }

    try {
      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));
      
      // Extract IV (first 12 bytes) and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      // Decrypt
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      decrypted[field] = new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error(`Failed to decrypt field ${field}:`, error);
      throw new Error(`Decryption failed for ${field} - possible key mismatch or data corruption`);
    }
  }

  return decrypted;
}
