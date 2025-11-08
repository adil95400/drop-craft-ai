import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestRequest {
  platform: string
  credentials: {
    api_key?: string
    api_secret?: string
    shop_url?: string
    shop_id?: string
    access_token?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const body: TestRequest = await req.json()
    
    console.log(`[TEST-CONNECTION] Testing ${body.platform} for user ${user.id}`)

    // Validate platform
    const validPlatforms = ['shopify', 'woocommerce', 'etsy', 'cdiscount', 'allegro', 'manomano', 'amazon', 'ebay', 'prestashop', 'rakuten', 'fnac']
    if (!validPlatforms.includes(body.platform)) {
      throw new Error(`Plateforme invalide: ${body.platform}`)
    }

    // Validate credentials format
    const validation = validateCredentialsFormat(body.platform, body.credentials)
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validation.error,
          details: 'Vérifiez que tous les champs requis sont remplis correctement'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test actual API connection
    const testResult = await testAPIConnection(body.platform, body.credentials)
    
    if (!testResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: testResult.error || 'Échec du test de connexion',
          details: testResult.details,
          docUrl: testResult.docUrl
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[TEST-CONNECTION] Test successful for ${body.platform}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Connexion à ${body.platform} réussie!`,
        details: testResult.details
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[TEST-CONNECTION] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Une erreur est survenue lors du test de connexion'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function validateCredentialsFormat(
  platform: string,
  credentials: TestRequest['credentials']
): { success: boolean; error?: string } {
  switch (platform) {
    case 'shopify':
      if (!credentials.shop_url || !credentials.access_token) {
        return { success: false, error: 'Shopify nécessite une URL de boutique et un token d\'accès' }
      }
      if (!credentials.shop_url.includes('.myshopify.com') && !credentials.shop_url.includes('http')) {
        return { success: false, error: 'L\'URL Shopify doit contenir .myshopify.com' }
      }
      break
    
    case 'woocommerce':
      if (!credentials.shop_url || !credentials.api_key || !credentials.api_secret) {
        return { success: false, error: 'WooCommerce nécessite une URL, une clé API et un secret API' }
      }
      break
    
    case 'etsy':
      if (!credentials.api_key || !credentials.shop_id) {
        return { success: false, error: 'Etsy nécessite une clé API et un ID de boutique' }
      }
      break
    
    case 'cdiscount':
    case 'rakuten':
    case 'fnac':
      if (!credentials.api_key) {
        return { success: false, error: `${platform} nécessite une clé API` }
      }
      break
    
    case 'allegro':
      if (!credentials.api_key || !credentials.access_token) {
        return { success: false, error: 'Allegro nécessite une clé API et un token d\'accès' }
      }
      break
    
    case 'manomano':
      if (!credentials.api_key || !credentials.shop_id) {
        return { success: false, error: 'ManoMano nécessite une clé API et un ID de boutique' }
      }
      break
    
    case 'prestashop':
      if (!credentials.shop_url || !credentials.api_key) {
        return { success: false, error: 'PrestaShop nécessite une URL de boutique et une clé API' }
      }
      break
    
    case 'amazon':
    case 'ebay':
      if (!credentials.api_key || !credentials.api_secret) {
        return { success: false, error: `${platform} nécessite une clé API et un secret API` }
      }
      break
    
    default:
      return { success: true }
  }

  return { success: true }
}

async function testAPIConnection(
  platform: string,
  credentials: TestRequest['credentials']
): Promise<{ success: boolean; error?: string; details?: string; docUrl?: string }> {
  try {
    switch (platform) {
      case 'shopify':
        return await testShopifyConnection(credentials)
      
      case 'woocommerce':
        return await testWooCommerceConnection(credentials)
      
      case 'etsy':
        return await testEtsyConnection(credentials)
      
      case 'prestashop':
        return await testPrestaShopConnection(credentials)
      
      // For platforms without specific tests yet, return success if format is valid
      default:
        return { 
          success: true, 
          details: 'Validation des identifiants réussie. Connexion API complète à implémenter.' 
        }
    }
  } catch (error) {
    console.error(`[TEST-CONNECTION] API test failed for ${platform}:`, error)
    return { 
      success: false, 
      error: 'Échec du test de connexion',
      details: error.message 
    }
  }
}

async function testShopifyConnection(
  credentials: TestRequest['credentials']
): Promise<{ success: boolean; error?: string; details?: string; docUrl?: string }> {
  try {
    let shopUrl = credentials.shop_url!
    
    // Clean and format URL
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!shopUrl.includes('.myshopify.com')) {
      shopUrl = `${shopUrl}.myshopify.com`
    }

    const apiUrl = `https://${shopUrl}/admin/api/2024-01/shop.json`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': credentials.access_token!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[SHOPIFY-TEST] API Error:', errorText)
      
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Token d\'accès Shopify invalide', 
          details: 'Vérifiez que votre token dispose des permissions nécessaires (read_products, write_products, etc.). Assurez-vous que votre application privée est correctement configurée.',
          docUrl: 'https://help.shopify.com/en/manual/apps/custom-apps'
        }
      }
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'Boutique Shopify non trouvée', 
          details: 'Vérifiez l\'URL de votre boutique (format: votre-boutique.myshopify.com). Assurez-vous que le domaine est correct et que la boutique existe.',
          docUrl: 'https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-your-store'
        }
      }
      
      return { 
        success: false, 
        error: `Erreur HTTP ${response.status}`, 
        details: `Une erreur inattendue s'est produite. ${errorText}`,
        docUrl: 'https://shopify.dev/api/admin-rest'
      }
    }

    const data = await response.json()
    return { 
      success: true, 
      details: `Connecté à la boutique: ${data.shop?.name || shopUrl}` 
    }
  } catch (error) {
    console.error('[SHOPIFY-TEST] Connection error:', error)
    return { 
      success: false, 
      error: 'Impossible de se connecter à Shopify',
      details: `Erreur de connexion: ${error.message}. Vérifiez votre connexion internet et que l'URL de la boutique est accessible.`,
      docUrl: 'https://help.shopify.com/en/manual/apps/custom-apps'
    }
  }
}

