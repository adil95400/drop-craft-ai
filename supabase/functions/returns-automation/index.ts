import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { action, ...params } = await req.json()
    console.log('🔄 Returns automation action:', action)

    switch (action) {
      case 'process_return': {
        const { return_id } = params
        if (!return_id) return errorResponse('return_id is required', corsHeaders)

        // RLS-scoped queries
        const { data: returnData, error: returnError } = await supabase
          .from('returns')
          .select('*, order:orders(*)')
          .eq('id', return_id)
          .single()

        if (returnError) return errorResponse(returnError.message, corsHeaders, 500)

        const { data: rules } = await supabase
          .from('return_automation_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })

        let matchedRule = null
        for (const rule of rules || []) {
          const conditions = rule.trigger_conditions as any
          if (conditions.reason?.includes(returnData.reason)) {
            matchedRule = rule
            break
          }
        }

        if (matchedRule?.auto_approve) {
          await supabase
            .from('returns')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              auto_processed: true,
              ai_decision_confidence: 0.95
            })
            .eq('id', return_id)

          if (matchedRule.auto_send_confirmation) {
            await supabase
              .from('customer_confirmations')
              .insert({
                user_id: userId,
                return_id,
                confirmation_type: 'return_approved',
                email_subject: 'Votre retour a été approuvé',
                email_body: `Votre demande de retour ${returnData.return_number} a été approuvée automatiquement.`,
                channels_used: ['email'],
                sent_at: new Date().toISOString()
              })
          }
        }

        return successResponse({
          auto_approved: matchedRule?.auto_approve || false,
          message: 'Return processed'
        }, corsHeaders)
      }

      case 'auto_refund': {
        const { return_id } = params
        if (!return_id) return errorResponse('return_id is required', corsHeaders)

        const { data: returnData } = await supabase
          .from('returns')
          .select('*')
          .eq('id', return_id)
          .single()

        if (returnData?.refund_approved_amount) {
          await supabase
            .from('returns')
            .update({
              status: 'refunded',
              refunded_at: new Date().toISOString()
            })
            .eq('id', return_id)

          await supabase
            .from('customer_confirmations')
            .insert({
              user_id: userId,
              return_id,
              confirmation_type: 'refund_processed',
              email_subject: 'Votre remboursement a été traité',
              channels_used: ['email'],
              sent_at: new Date().toISOString()
            })
        }

        return successResponse({ message: 'Refund processed' }, corsHeaders)
      }

      default:
        return errorResponse('Invalid action', corsHeaders)
    }

  } catch (error) {
    if (error instanceof Response) return error
    console.error('❌ Returns automation error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
