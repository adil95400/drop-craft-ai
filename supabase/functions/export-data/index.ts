import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { type, format = 'csv', filters = {} } = await req.json()

    console.log('Export data:', { type, format, user_id: user.id })

    let data
    let tableName

    switch (type) {
      case 'products':
        tableName = 'imported_products'
        const { data: products, error: productsError } = await supabase
          .from('imported_products')
          .select('*')
          .eq('user_id', user.id)
        
        if (productsError) throw productsError
        data = products
        break

      case 'orders':
        tableName = 'orders'
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
        
        if (ordersError) throw ordersError
        data = orders
        break

      case 'customers':
        tableName = 'customers'
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
        
        if (customersError) throw customersError
        data = customers
        break

      default:
        throw new Error(`Unknown export type: ${type}`)
    }

    // Appliquer les filtres si nécessaire
    if (filters.ids && Array.isArray(filters.ids)) {
      data = data.filter((item: any) => filters.ids.includes(item.id))
    }

    // Générer le fichier selon le format
    let fileContent: string
    let contentType: string

    if (format === 'csv') {
      // Générer CSV
      if (!data || data.length === 0) {
        throw new Error('No data to export')
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            const str = String(value)
            return str.includes(',') || str.includes('"')
              ? `"${str.replace(/"/g, '""')}"`
              : str
          }).join(',')
        )
      ]
      fileContent = csvRows.join('\n')
      contentType = 'text/csv'
    } else if (format === 'json') {
      fileContent = JSON.stringify(data, null, 2)
      contentType = 'application/json'
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'data_exported',
      description: `Export ${type} (${format})`,
      entity_type: type,
      metadata: { type, format, count: data.length }
    })

    return new Response(
      fileContent,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${type}-export-${Date.now()}.${format}"`
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
