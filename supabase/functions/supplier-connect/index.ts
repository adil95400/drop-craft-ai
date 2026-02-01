/**
 * Supplier Connect - Enterprise-Safe Implementation
 * 
 * Security:
 * - JWT authentication mandatory
 * - Strict CORS allowlist
 * - Rate limiting (10 connections/hour)
 * - Input validation
 * - Supplier ID allowlist
 * - No sensitive data logging
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Allowed supplier types (whitelist)
const ALLOWED_SUPPLIERS = new Set([
  'aliexpress',
  'cjdropshipping',
  'bigbuy',
  'printful',
  'printify',
  'spocket',
  'oberlo',
  'dsers',
  'salehoo',
  'worldwide_brands',
  'doba',
  'syncee',
  'modalyst',
  'inventory_source',
  'btswholesaler',
  'generic'
]);

interface SupplierConnectRequest {
  supplier_id: string;
  api_key?: string;
  settings?: Record<string, unknown>;
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

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

    // Rate limiting (10 connections/hour)
    const { count: recentConnections } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'supplier_connected')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((recentConnections || 0) >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Max 10 supplier connections per hour.' }),
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

    const { supplier_id, api_key, settings }: SupplierConnectRequest = body;

    // Validate supplier_id
    if (typeof supplier_id !== 'string' || supplier_id.length < 2 || supplier_id.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid supplier_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedSupplierId = supplier_id.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    
    if (!ALLOWED_SUPPLIERS.has(normalizedSupplierId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported supplier', 
          supported: Array.from(ALLOWED_SUPPLIERS) 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate api_key (optional but must be string if provided)
    if (api_key !== undefined && (typeof api_key !== 'string' || api_key.length > 500)) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate settings (optional)
    if (settings !== undefined && (typeof settings !== 'object' || settings === null)) {
      return new Response(
        JSON.stringify({ error: 'Invalid settings format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[supplier-connect] Connecting: ${normalizedSupplierId}, user: ${userId.slice(0, 8)}`);

    // Check for existing connection
    const { data: existingConnection } = await supabase
      .from('premium_supplier_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('supplier_id', normalizedSupplierId)
      .single();

    let connection;
    let isNew = false;

    if (existingConnection) {
      // Update existing connection
      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .update({
          status: 'active',
          last_sync_at: new Date().toISOString(),
          metadata: {
            has_api_key: !!api_key,
            ...(settings || {})
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .eq('user_id', userId) // Double-check user ownership
        .select()
        .single();

      if (error) throw error;
      connection = data;
    } else {
      // Create new connection - SCOPED TO USER
      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .insert({
          user_id: userId, // Always from auth, never from request
          supplier_id: normalizedSupplierId,
          status: 'active',
          last_sync_at: new Date().toISOString(),
          metadata: {
            has_api_key: !!api_key,
            ...(settings || {})
          }
        })
        .select()
        .single();

      if (error) throw error;
      connection = data;
      isNew = true;
    }

    // Store API key securely if provided (encrypt in a separate secure-credentials call)
    if (api_key) {
      // In production, call secure-credentials function to encrypt and store
      console.log(`[supplier-connect] API key provided for ${normalizedSupplierId} (encrypted storage pending)`);
    }

    // Log activity - never log sensitive data
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'supplier_connected',
      description: `Fournisseur ${normalizedSupplierId} ${isNew ? 'connecté' : 'mis à jour'}`,
      entity_type: 'supplier',
      entity_id: connection.id,
      details: { 
        supplier_id: normalizedSupplierId,
        is_new: isNew,
        has_api_key: !!api_key
      },
      source: 'supplier-connect'
    });

    console.log(`[supplier-connect] Success: ${normalizedSupplierId} (${isNew ? 'new' : 'updated'})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        connection: {
          id: connection.id,
          supplier_id: connection.supplier_id,
          status: connection.status,
          last_sync_at: connection.last_sync_at
        },
        is_new: isNew
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Supplier connect error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Connection failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
