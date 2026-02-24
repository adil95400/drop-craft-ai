/**
 * Invoice Generator - Secured with requireAuth() JWT-first
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { action, invoice_data, template_id, order_id, invoice_id, order_ids } = await req.json()

    const validActions = ['generate_invoice', 'send_invoice', 'mark_paid', 'batch_generate']
    if (!validActions.includes(action)) {
      return errorResponse('Invalid action', corsHeaders, 400)
    }

    console.log(`[invoice] action: ${action} for user: ${userId}`)

    switch (action) {
      case 'generate_invoice': {
        if (!invoice_data) return errorResponse('invoice_data required', corsHeaders, 400)

        let template = null
        if (template_id) {
          const { data: tpl } = await supabase
            .from('invoice_templates')
            .select('*')
            .eq('id', template_id)
            .eq('is_active', true)
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .single()
          template = tpl
        }

        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        const { data: invoice, error } = await supabase
          .from('invoice_history')
          .insert({
            user_id: userId, template_id: template?.id || null, order_id: order_id || null,
            invoice_number: invoiceNumber, customer_name: invoice_data.customer_name,
            customer_email: invoice_data.customer_email,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            total_amount: invoice_data.total_amount, currency: invoice_data.currency || 'EUR',
            status: 'draft', pdf_url: `invoices/${invoiceNumber}.pdf`,
          })
          .select()
          .single()

        if (error) throw error

        return successResponse({ invoice: { ...invoice, template_config: template } }, corsHeaders)
      }

      case 'send_invoice': {
        if (!invoice_id) return errorResponse('invoice_id required', corsHeaders, 400)

        const { error } = await supabase
          .from('invoice_history')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', invoice_id)

        if (error) throw error
        return successResponse({ message: 'Invoice sent' }, corsHeaders)
      }

      case 'mark_paid': {
        if (!invoice_id) return errorResponse('invoice_id required', corsHeaders, 400)

        const { error } = await supabase
          .from('invoice_history')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', invoice_id)

        if (error) throw error
        return successResponse({ message: 'Invoice marked as paid' }, corsHeaders)
      }

      case 'batch_generate': {
        if (!order_ids || order_ids.length === 0) return errorResponse('order_ids required', corsHeaders, 400)

        // RLS-scoped
        const { data: orders } = await supabase
          .from('orders')
          .select('id, customer_name, total_amount')
          .in('id', order_ids)

        if (!orders || orders.length === 0) {
          return errorResponse('No valid orders found', corsHeaders, 400)
        }

        const invoices = []
        for (const order of orders) {
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

          const { data } = await supabase
            .from('invoice_history')
            .insert({
              user_id: userId, order_id: order.id, invoice_number: invoiceNumber,
              customer_name: order.customer_name || 'Customer',
              invoice_date: new Date().toISOString().split('T')[0],
              total_amount: order.total_amount || 0, status: 'draft',
            })
            .select()
            .single()

          if (data) invoices.push(data)
        }

        return successResponse({ invoices_created: invoices.length, invoices }, corsHeaders)
      }
    }

    return errorResponse('Invalid action', corsHeaders, 400)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Invoice error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 400)
  }
})
