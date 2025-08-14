import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple encryption/decryption using Web Crypto API
async function encryptCredentials(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyData,
    encoder.encode(data)
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptCredentials(encryptedData: string, key: string): Promise<string> {
  const decoder = new TextDecoder();
  const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const keyData = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key.slice(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyData,
    encrypted
  );
  
  return decoder.decode(decrypted);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, supplierId, credentials } = await req.json();
    console.log(`Processing ${action} request for user ${user.id}`);

    const encryptionKey = Deno.env.get('SUPPLIER_ENCRYPTION_KEY') || 'default-key-change-in-production';

    if (action === 'encrypt') {
      // Encrypt and store supplier credentials
      if (!credentials || !supplierId) {
        return new Response(
          JSON.stringify({ error: 'Missing credentials or supplier ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Encrypt the credentials
      const encryptedData = await encryptCredentials(JSON.stringify(credentials), encryptionKey);

      // Store encrypted credentials in supplier record
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({ 
          encrypted_credentials: { data: encryptedData },
          api_key: null // Clear plain text api_key for security
        })
        .eq('id', supplierId)
        .eq('user_id', user.id); // Ensure user can only update their own suppliers

      if (updateError) {
        console.error('Failed to update supplier credentials:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to store credentials' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log security event
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'credentials_encrypted',
        severity: 'info',
        description: 'Supplier API credentials encrypted and stored securely',
        metadata: { supplier_id: supplierId, action: 'encrypt' }
      });

      console.log(`Successfully encrypted credentials for supplier ${supplierId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Credentials encrypted and stored' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'decrypt') {
      // Decrypt and return supplier credentials
      if (!supplierId) {
        return new Response(
          JSON.stringify({ error: 'Missing supplier ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get encrypted credentials from supplier record
      const { data: supplier, error: fetchError } = await supabase
        .from('suppliers')
        .select('encrypted_credentials')
        .eq('id', supplierId)
        .eq('user_id', user.id) // Ensure user can only access their own suppliers
        .single();

      if (fetchError || !supplier) {
        console.error('Failed to fetch supplier:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Supplier not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!supplier.encrypted_credentials?.data) {
        return new Response(
          JSON.stringify({ error: 'No encrypted credentials found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt the credentials
      const decryptedData = await decryptCredentials(supplier.encrypted_credentials.data, encryptionKey);
      const credentials = JSON.parse(decryptedData);

      // Log security event for credential access
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'credentials_accessed',
        severity: 'info',
        description: 'Supplier API credentials decrypted and accessed',
        metadata: { supplier_id: supplierId, action: 'decrypt' }
      });

      console.log(`Successfully decrypted credentials for supplier ${supplierId}`);
      return new Response(
        JSON.stringify({ success: true, credentials }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "encrypt" or "decrypt"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in secure-supplier-credentials function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});