async function testWooCommerceConnection(
  credentials: TestRequest['credentials']
): Promise<{ success: boolean; error?: string; details?: string; docUrl?: string }> {
  try {
    let shopUrl = credentials.shop_url!
    shopUrl = shopUrl.replace(/\/$/, '')
    
    if (!shopUrl.startsWith('http')) {
      shopUrl = `https://${shopUrl}`
    }

    const apiUrl = `${shopUrl}/wp-json/wc/v3/system_status`
    const auth = btoa(`${credentials.api_key}:${credentials.api_secret}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Identifiants WooCommerce invalides', 
          details: 'Vérifiez que votre clé API et secret sont corrects. Assurez-vous d\'avoir créé une clé API avec les permissions "Lecture/Écriture" dans WooCommerce > Réglages > Avancé > REST API.',
          docUrl: 'https://woocommerce.com/document/woocommerce-rest-api/'
        }
      }
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'API WooCommerce non trouvée', 
          details: 'Vérifiez que WooCommerce est installé et activé sur votre site WordPress. Assurez-vous que l\'API REST est activée dans WooCommerce > Réglages > Avancé > REST API.',
          docUrl: 'https://woocommerce.com/document/woocommerce-rest-api/#section-1'
        }
      }
      
      return { 
        success: false, 
        error: `Erreur HTTP ${response.status}`,
        details: 'Une erreur inattendue s\'est produite lors de la connexion à WooCommerce.',
        docUrl: 'https://woocommerce.com/document/woocommerce-rest-api/'
      }
    }

    const data = await response.json()
    return { 
      success: true, 
      details: `Connecté à WooCommerce (version ${data.environment?.version || 'inconnue'})` 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Impossible de se connecter à WooCommerce',
      details: `Erreur de connexion: ${error.message}. Vérifiez l'URL de votre site et que WordPress/WooCommerce sont accessibles.`,
      docUrl: 'https://woocommerce.com/document/woocommerce-rest-api/'
    }
  }
}

