import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// OpenAPI/Swagger documentation
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "E-commerce API",
    version: "1.0.0",
    description: "API publique pour gérer les produits, commandes et clients",
    contact: {
      name: "API Support",
      email: "support@example.com"
    }
  },
  servers: [
    {
      url: "https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/public-api",
      description: "Production server"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key"
      }
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          stock: { type: "number" },
          category: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          customer_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          total_amount: { type: "number" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" }
        }
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/docs": {
      get: {
        summary: "Get API documentation",
        tags: ["Documentation"],
        security: [],
        responses: {
          "200": {
            description: "OpenAPI specification",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          }
        }
      }
    },
    "/products": {
      get: {
        summary: "List all products",
        tags: ["Products"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 }
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" }
                    },
                    count: { type: "integer" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new product",
        tags: ["Products"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "price"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  stock: { type: "number" },
                  category: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Product created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          }
        }
      }
    },
    "/products/{id}": {
      get: {
        summary: "Get a product by ID",
        tags: ["Products"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Product details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          "404": {
            description: "Product not found"
          }
        }
      },
      put: {
        summary: "Update a product",
        tags: ["Products"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  stock: { type: "number" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Product updated"
          }
        }
      },
      delete: {
        summary: "Delete a product",
        tags: ["Products"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "204": {
            description: "Product deleted"
          }
        }
      }
    },
    "/orders": {
      get: {
        summary: "List all orders",
        tags: ["Orders"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 }
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "List of orders"
          }
        }
      }
    }
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/public-api', '');
    const method = req.method;

    // Documentation endpoint (no auth required)
    if (path === '/docs' || path === '/') {
      return new Response(JSON.stringify(openApiSpec), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key and get user
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id, permissions, is_active')
      .eq('key', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = apiKeyData.user_id;

    // Route handling
    if (path.startsWith('/products')) {
      return await handleProducts(req, supabase, userId, path, method);
    } else if (path.startsWith('/orders')) {
      return await handleOrders(req, supabase, userId, path, method);
    } else if (path.startsWith('/customers')) {
      return await handleCustomers(req, supabase, userId, path, method);
    }

    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleProducts(req: Request, supabase: any, userId: string, path: string, method: string) {
  const url = new URL(req.url);

  if (method === 'GET' && path === '/products') {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const category = url.searchParams.get('category');

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({ data, count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (method === 'POST' && path === '/products') {
    const body = await req.json();
    
    const { data, error } = await supabase
      .from('products')
      .insert({ ...body, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (method === 'GET' && path.match(/\/products\/[a-f0-9-]+$/)) {
    const productId = path.split('/').pop();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (method === 'PUT' && path.match(/\/products\/[a-f0-9-]+$/)) {
    const productId = path.split('/').pop();
    const body = await req.json();
    
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (method === 'DELETE' && path.match(/\/products\/[a-f0-9-]+$/)) {
    const productId = path.split('/').pop();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleOrders(req: Request, supabase: any, userId: string, path: string, method: string) {
  const url = new URL(req.url);

  if (method === 'GET' && path === '/orders') {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const status = url.searchParams.get('status');

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleCustomers(req: Request, supabase: any, userId: string, path: string, method: string) {
  if (method === 'GET' && path === '/customers') {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, status, total_spent, created_at')
      .eq('user_id', userId)
      .limit(50);

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
