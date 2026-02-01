/**
 * Invoice Generator - Secure Implementation
 * P1.1: Auth obligatoire, validation Zod, scoping user_id
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const InvoiceDataSchema = z.object({
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email().optional(),
  total_amount: z.number().min(0).max(9999999.99),
  currency: z.string().length(3).optional().default('EUR'),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit_price: z.number()
  })).optional()
})

const ActionSchema = z.enum(['generate_invoice', 'send_invoice', 'mark_paid', 'batch_generate'])

const RequestSchema = z.object({
  action: ActionSchema,
  invoice_data: InvoiceDataSchema.optional(),
  template_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  order_ids: z.array(z.string().uuid()).max(50).optional()
})

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabaseClient)
    const userId = user.id
    
    // 2. Rate limiting: max 30 invoice operations per hour
    const rateCheck = await checkRateLimit(supabaseClient, userId, 'invoice_generation', 30, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 30 invoice operations per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = RequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, invoice_data, template_id, order_id, invoice_id, order_ids } = parseResult.data

    console.log(`[SECURE] Invoice action: ${action} for user: ${userId}`)

    switch (action) {
      case 'generate_invoice': {
        if (!invoice_data) {
          return new Response(
            JSON.stringify({ success: false, error: 'invoice_data required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get template - SCOPED to user or public templates
        let template = null
        if (template_id) {
          const { data: tpl } = await supabaseClient
            .from('invoice_templates')
            .select('*')
            .eq('id', template_id)
            .eq('is_active', true)
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .single()
          template = tpl
        }

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Create invoice record - SECURE: user_id from token only
        const { data: invoice, error } = await supabaseClient
          .from('invoice_history')
          .insert({
            user_id: userId, // CRITICAL: from token only
            template_id: template?.id || null,
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

        await logSecurityEvent(supabaseClient, userId, 'invoice_generated', 'info', {
          invoice_id: invoice.id,
          invoice_number: invoiceNumber
        })

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
        if (!invoice_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'invoice_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // SECURE: scope to user
        const { error } = await supabaseClient
          .from('invoice_history')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', invoice_id)
          .eq('user_id', userId) // CRITICAL: scope to user

        if (error) throw error

        await logSecurityEvent(supabaseClient, userId, 'invoice_sent', 'info', { invoice_id })

        return new Response(
          JSON.stringify({ success: true, message: 'Invoice sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'mark_paid': {
        if (!invoice_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'invoice_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // SECURE: scope to user
        const { error } = await supabaseClient
          .from('invoice_history')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString()
          })
          .eq('id', invoice_id)
          .eq('user_id', userId) // CRITICAL: scope to user

        if (error) throw error

        await logSecurityEvent(supabaseClient, userId, 'invoice_marked_paid', 'info', { invoice_id })

        return new Response(
          JSON.stringify({ success: true, message: 'Invoice marked as paid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'batch_generate': {
        if (!order_ids || order_ids.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'order_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify orders belong to user
        const { data: orders } = await supabaseClient
          .from('orders')
          .select('id, customer_name, total_amount')
          .in('id', order_ids)
          .eq('user_id', userId) // CRITICAL: scope to user

        if (!orders || orders.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No valid orders found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const invoices = []
        for (const order of orders) {
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
          
          const { data } = await supabaseClient
            .from('invoice_history')
            .insert({
              user_id: userId, // CRITICAL: from token only
              order_id: order.id,
              invoice_number: invoiceNumber,
              customer_name: order.customer_name || 'Customer',
              invoice_date: new Date().toISOString().split('T')[0],
              total_amount: order.total_amount || 0,
              status: 'draft'
            })
            .select()
            .single()

          if (data) invoices.push(data)
        }

        await logSecurityEvent(supabaseClient, userId, 'batch_invoices_generated', 'info', {
          count: invoices.length
        })

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
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in invoice-generator:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
