// API Edge Function principale pour Drop Craft AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    rateLimit?: {
      remaining: number;
      resetTime: number;
    };
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Cache en mémoire pour le rate limiting
const rateLimitCache = new Map<string, RateLimitEntry>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/api/', '');
    const method = req.method;
    
    // Authentification API
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return createResponse({
        success: false,
        error: 'API key required'
      }, 401);
    }

    // Vérifier la clé API et récupérer l'utilisateur
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('api_keys')
      .select('user_id, permissions, rate_limit_per_hour, is_active')
      .eq('key_hash', await hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return createResponse({
        success: false,
        error: 'Invalid API key'
      }, 401);
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(apiKey, apiKeyData.rate_limit_per_hour);
    if (!rateLimitResult.allowed) {
      return createResponse({
        success: false,
        error: 'Rate limit exceeded',
        meta: {
          rateLimit: {
            remaining: 0,
            resetTime: rateLimitResult.resetTime
          }
        }
      }, 429);
    }

    // Router les requêtes
    const response = await routeRequest(path, method, req, supabaseClient, apiKeyData);
    
    // Ajouter les headers de rate limit
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    
    return response;

  } catch (error) {
    console.error('API Error:', error);
    return createResponse({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Router principal
async function routeRequest(
  path: string, 
  method: string, 
  req: Request, 
  supabase: any, 
  apiKeyData: any
): Promise<Response> {
  const segments = path.split('/').filter(Boolean);
  const resource = segments[0];
  const id = segments[1];
  const action = segments[2];

  // Vérifier les permissions
  if (!hasPermission(apiKeyData.permissions, resource, method)) {
    return createResponse({
      success: false,
      error: 'Insufficient permissions'
    }, 403);
  }

  switch (resource) {
    case 'products':
      return await handleProducts(method, id, action, req, supabase, apiKeyData.user_id);
    
    case 'orders':
      return await handleOrders(method, id, action, req, supabase, apiKeyData.user_id);
    
    case 'customers':
      return await handleCustomers(method, id, action, req, supabase, apiKeyData.user_id);
    
    case 'integrations':
      return await handleIntegrations(method, id, action, req, supabase, apiKeyData.user_id);
    
    case 'analytics':
      return await handleAnalytics(method, id, action, req, supabase, apiKeyData.user_id);
    
    case 'webhooks':
      return await handleWebhooks(method, id, action, req, supabase, apiKeyData.user_id);
    
    default:
      return createResponse({
        success: false,
        error: 'Resource not found'
      }, 404);
  }
}

// Gestionnaire des produits
async function handleProducts(
  method: string,
  id: string | undefined,
  action: string | undefined,
  req: Request,
  supabase: any,
  userId: string
): Promise<Response> {
  try {
    switch (method) {
      case 'GET':
        if (id) {
          // Récupérer un produit spécifique
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

          if (error) throw error;

          return createResponse({
            success: true,
            data
          });
        } else {
          // Récupérer la liste des produits
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
          const search = url.searchParams.get('search');
          const category = url.searchParams.get('category');
          const status = url.searchParams.get('status');

          let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

          if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
          }
          if (category) {
            query = query.eq('category', category);
          }
          if (status) {
            query = query.eq('status', status);
          }

          const { data, error, count } = await query
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return createResponse({
            success: true,
            data,
            meta: {
              total: count || 0,
              page,
              limit
            }
          });
        }

      case 'POST':
        // Créer un nouveau produit
        const productData = await req.json();
        
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...productData,
            user_id: userId
          })
          .select()
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data,
          message: 'Product created successfully'
        }, 201);

      case 'PUT':
        if (!id) {
          return createResponse({
            success: false,
            error: 'Product ID required'
          }, 400);
        }

        // Mettre à jour un produit
        const updateData = await req.json();
        
        const { data: updatedData, error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        return createResponse({
          success: true,
          data: updatedData,
          message: 'Product updated successfully'
        });

      case 'DELETE':
        if (!id) {
          return createResponse({
            success: false,
            error: 'Product ID required'
          }, 400);
        }

        // Supprimer un produit
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        return createResponse({
          success: true,
          message: 'Product deleted successfully'
        });

      default:
        return createResponse({
          success: false,
          error: 'Method not allowed'
        }, 405);
    }
  } catch (error) {
    return createResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

// Gestionnaire des commandes
async function handleOrders(
  method: string,
  id: string | undefined,
  action: string | undefined,
  req: Request,
  supabase: any,
  userId: string
): Promise<Response> {
  try {
    switch (method) {
      case 'GET':
        if (id) {
          if (action === 'items') {
            // Récupérer les items d'une commande
            const { data, error } = await supabase
              .from('order_items')
              .select(`
                *,
                product:products(name, price, image_url)
              `)
              .eq('order_id', id);

            if (error) throw error;

            return createResponse({
              success: true,
              data
            });
          } else {
            // Récupérer une commande spécifique
            const { data, error } = await supabase
              .from('orders')
              .select(`
                *,
                customer:customers(name, email),
                items:order_items(*)
              `)
              .eq('id', id)
              .eq('user_id', userId)
              .single();

            if (error) throw error;

            return createResponse({
              success: true,
              data
            });
          }
        } else {
          // Récupérer la liste des commandes
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
          const status = url.searchParams.get('status');
          const customerId = url.searchParams.get('customer_id');

          let query = supabase
            .from('orders')
            .select(`
              *,
              customer:customers(name, email)
            `, { count: 'exact' })
            .eq('user_id', userId);

          if (status) {
            query = query.eq('status', status);
          }
          if (customerId) {
            query = query.eq('customer_id', customerId);
          }

          const { data, error, count } = await query
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return createResponse({
            success: true,
            data,
            meta: {
              total: count || 0,
              page,
              limit
            }
          });
        }

      case 'POST':
        // Créer une nouvelle commande
        const orderData = await req.json();
        
        const { data, error } = await supabase
          .from('orders')
          .insert({
            ...orderData,
            user_id: userId,
            order_number: `ORD-${Date.now()}`
          })
          .select()
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data,
          message: 'Order created successfully'
        }, 201);

      case 'PUT':
        if (!id) {
          return createResponse({
            success: false,
            error: 'Order ID required'
          }, 400);
        }

        if (action === 'status') {
          // Mettre à jour le statut d'une commande
          const { status } = await req.json();
          
          const { data: updatedData, error: updateError } = await supabase
            .from('orders')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;

          return createResponse({
            success: true,
            data: updatedData,
            message: 'Order status updated successfully'
          });
        } else {
          // Mettre à jour une commande complète
          const updateData = await req.json();
          
          const { data: updatedData, error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;

          return createResponse({
            success: true,
            data: updatedData,
            message: 'Order updated successfully'
          });
        }

      default:
        return createResponse({
          success: false,
          error: 'Method not allowed'
        }, 405);
    }
  } catch (error) {
    return createResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

// Gestionnaire des clients
async function handleCustomers(
  method: string,
  id: string | undefined,
  action: string | undefined,
  req: Request,
  supabase: any,
  userId: string
): Promise<Response> {
  try {
    switch (method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('customers')
            .select(`
              *,
              orders:orders(id, order_number, status, total_amount, created_at)
            `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();

          if (error) throw error;

          return createResponse({
            success: true,
            data
          });
        } else {
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
          const search = url.searchParams.get('search');

          let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('user_id', userId);

          if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
          }

          const { data, error, count } = await query
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false });

          if (error) throw error;

          return createResponse({
            success: true,
            data,
            meta: {
              total: count || 0,
              page,
              limit
            }
          });
        }

      case 'POST':
        const customerData = await req.json();
        
        const { data, error } = await supabase
          .from('customers')
          .insert({
            ...customerData,
            user_id: userId
          })
          .select()
          .single();

        if (error) throw error;

        return createResponse({
          success: true,
          data,
          message: 'Customer created successfully'
        }, 201);

      default:
        return createResponse({
          success: false,
          error: 'Method not allowed'
        }, 405);
    }
  } catch (error) {
    return createResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

// Gestionnaire des intégrations (placeholder)
async function handleIntegrations(method: string, id: string | undefined, action: string | undefined, req: Request, supabase: any, userId: string): Promise<Response> {
  return createResponse({
    success: false,
    error: 'Integrations endpoint not implemented yet'
  }, 501);
}

// Gestionnaire des analytics (placeholder)
async function handleAnalytics(method: string, id: string | undefined, action: string | undefined, req: Request, supabase: any, userId: string): Promise<Response> {
  return createResponse({
    success: false,
    error: 'Analytics endpoint not implemented yet'
  }, 501);
}

// Gestionnaire des webhooks (placeholder)
async function handleWebhooks(method: string, id: string | undefined, action: string | undefined, req: Request, supabase: any, userId: string): Promise<Response> {
  return createResponse({
    success: false,
    error: 'Webhooks endpoint not implemented yet'
  }, 501);
}

// Utilitaires
function createResponse(data: APIResponse, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(apiKey: string, limitPerHour: number): Promise<{allowed: boolean, remaining: number, resetTime: number}> {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const resetTime = Math.ceil(now / hourInMs) * hourInMs;
  
  const entry = rateLimitCache.get(apiKey);
  
  if (!entry || entry.resetTime <= now) {
    // Nouvelle période ou entrée expirée
    rateLimitCache.set(apiKey, {
      count: 1,
      resetTime
    });
    
    return {
      allowed: true,
      remaining: limitPerHour - 1,
      resetTime
    };
  }
  
  if (entry.count >= limitPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  entry.count++;
  
  return {
    allowed: true,
    remaining: limitPerHour - entry.count,
    resetTime: entry.resetTime
  };
}

function hasPermission(permissions: string[], resource: string, method: string): boolean {
  if (permissions.includes('admin')) return true;
  
  const action = method.toLowerCase();
  const permission = `${resource}:${action}`;
  
  return permissions.includes(permission) || 
         permissions.includes(`${resource}:*`) ||
         permissions.includes('*');
}