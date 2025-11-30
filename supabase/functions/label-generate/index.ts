import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { shipmentIds, format = 'pdf' } = await req.json()

    console.log(`[label-generate] Generating ${format} labels for ${shipmentIds.length} shipments`)

    const labels = []
    
    for (const shipmentId of shipmentIds) {
      const { data: shipment } = await supabase
        .from('fulfillment_shipments')
        .select('*, carrier:fulfillment_carriers(*)')
        .eq('id', shipmentId)
        .eq('user_id', user.id)
        .single()

      if (!shipment) {
        console.warn(`[label-generate] Shipment ${shipmentId} not found`)
        continue
      }

      // Generate label with carrier API
      const labelData = await generateLabelWithCarrier(
        shipment.carrier,
        shipment,
        format
      )

      // Save label to database
      const { data: label } = await supabase
        .from('shipping_labels')
        .insert({
          user_id: user.id,
          shipment_id: shipmentId,
          label_url: labelData.url,
          label_format: format,
          file_size_bytes: labelData.size
        })
        .select()
        .single()

      labels.push(label)

      // Update shipment with label URL
      await supabase
        .from('fulfillment_shipments')
        .update({
          label_url: labelData.url,
          label_format: format,
          status: 'printed',
          updated_at: new Date().toISOString()
        })
        .eq('id', shipmentId)
    }

    console.log(`[label-generate] Generated ${labels.length} labels`)

    return new Response(JSON.stringify({
      success: true,
      labels,
      count: labels.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[label-generate] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateLabelWithCarrier(
  carrier: any,
  shipment: any,
  format: string
) {
  // Simulation de génération d'étiquette
  // En production, appeler l'API du transporteur pour générer l'étiquette réelle
  
  const labelUrl = `https://labels.example.com/${shipment.tracking_number}.${format}`
  const size = Math.floor(Math.random() * 50000) + 10000 // Simulate file size
  
  console.log(`[generateLabelWithCarrier] Generated ${format} label for ${shipment.tracking_number}`)
  
  return {
    url: labelUrl,
    size,
    format
  }
}