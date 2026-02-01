/**
 * Secure Credentials - Enterprise-Safe Implementation
 * 
 * Security:
 * - JWT authentication mandatory
 * - Strict CORS allowlist
 * - Action allowlist (store, retrieve, update, delete)
 * - AES-256-GCM encryption
 * - Integration ownership verification
 * - Audit logging for all operations
 * - Rate limiting
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://app.shopopti.io',
  'https://shopopti.io',
  'https://drop-craft-ai.lovable.app'
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

const ENCRYPTION_KEY_NAME = 'CREDENTIALS_ENCRYPTION_KEY';

// Allowed actions
const ALLOWED_ACTIONS = new Set(['store', 'retrieve', 'update', 'delete']);

interface CredentialData {
  integrationId: string;
  credentials?: Record<string, string>;
  action: 'store' | 'retrieve' | 'update' | 'delete';
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Auth mandatory
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Rate limiting (30 operations/hour)
    const { count: recentOps } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('event_type', 'credentials_%')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((recentOps || 0) >= 30) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 30 credential operations per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { integrationId, credentials, action }: CredentialData = body;
    
    // Validate action
    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action', allowed: Array.from(ALLOWED_ACTIONS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate integrationId
    if (typeof integrationId !== 'string' || integrationId.length < 10 || integrationId.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid integrationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify integration ownership
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('id, user_id')
      .eq('id', integrationId)
      .eq('user_id', userId) // CRITICAL: Scope to user
      .single();

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[secure-credentials] ${action} for integration ${integrationId.slice(0, 8)}, user: ${userId.slice(0, 8)}`);

    if (action === 'store' || action === 'update') {
      // Validate credentials
      if (!credentials || typeof credentials !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Credentials object required for store/update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate credential values
      for (const [key, value] of Object.entries(credentials)) {
        if (typeof key !== 'string' || key.length > 100) {
          return new Response(
            JSON.stringify({ error: 'Invalid credential key' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (typeof value !== 'string' || value.length > 10000) {
          return new Response(
            JSON.stringify({ error: 'Invalid credential value' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Encrypt credentials
      const encryptedCredentials = await encryptCredentials(credentials);
      
      const { data, error } = await supabase
        .from('integrations')
        .update({
          encrypted_credentials: encryptedCredentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .eq('user_id', userId) // Double-check ownership
        .select('id, name, platform, updated_at')
        .single();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log security event (no sensitive data)
      await supabase.from('security_events').insert({
        event_type: `credentials_${action}`,
        severity: 'info',
        description: `Secure credential ${action} for integration`,
        user_id: userId,
        metadata: {
          integration_id: integrationId,
          action: action,
          credential_fields: Object.keys(credentials),
          fields_count: Object.keys(credentials).length
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Credentials securely ${action === 'store' ? 'stored' : 'updated'} with AES-256-GCM encryption`,
        integration: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'retrieve') {
      const { data, error } = await supabase
        .from('integrations')
        .select('encrypted_credentials')
        .eq('id', integrationId)
        .eq('user_id', userId) // CRITICAL: Scope to user
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Integration not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data.encrypted_credentials) {
        return new Response(
          JSON.stringify({ error: 'No credentials stored' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const decryptedCredentials = await decryptCredentials(data.encrypted_credentials);

      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'credentials_retrieve',
        severity: 'info',
        description: 'Secure credential retrieval',
        user_id: userId,
        metadata: {
          integration_id: integrationId,
          action: 'retrieve'
        }
      });

      return new Response(JSON.stringify({
        success: true,
        credentials: decryptedCredentials
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('integrations')
        .update({
          encrypted_credentials: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .eq('user_id', userId); // CRITICAL: Scope to user

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to delete credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'credentials_delete',
        severity: 'warn',
        description: 'Credentials deleted from integration',
        user_id: userId,
        metadata: {
          integration_id: integrationId,
          action: 'delete'
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Credentials deleted'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Secure credentials error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

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

    // Generate random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encodedValue = new TextEncoder().encode(value);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedValue
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    encrypted[field] = btoa(String.fromCharCode(...combined));
  }

  return encrypted;
}

/**
 * Decrypt credentials using AES-256-GCM
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
      const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
      );

      decrypted[field] = new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error(`Failed to decrypt field ${field}:`, error);
      throw new Error(`Decryption failed for ${field}`);
    }
  }

  return decrypted;
}
