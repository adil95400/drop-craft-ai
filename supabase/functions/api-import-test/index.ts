import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  authentication: {
    type: 'none' | 'bearer' | 'api_key' | 'basic'
    token?: string
    username?: string
    password?: string
    api_key_header?: string
    api_key_value?: string
  }
  pagination: {
    enabled: boolean
    type: 'offset' | 'cursor' | 'page'
    page_param?: string
    size_param?: string
    max_pages?: number
  }
  data_path: string
  field_mapping: Record<string, string>
}

function evaluateJSONPath(obj: any, path: string): any {
  if (path === '$') return obj
  
  // Simple JSONPath evaluation
  const parts = path.replace(/^\$\.?/, '').split('.')
  let current = obj
  
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = current[part]
    } else {
      return null
    }
  }
  
  return current
}

function buildHeaders(config: APIConfig): Record<string, string> {
  const headers = { ...config.headers }
  
  switch (config.authentication.type) {
    case 'bearer':
      if (config.authentication.token) {
        headers['Authorization'] = `Bearer ${config.authentication.token}`
      }
      break
    case 'api_key':
      if (config.authentication.api_key_header && config.authentication.api_key_value) {
        headers[config.authentication.api_key_header] = config.authentication.api_key_value
      }
      break
    case 'basic':
      if (config.authentication.username && config.authentication.password) {
        const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`)
        headers['Authorization'] = `Basic ${credentials}`
      }
      break
  }
  
  return headers
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { config }: { config: APIConfig } = await req.json()

    // Validate required fields
    if (!config.url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Build request headers
    const headers = buildHeaders(config)

    // Build request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    }

    // Add body for POST requests
    if (config.method === 'POST' && config.body) {
      requestOptions.body = config.body
    }

    // Make the API request
    console.log(`Testing API: ${config.method} ${config.url}`)
    const response = await fetch(config.url, requestOptions)
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`,
          products_found: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const data = await response.json()
    console.log('API Response received, processing...')

    // Extract products array using JSONPath
    const productsData = evaluateJSONPath(data, config.data_path)
    
    if (!productsData) {
      return new Response(
        JSON.stringify({
          success: false,
          status: response.status,
          error: `No data found at path: ${config.data_path}`,
          products_found: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Ensure we have an array
    const products = Array.isArray(productsData) ? productsData : [productsData]
    
    console.log(`Found ${products.length} products`)

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        products_found: products.length,
        sample_product: products[0] || null,
        data: {
          total: products.length,
          sample: products.slice(0, 3)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('API test error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        products_found: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})