import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ImportRequest {
  provider: string
  apiKey?: string
  userId: string
}

// Données de test pour démonstration
const getSampleSuppliers = () => [
  {
    name: 'Spocket Premium Suppliers',
    country: 'USA',
    description: 'Réseau de fournisseurs premium US/EU avec livraison rapide',
    website_url: 'https://www.spocket.co',
    categories: ['Mode', 'Accessoires', 'Maison'],
    tier: 'platinum',
    minimum_order_value: 25,
    avg_delivery_days: 3,
    return_policy_days: 30,
    featured: true,
    is_active: true,
    total_products: 5000
  },
  {
    name: 'Modalyst Fashion Network',
    country: 'USA',
    description: 'Fournisseurs de mode haut de gamme avec marques reconnues',
    website_url: 'https://modalyst.co',
    categories: ['Mode', 'Vêtements', 'Luxe'],
    tier: 'diamond',
    minimum_order_value: 50,
    avg_delivery_days: 4,
    return_policy_days: 45,
    featured: true,
    is_active: true,
    total_products: 3500
  },
  {
    name: 'Printful Custom Products',
    country: 'USA',
    description: 'Print-on-demand avec plus de 300 produits personnalisables',
    website_url: 'https://www.printful.com',
    categories: ['Mode', 'Accessoires', 'Personnalisé'],
    tier: 'platinum',
    minimum_order_value: 0,
    avg_delivery_days: 5,
    return_policy_days: 30,
    featured: true,
    is_active: true,
    total_products: 300
  },
  {
    name: 'CJ Dropshipping',
    country: 'Chine',
    description: 'Plateforme dropshipping avec sourcing produits et fulfillment',
    website_url: 'https://cjdropshipping.com',
    categories: ['Électronique', 'Maison', 'Mode', 'Sport'],
    tier: 'gold',
    minimum_order_value: 10,
    avg_delivery_days: 10,
    return_policy_days: 30,
    featured: false,
    is_active: true,
    total_products: 50000
  },
  {
    name: 'Oberlo AliExpress Curated',
    country: 'International',
    description: 'Produits AliExpress vérifiés et optimisés pour le dropshipping',
    website_url: 'https://www.oberlo.com',
    categories: ['Électronique', 'Gadgets', 'Accessoires', 'Maison'],
    tier: 'gold',
    minimum_order_value: 5,
    avg_delivery_days: 15,
    return_policy_days: 30,
    featured: false,
    is_active: true,
    total_products: 100000
  },
  {
    name: 'European Wholesale Network',
    country: 'Allemagne',
    description: 'Grossistes européens avec produits de qualité et livraison rapide',
    website_url: 'https://eu-wholesale.net',
    categories: ['Tech', 'Électronique', 'Accessoires'],
    tier: 'platinum',
    minimum_order_value: 30,
    avg_delivery_days: 4,
    return_policy_days: 60,
    featured: true,
    is_active: true,
    total_products: 2500
  },
  {
    name: 'UK Beauty & Cosmetics Hub',
    country: 'UK',
    description: 'Fournisseurs beauté premium avec produits certifiés',
    website_url: 'https://uk-beauty-hub.co.uk',
    categories: ['Beauté', 'Cosmétiques', 'Soins'],
    tier: 'platinum',
    minimum_order_value: 40,
    avg_delivery_days: 3,
    return_policy_days: 30,
    featured: true,
    is_active: true,
    total_products: 1200
  },
  {
    name: 'French Home Décor Suppliers',
    country: 'France',
    description: 'Décoration et articles de maison made in France',
    website_url: 'https://fr-home-deco.fr',
    categories: ['Maison', 'Décoration', 'Cuisine'],
    tier: 'platinum',
    minimum_order_value: 35,
    avg_delivery_days: 2,
    return_policy_days: 45,
    featured: false,
    is_active: true,
    total_products: 800
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { provider, apiKey, userId } = await req.json() as ImportRequest

    console.log(`📥 Importing suppliers from: ${provider}`)

    let suppliersToImport: any[] = []

    // En fonction du provider
    if (provider === 'sample') {
      // Import de données de test
      suppliersToImport = getSampleSuppliers()
    } else {
      // En production, faire des appels API réels aux fournisseurs
      // Pour l'instant, on simule avec des données
      console.log(`API Key provided: ${apiKey ? 'Yes' : 'No'}`)
      
      // TODO: Implémenter les appels API réels
      // Exemple pour Spocket:
      // const response = await fetch('https://api.spocket.co/api/v2/suppliers', {
      //   headers: { 'Authorization': `Bearer ${apiKey}` }
      // })
      
      suppliersToImport = getSampleSuppliers().filter(s => 
        s.name.toLowerCase().includes(provider.toLowerCase())
      )
    }

    if (suppliersToImport.length === 0) {
      throw new Error('No suppliers found for this provider')
    }

    // Ajouter les métadonnées d'import
    const suppliersWithMetadata = suppliersToImport.map(supplier => ({
      ...supplier,
      api_endpoint: provider !== 'sample' ? `https://api.${provider}.com/v1` : undefined,
      certifications: ['iso_9001', 'eco_friendly'],
      payment_terms: 'net_30' as const,
      response_time_hours: 24
    }))

    // Insérer dans la base de données
    const { data, error } = await supabase
      .from('premium_suppliers')
      .upsert(suppliersWithMetadata, {
        onConflict: 'name,country',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    // Logger l'import
    await supabase
      .from('platform_sync_logs')
      .insert({
        user_id: userId,
        platform: provider,
        sync_type: 'all',
        status: 'success',
        items_synced: data?.length || 0,
        items_failed: 0,
        duration_ms: 1000,
        sync_details: {
          import_type: 'suppliers',
          provider,
          total_imported: data?.length || 0
        },
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        imported: data?.length || 0,
        suppliers: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
