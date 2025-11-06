import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Import our connector classes (adapted for Deno)
interface ConnectorCredentials {
  [key: string]: string | number | boolean;
}

interface ConnectionTestResult {
  success: boolean;
  error?: string;
  data?: any;
}

interface TestRequest {
  platform: string;
  shopDomain: string;
  [key: string]: any;
}

class StoreConnectionTester {
  private async testShopifyConnection(domain: string, accessToken: string): Promise<ConnectionTestResult> {
    try {
      const shopDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const baseUrl = shopDomain.includes('.myshopify.com') ? 
        `https://${shopDomain}` : 
        `https://${shopDomain}.myshopify.com`;

      const response = await fetch(`${baseUrl}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          shop: data.shop?.name,
          domain: data.shop?.domain,
          currency: data.shop?.currency,
          timezone: data.shop?.timezone
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion Shopify: ${error.message}`
      };
    }
  }

  private async testWooCommerceConnection(domain: string, consumerKey: string, consumerSecret: string): Promise<ConnectionTestResult> {
    try {
      const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      const credentials = btoa(`${consumerKey}:${consumerSecret}`);
      
      const response = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          version: data.environment?.version,
          currency: data.settings?.currency,
          base_location: data.settings?.base_location
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion WooCommerce: ${error.message}`
      };
    }
  }

  private async testPrestaShopConnection(domain: string, webserviceKey: string): Promise<ConnectionTestResult> {
    try {
      const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      
      const response = await fetch(`${baseUrl}/api/shops?ws_key=${webserviceKey}&output_format=JSON`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          shops: data.shops || data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion PrestaShop: ${error.message}`
      };
    }
  }

  private async testMagentoConnection(domain: string, accessToken: string): Promise<ConnectionTestResult> {
    try {
      const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      
      const response = await fetch(`${baseUrl}/rest/V1/store/storeConfigs`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          stores: data.length || 0,
          currency: data[0]?.base_currency_code,
          locale: data[0]?.locale
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erreur de connexion Magento: ${error.message}`
      };
    }
  }

  async testConnection(request: TestRequest): Promise<ConnectionTestResult> {
    const { platform, shopDomain } = request;

    switch (platform.toLowerCase()) {
      case 'shopify':
        return await this.testShopifyConnection(shopDomain, request.access_token);
      
      case 'woocommerce':
        return await this.testWooCommerceConnection(shopDomain, request.consumer_key, request.consumer_secret);
      
      case 'prestashop':
        return await this.testPrestaShopConnection(shopDomain, request.webservice_key);
      
      case 'magento':
        return await this.testMagentoConnection(shopDomain, request.access_token);
      
      default:
        return {
          success: false,
          error: `Plateforme ${platform} non supportée pour le test de connexion`
        };
    }
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user is authenticated by validating the JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('User not authenticated')
    }
    
    console.log('User authenticated:', user.id)

    // Parse the request body
    const requestBody: TestRequest = await req.json()
    
    // Validate required fields
    if (!requestBody.platform || !requestBody.shopDomain) {
      throw new Error('Platform and shopDomain are required')
    }

    // Test the store connection
    const tester = new StoreConnectionTester()
    const result = await tester.testConnection(requestBody)

    // Log the connection test attempt
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'connection_test',
      description: `Test de connexion ${requestBody.platform}: ${result.success ? 'Succès' : 'Échec'}`,
      entity_type: 'store_connection',
      metadata: {
        platform: requestBody.platform,
        domain: requestBody.shopDomain,
        success: result.success,
        error: result.error
      }
    })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Store connection test error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur interne du serveur' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})