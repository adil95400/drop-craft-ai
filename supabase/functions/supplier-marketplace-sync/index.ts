import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    // Fetch marketplace suppliers from premium_suppliers table
    const { data: marketplaceSuppliers, error: suppliersError } = await supabase
      .from('premium_suppliers')
      .select('*')
      .order('priority', { ascending: false })
    
    if (suppliersError) throw suppliersError

    // Get product counts for each supplier
    const suppliersWithStats = await Promise.all(
      (marketplaceSuppliers || []).map(async (supplier) => {
        // Count products for this supplier
        const { count: productCount } = await supabase
          .from('supplier_products')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
        
        // Check if user has connected this supplier
        const { data: connection } = await supabase
          .from('supplier_credentials_vault')
          .select('connection_status, last_validation_at')
          .eq('user_id', user.id)
          .eq('supplier_id', supplier.id)
          .single()
        
        return {
          ...supplier,
          product_count: productCount || 0,
          is_connected: !!connection,
          connection_status: connection?.connection_status || 'inactive',
          last_sync_at: connection?.last_validation_at
        }
      })
    )

    // Get statistics
    const stats = {
      total_suppliers: suppliersWithStats.length,
      connected_suppliers: suppliersWithStats.filter(s => s.is_connected).length,
      total_products: suppliersWithStats.reduce((sum, s) => sum + s.product_count, 0),
      featured_suppliers: suppliersWithStats.filter(s => s.is_featured).length
    }

    return new Response(
      JSON.stringify({
        success: true,
        suppliers: suppliersWithStats,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Marketplace sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
