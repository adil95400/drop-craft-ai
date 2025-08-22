import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'store' | 'retrieve' | 'update' | 'delete'
  integrationId?: string
  credentials?: {
    api_key?: string
    api_secret?: string
    access_token?: string
    refresh_token?: string
    encrypted_credentials?: Record<string, any>
  }
  additionalAuth?: string
  ipAddress?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Secure Integration Credentials Request:', req.method);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const body: RequestBody = await req.json();
    const { action, integrationId, credentials, additionalAuth, ipAddress } = body;

    console.log(`🔐 Processing ${action} action for user ${user.id}`);

    // Get encryption key
    const encryptionKey = Deno.env.get('SUPPLIER_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Verify integration ownership
    if (integrationId) {
      const { data: integration, error: integrationError } = await supabaseClient
        .from('integrations')
        .select('user_id, require_additional_auth')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

      if (integrationError || !integration) {
        throw new Error('Integration not found or access denied');
      }

      // Check if additional auth is required
      if (integration.require_additional_auth && !additionalAuth) {
        return new Response(
          JSON.stringify({ 
            error: 'Additional authentication required',
            requiresAdditionalAuth: true 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Log credential access
      await supabaseClient.rpc('log_credential_access', {
        integration_id: integrationId,
        access_type: action,
        user_id_param: user.id,
        ip_address_param: ipAddress
      });
    }

    let result: any = {};

    switch (action) {
      case 'store':
        if (!integrationId || !credentials) {
          throw new Error('Missing required fields for store action');
        }

        // Encrypt sensitive credentials
        const encryptedData: Record<string, string> = {};
        
        if (credentials.api_key) {
          encryptedData.api_key = await encryptString(credentials.api_key, encryptionKey);
        }
        if (credentials.api_secret) {
          encryptedData.api_secret = await encryptString(credentials.api_secret, encryptionKey);
        }
        if (credentials.access_token) {
          encryptedData.access_token = await encryptString(credentials.access_token, encryptionKey);
        }
        if (credentials.refresh_token) {
          encryptedData.refresh_token = await encryptString(credentials.refresh_token, encryptionKey);
        }
        if (credentials.encrypted_credentials) {
          encryptedData.encrypted_credentials = await encryptString(
            JSON.stringify(credentials.encrypted_credentials), 
            encryptionKey
          );
        }

        // Store encrypted credentials
        const { error: storeError } = await supabaseClient
          .from('integrations')
          .update({
            ...encryptedData,
            credential_encryption_version: 3, // Updated version for enhanced encryption
            updated_at: new Date().toISOString()
          })
          .eq('id', integrationId)
          .eq('user_id', user.id);

        if (storeError) {
          throw new Error('Failed to store credentials: ' + storeError.message);
        }

        result = { success: true, message: 'Credentials stored securely' };
        break;

      case 'retrieve':
        if (!integrationId) {
          throw new Error('Missing integration ID for retrieve action');
        }

        // Retrieve encrypted credentials (service role bypasses RLS)
        const { data: integrationData, error: retrieveError } = await supabaseClient
          .from('integrations')
          .select('api_key, api_secret, access_token, refresh_token, encrypted_credentials, credential_encryption_version')
          .eq('id', integrationId)
          .eq('user_id', user.id)
          .single();

        if (retrieveError || !integrationData) {
          throw new Error('Failed to retrieve credentials');
        }

        // Decrypt credentials
        const decryptedCredentials: Record<string, any> = {};
        
        if (integrationData.api_key) {
          decryptedCredentials.api_key = await decryptString(integrationData.api_key, encryptionKey);
        }
        if (integrationData.api_secret) {
          decryptedCredentials.api_secret = await decryptString(integrationData.api_secret, encryptionKey);
        }
        if (integrationData.access_token) {
          decryptedCredentials.access_token = await decryptString(integrationData.access_token, encryptionKey);
        }
        if (integrationData.refresh_token) {
          decryptedCredentials.refresh_token = await decryptString(integrationData.refresh_token, encryptionKey);
        }
        if (integrationData.encrypted_credentials) {
          const decryptedStr = await decryptString(integrationData.encrypted_credentials, encryptionKey);
          decryptedCredentials.encrypted_credentials = JSON.parse(decryptedStr);
        }

        result = { 
          success: true, 
          credentials: decryptedCredentials,
          encryptionVersion: integrationData.credential_encryption_version
        };
        break;

      case 'delete':
        if (!integrationId) {
          throw new Error('Missing integration ID for delete action');
        }

        // Clear all credentials
        const { error: deleteError } = await supabaseClient
          .from('integrations')
          .update({
            api_key: null,
            api_secret: null,
            access_token: null,
            refresh_token: null,
            encrypted_credentials: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', integrationId)
          .eq('user_id', user.id);

        if (deleteError) {
          throw new Error('Failed to delete credentials: ' + deleteError.message);
        }

        result = { success: true, message: 'Credentials deleted securely' };
        break;

      default:
        throw new Error('Invalid action specified');
    }

    console.log(`✅ ${action} action completed successfully`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Secure credentials error:', error.message);

    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Enhanced AES-GCM encryption with PBKDF2 key derivation and versioning
async function encryptString(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Use PBKDF2 to derive a secure key from the provided key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // Combine version, salt, iv, and encrypted data
  const result = new Uint8Array(1 + salt.length + iv.length + encrypted.byteLength);
  result.set([2], 0); // Version 2 (enhanced)
  result.set(salt, 1);
  result.set(iv, 1 + salt.length);
  result.set(new Uint8Array(encrypted), 1 + salt.length + iv.length);
  
  return btoa(String.fromCharCode(...result));
}

async function decryptString(encryptedData: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const data = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map(char => char.charCodeAt(0))
  );
  
  const version = data[0];
  
  // Handle legacy version (version 1 or unversioned)
  if (version !== 2) {
    return decryptStringLegacy(encryptedData, key);
  }
  
  const salt = data.slice(1, 17);
  const iv = data.slice(17, 29);
  const encrypted = data.slice(29);
  
  // Derive the same key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

// Legacy decryption for backward compatibility
async function decryptStringLegacy(encryptedData: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  return decoder.decode(decrypted);
}