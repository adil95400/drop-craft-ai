import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Generate import preview without actually importing
 * Validates data and returns preview for user confirmation
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { source, data: rawData, supplierId } = await req.json()
    
    console.log('Generating import preview:', { source, supplierId, count: rawData?.length })
    
    // Parse and validate products based on source
    let products: any[] = []
    const warnings: string[] = []
    
    switch (source) {
      case 'supplier': {
        // Validate supplier products
        if (!supplierId) {
          throw new Error('Supplier ID required')
        }
        
        products = rawData.map((raw: any) => ({
          name: raw.name || raw.title || raw.product_name,
          price: parseFloat(raw.price || raw.retail_price || 0),
          currency: raw.currency || 'EUR',
          image_url: Array.isArray(raw.images) ? raw.images[0] : raw.image,
          sku: raw.sku || raw.external_id,
          category: raw.category || 'Uncategorized',
          issues: validateProductData(raw)
        }))
        
        break
      }
      
      case 'csv': {
        // Parse CSV data
        products = rawData.map((row: any) => ({
          name: row.name || row.title || row['Nom'] || row['Product Name'],
          price: parseFloat(row.price || row.prix || row['Price'] || 0),
          currency: row.currency || 'EUR',
          image_url: row.image || row.image_url || row['Image'],
          sku: row.sku || row.SKU || row['Référence'],
          category: row.category || row.categorie || row['Category'],
          issues: validateProductData(row)
        }))
        
        break
      }
      
      case 'url': {
        // Single product from URL scraping
        products = [{
          name: rawData.name || rawData.title,
          price: parseFloat(rawData.price || 0),
          currency: rawData.currency || 'EUR',
          image_url: Array.isArray(rawData.images) ? rawData.images[0] : rawData.image,
          sku: rawData.sku,
          category: rawData.category,
          issues: validateProductData(rawData)
        }]
        
        break
      }
      
      case 'shopify': {
        // Import from connected Shopify store
        products = rawData.map((raw: any) => ({
          name: raw.title,
          price: parseFloat(raw.variants?.[0]?.price || 0),
          currency: 'EUR',
          image_url: raw.images?.[0]?.src,
          sku: raw.variants?.[0]?.sku,
          category: raw.product_type,
          issues: validateProductData(raw)
        }))
        
        break
      }
      
      default:
        throw new Error(`Unsupported import source: ${source}`)
    }
    
    // Calculate stats
    const totalProducts = products.length
    const validProducts = products.filter(p => p.issues.length === 0).length
    const invalidProducts = totalProducts - validProducts
    
    // Generate warnings
    if (invalidProducts > 0) {
      warnings.push(`${invalidProducts} produits avec erreurs de validation`)
    }
    
    const duplicateSkus = findDuplicates(products.map(p => p.sku).filter(Boolean))
    if (duplicateSkus.length > 0) {
      warnings.push(`${duplicateSkus.length} SKUs en double détectés`)
    }
    
    const missingImages = products.filter(p => !p.image_url).length
    if (missingImages > 0) {
      warnings.push(`${missingImages} produits sans image`)
    }
    
    const missingPrices = products.filter(p => !p.price || p.price <= 0).length
    if (missingPrices > 0) {
      warnings.push(`${missingPrices} produits sans prix valide`)
    }
    
    // Return preview data
    return new Response(
      JSON.stringify({
        success: true,
        preview: {
          valid: validProducts > 0,
          products: products.slice(0, 100), // Limit to 100 for preview
          totalProducts,
          validProducts,
          invalidProducts,
          warnings
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('Import preview error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

/**
 * Validate product data and return issues
 */
function validateProductData(raw: any): string[] {
  const issues: string[] = []
  
  const name = raw.name || raw.title || raw.product_name
  if (!name || name.length < 3) {
    issues.push('Nom invalide ou trop court')
  }
  
  const price = parseFloat(raw.price || raw.retail_price || 0)
  if (!price || price <= 0) {
    issues.push('Prix manquant ou invalide')
  }
  
  const images = raw.images || raw.image || raw.image_url
  if (!images || (Array.isArray(images) && images.length === 0)) {
    issues.push('Aucune image')
  }
  
  return issues
}

/**
 * Find duplicate values in array
 */
function findDuplicates(arr: any[]): any[] {
  return arr.filter((item, index) => arr.indexOf(item) !== index)
}
