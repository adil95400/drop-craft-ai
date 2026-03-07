import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReturnProcessRequest {
  action: 'auto_process' | 'approve' | 'reject' | 'refund' | 'generate_label' | 'bulk_process'
  returnId?: string
  returnIds?: string[]
  notes?: string
  refundAmount?: number
  refundMethod?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body: ReturnProcessRequest = await req.json()
    const { action } = body

    let result: any

    switch (action) {
      case 'auto_process': {
        result = await autoProcessReturn(supabase, user.id, body.returnId!)
        break
      }
      case 'approve': {
        result = await processReturnAction(supabase, user.id, body.returnId!, 'approved', body.notes)
        break
      }
      case 'reject': {
        result = await processReturnAction(supabase, user.id, body.returnId!, 'rejected', body.notes)
        break
      }
      case 'refund': {
        result = await processRefund(supabase, user.id, body.returnId!, body.refundAmount!, body.refundMethod || 'original_payment')
        break
      }
      case 'generate_label': {
        result = await generateReturnLabel(supabase, user.id, body.returnId!)
        break
      }
      case 'bulk_process': {
        result = await bulkProcessReturns(supabase, user.id, body.returnIds || [])
        break
      }
      default:
        return new Response(JSON.stringify({ error: 'Action inconnue' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function autoProcessReturn(supabase: any, userId: string, returnId: string) {
  // Get return details
  const { data: ret, error } = await supabase
    .from('returns')
    .select('*')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single()

  if (error || !ret) throw new Error('Retour non trouvé')

  // Auto-approval rules
  const autoApproveReasons = ['defective', 'wrong_item', 'damaged']
  const maxAutoRefund = 100 // Auto-approve refunds under 100€

  const reasonCategory = ret.reason_category || ''
  const refundAmount = ret.refund_amount || 0

  let decision: 'approved' | 'pending' = 'pending'
  let decisionReason = ''

  if (autoApproveReasons.includes(reasonCategory)) {
    decision = 'approved'
    decisionReason = `Auto-approuvé : motif "${reasonCategory}" éligible`
  } else if (refundAmount <= maxAutoRefund) {
    decision = 'approved'
    decisionReason = `Auto-approuvé : montant ${refundAmount}€ sous le seuil de ${maxAutoRefund}€`
  } else {
    decisionReason = `Revue manuelle requise : montant ${refundAmount}€ dépasse le seuil`
  }

  // Update return
  const { data: updated, error: updateError } = await supabase
    .from('returns')
    .update({
      status: decision,
      notes: `[AUTO] ${decisionReason}${ret.notes ? '\n' + ret.notes : ''}`,
      automation_rule_id: 'auto_process',
      updated_at: new Date().toISOString()
    })
    .eq('id', returnId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) throw updateError

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'return_action',
    entity_type: 'return',
    entity_id: returnId,
    description: decisionReason,
    source: 'system',
    severity: 'info'
  })

  return {
    success: true,
    decision,
    reason: decisionReason,
    return: updated
  }
}

async function processReturnAction(supabase: any, userId: string, returnId: string, status: string, notes?: string) {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status,
      notes: notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', returnId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'return_action',
    entity_type: 'return',
    entity_id: returnId,
    description: `Retour ${status === 'approved' ? 'approuvé' : 'refusé'}`,
    source: 'client',
    severity: 'info'
  })

  return { success: true, return: data }
}

async function processRefund(supabase: any, userId: string, returnId: string, amount: number, method: string) {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'refunded',
      refund_amount: amount,
      refund_method: method,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', returnId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  // Update order if linked
  if (data.order_id) {
    await supabase
      .from('orders')
      .update({ 
        payment_status: 'refunded',
        refund_amount: amount
      })
      .eq('id', data.order_id)
      .eq('user_id', userId)
  }

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'return_action',
    entity_type: 'return',
    entity_id: returnId,
    description: `Remboursement de ${amount}€ via ${method}`,
    source: 'client',
    severity: 'info'
  })

  return { success: true, return: data, refund: { amount, method } }
}

async function generateReturnLabel(supabase: any, userId: string, returnId: string) {
  const { data: ret, error } = await supabase
    .from('returns')
    .select('*')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single()

  if (error || !ret) throw new Error('Retour non trouvé')

  // Generate a simulated return label
  const trackingNumber = `RET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

  const { data: updated, error: updateError } = await supabase
    .from('returns')
    .update({
      tracking_number: trackingNumber,
      carrier: 'colissimo',
      label_id: `LBL-${returnId.substring(0, 8)}`,
      updated_at: new Date().toISOString()
    })
    .eq('id', returnId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) throw updateError

  return {
    success: true,
    label: {
      tracking_number: trackingNumber,
      carrier: 'colissimo',
      label_url: null, // Would be a real URL in production
      format: 'pdf'
    },
    return: updated
  }
}

async function bulkProcessReturns(supabase: any, userId: string, returnIds: string[]) {
  const results = []
  let processed = 0
  let failed = 0

  for (const returnId of returnIds) {
    try {
      const result = await autoProcessReturn(supabase, userId, returnId)
      results.push({ returnId, ...result })
      processed++
    } catch (err) {
      results.push({ returnId, success: false, error: err.message })
      failed++
    }
  }

  return {
    success: true,
    summary: {
      total: returnIds.length,
      processed,
      failed
    },
    results
  }
}
