import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, invoice_data, template_id, order_id } = await req.json()

    switch (action) {
      case 'generate_invoice': {
        // Get template
        const { data: template } = await supabaseClient
          .from('invoice_templates')
          .select('*')
          .eq('id', template_id || '')
          .eq('is_active', true)
          .single()

        if (!template) throw new Error('Template not found')

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Create invoice record
        const { data: invoice, error } = await supabaseClient
          .from('invoice_history')
          .insert({
            user_id: user.id,
            template_id: template.id,
            order_id: order_id || null,
            invoice_number: invoiceNumber,
            customer_name: invoice_data.customer_name,
            customer_email: invoice_data.customer_email,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            total_amount: invoice_data.total_amount,
            currency: invoice_data.currency || 'EUR',
            status: 'draft',
            pdf_url: `invoices/${invoiceNumber}.pdf`
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ 
            success: true, 
            invoice: {
              ...invoice,
              template_config: template
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'send_invoice': {
        const { invoice_id } = await req.json()

        await supabaseClient
          .from('invoice_history')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', invoice_id)

        return new Response(
          JSON.stringify({ success: true, message: 'Invoice sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'mark_paid': {
        const { invoice_id } = await req.json()

        await supabaseClient
          .from('invoice_history')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', invoice_id)

        return new Response(
          JSON.stringify({ success: true, message: 'Invoice marked as paid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'batch_generate': {
        const { order_ids } = await req.json()

        const invoices = []
        for (const orderId of order_ids) {
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          
          const { data } = await supabaseClient
            .from('invoice_history')
            .insert({
              user_id: user.id,
              order_id: orderId,
              invoice_number: invoiceNumber,
              customer_name: 'Batch Customer',
              invoice_date: new Date().toISOString().split('T')[0],
              total_amount: 0,
              status: 'draft'
            })
            .select()
            .single()

          if (data) invoices.push(data)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            invoices_created: invoices.length,
            invoices 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in invoice-generator:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})