async function testEtsyConnection(
  credentials: TestRequest['credentials']
): Promise<{ success: boolean; error?: string; details?: string; docUrl?: string }> {
  try {
    const apiUrl = `https://openapi.etsy.com/v3/application/shops/${credentials.shop_id}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': credentials.api_key!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { 
          success: false, 
          error: 'Clé API Etsy invalide', 
          details: 'Vérifiez que votre clé API est correcte et dispose des permissions nécessaires. Assurez-vous d\'avoir créé une application dans le Developer Portal d\'Etsy et obtenu une clé API valide.',
          docUrl: 'https://developer.etsy.com/documentation/essentials/authentication'
        }
      }
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'Boutique Etsy non trouvée', 
          details: 'Vérifiez l\'ID de votre boutique Etsy (Shop ID). Vous pouvez trouver votre Shop ID dans les paramètres de votre boutique ou via l\'API Etsy.',
          docUrl: 'https://developer.etsy.com/documentation/reference#operation/getShop'
        }
      }
      
      return { 
        success: false, 
        error: `Erreur HTTP ${response.status}`,
        details: 'Une erreur inattendue s\'est produite lors de la connexion à Etsy.',
        docUrl: 'https://developer.etsy.com/documentation'
      }
    }

    const data = await response.json()
    return { 
      success: true, 
      details: `Connecté à la boutique Etsy: ${data.shop_name || credentials.shop_id}` 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Impossible de se connecter à Etsy',
      details: `Erreur de connexion: ${error.message}. Vérifiez votre connexion internet et que l'API Etsy est accessible.`,
      docUrl: 'https://developer.etsy.com/documentation'
    }
  }
}

async function testPrestaShopConnection(
  credentials: TestRequest['credentials']
): Promise<{ success: boolean; error?: string; details?: string; docUrl?: string }> {
  try {
    let shopUrl = credentials.shop_url!
    shopUrl = shopUrl.replace(/\/$/, '')
    
    if (!shopUrl.startsWith('http')) {
      shopUrl = `https://${shopUrl}`
    }

    const apiUrl = `${shopUrl}/api`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(credentials.api_key! + ':')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Clé API PrestaShop invalide', 
          details: 'Vérifiez votre clé API PrestaShop. Assurez-vous d\'avoir activé le Webservice dans PrestaShop (Paramètres avancés > Webservice) et créé une clé avec les permissions appropriées.',
          docUrl: 'https://devdocs.prestashop-project.org/8/webservice/getting-started/'
        }
      }
      if (response.status === 404) {
        return { 
          success: false, 
          error: 'API PrestaShop non trouvée', 
          details: 'Vérifiez l\'URL de votre boutique PrestaShop et assurez-vous que le Webservice est activé dans Paramètres avancés > Webservice. Vérifiez aussi que le .htaccess autorise l\'accès à l\'API.',
          docUrl: 'https://devdocs.prestashop-project.org/8/webservice/tutorials/prestashop-webservice-lib/'
        }
      }
      
      return { 
        success: false, 
        error: `Erreur HTTP ${response.status}`,
        details: 'Une erreur inattendue s\'est produite lors de la connexion à PrestaShop.',
        docUrl: 'https://devdocs.prestashop-project.org/8/webservice/'
      }
    }

    return { 
      success: true, 
      details: 'Connecté à PrestaShop avec succès' 
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Impossible de se connecter à PrestaShop',
      details: `Erreur de connexion: ${error.message}. Vérifiez l'URL de votre boutique PrestaShop et que le serveur est accessible.`,
      docUrl: 'https://devdocs.prestashop-project.org/8/webservice/'
    }
  }
}
