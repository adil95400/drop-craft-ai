import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DisputeRequest {
  action: 'create' | 'update' | 'resolve' | 'escalate' | 'add_evidence' | 'add_timeline';
  disputeId?: string;
  returnId?: string;
  orderId?: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: DisputeRequest = await req.json();
    const { action, disputeId, returnId, orderId, data } = body;

    console.log(`[Disputes Manager] Action: ${action}, User: ${user.id}`);

    let result: any;

    switch (action) {
      case 'create':
        result = await createDispute(supabase, user.id, { returnId, orderId, ...data });
        break;

      case 'update':
        if (!disputeId) throw new Error('Dispute ID required');
        result = await updateDispute(supabase, user.id, disputeId, data);
        break;

      case 'resolve':
        if (!disputeId) throw new Error('Dispute ID required');
        result = await resolveDispute(supabase, user.id, disputeId, data);
        break;

      case 'escalate':
        if (!disputeId) throw new Error('Dispute ID required');
        result = await escalateDispute(supabase, user.id, disputeId, data);
        break;

      case 'add_evidence':
        if (!disputeId) throw new Error('Dispute ID required');
        result = await addEvidence(supabase, user.id, disputeId, data);
        break;

      case 'add_timeline':
        if (!disputeId) throw new Error('Dispute ID required');
        result = await addTimelineEvent(supabase, user.id, disputeId, data);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Disputes Manager] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Create a new dispute
async function createDispute(supabase: any, userId: string, data: any) {
  const { returnId, orderId, title, description, dispute_type, priority, disputed_amount, customer_complaint } = data;

  // Generate dispute number
  const { data: disputeNumber, error: numError } = await supabase.rpc('generate_dispute_number');
  if (numError) {
    // Fallback generation
    const timestamp = Date.now().toString(36).toUpperCase();
    data.dispute_number = `DSP-${timestamp}`;
  } else {
    data.dispute_number = disputeNumber;
  }

  // Get customer info if from order or return
  let customerId = data.customer_id;
  if (!customerId && orderId) {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('id', orderId)
      .single();
    customerId = order?.customer_id;
  }

  // Create dispute
  const { data: dispute, error } = await supabase
    .from('disputes')
    .insert({
      user_id: userId,
      return_id: returnId || null,
      order_id: orderId || null,
      customer_id: customerId || null,
      dispute_number: data.dispute_number,
      title: title || 'Nouveau litige',
      description,
      dispute_type: dispute_type || 'other',
      priority: priority || 'medium',
      disputed_amount,
      customer_complaint,
      status: 'open',
      timeline: [{
        event: 'created',
        description: 'Litige créé',
        timestamp: new Date().toISOString(),
        user_id: userId
      }]
    })
    .select()
    .single();

  if (error) throw error;

  // If from a return, update return with dispute reference
  if (returnId) {
    await supabase
      .from('returns')
      .update({ dispute_id: dispute.id })
      .eq('id', returnId);
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: `Nouveau litige: ${dispute.dispute_number}`,
      message: title || 'Un nouveau litige a été créé',
      type: 'dispute_created',
      priority: priority === 'urgent' ? 'high' : 'medium',
      related_entity_id: dispute.id,
      related_entity_type: 'dispute'
    });

  console.log(`[Disputes] Created dispute: ${dispute.dispute_number}`);

  return dispute;
}

// Update dispute
async function updateDispute(supabase: any, userId: string, disputeId: string, data: any) {
  const { data: dispute, error } = await supabase
    .from('disputes')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', disputeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return dispute;
}

// Resolve dispute
async function resolveDispute(supabase: any, userId: string, disputeId: string, data: any) {
  const { resolution_type, resolution_amount, resolution_notes } = data;

  // Get current dispute
  const { data: currentDispute, error: fetchError } = await supabase
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Update timeline
  const timeline = currentDispute.timeline || [];
  timeline.push({
    event: 'resolved',
    description: `Litige résolu: ${resolution_type}`,
    resolution_amount,
    timestamp: new Date().toISOString(),
    user_id: userId
  });

  // Update dispute
  const { data: dispute, error } = await supabase
    .from('disputes')
    .update({
      status: 'resolved',
      resolution_type,
      resolution_amount,
      resolution_notes,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      timeline
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // If has associated return, update refund
  if (currentDispute.return_id && resolution_type === 'full_refund') {
    await supabase
      .from('returns')
      .update({
        status: 'refunded',
        refund_amount: resolution_amount,
        refunded_at: new Date().toISOString()
      })
      .eq('id', currentDispute.return_id);
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: `Litige résolu: ${currentDispute.dispute_number}`,
      message: `Résolution: ${resolution_type}${resolution_amount ? ` - €${resolution_amount}` : ''}`,
      type: 'dispute_resolved',
      priority: 'medium',
      related_entity_id: disputeId,
      related_entity_type: 'dispute'
    });

  console.log(`[Disputes] Resolved dispute: ${currentDispute.dispute_number}`);

  return dispute;
}

// Escalate dispute
async function escalateDispute(supabase: any, userId: string, disputeId: string, data: any) {
  const { reason, new_priority } = data;

  // Get current dispute
  const { data: currentDispute, error: fetchError } = await supabase
    .from('disputes')
    .select('*')
    .eq('id', disputeId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Update timeline
  const timeline = currentDispute.timeline || [];
  timeline.push({
    event: 'escalated',
    description: reason || 'Litige escaladé',
    from_priority: currentDispute.priority,
    to_priority: new_priority || 'urgent',
    timestamp: new Date().toISOString(),
    user_id: userId
  });

  // Update dispute
  const { data: dispute, error } = await supabase
    .from('disputes')
    .update({
      status: 'escalated',
      priority: new_priority || 'urgent',
      escalated_at: new Date().toISOString(),
      timeline
    })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  // Create urgent notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: `⚠️ Litige escaladé: ${currentDispute.dispute_number}`,
      message: reason || 'Ce litige nécessite une attention urgente',
      type: 'dispute_escalated',
      priority: 'high',
      related_entity_id: disputeId,
      related_entity_type: 'dispute'
    });

  console.log(`[Disputes] Escalated dispute: ${currentDispute.dispute_number}`);

  return dispute;
}

// Add evidence to dispute
async function addEvidence(supabase: any, userId: string, disputeId: string, data: any) {
  const { type, description, url, metadata } = data;

  // Get current dispute
  const { data: currentDispute, error: fetchError } = await supabase
    .from('disputes')
    .select('evidence, timeline')
    .eq('id', disputeId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Add evidence
  const evidence = currentDispute.evidence || [];
  const newEvidence = {
    id: crypto.randomUUID(),
    type,
    description,
    url,
    metadata,
    added_at: new Date().toISOString(),
    added_by: userId
  };
  evidence.push(newEvidence);

  // Update timeline
  const timeline = currentDispute.timeline || [];
  timeline.push({
    event: 'evidence_added',
    description: `Preuve ajoutée: ${type}`,
    evidence_id: newEvidence.id,
    timestamp: new Date().toISOString(),
    user_id: userId
  });

  // Update dispute
  const { data: dispute, error } = await supabase
    .from('disputes')
    .update({ evidence, timeline })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  return { dispute, evidence: newEvidence };
}

// Add timeline event
async function addTimelineEvent(supabase: any, userId: string, disputeId: string, data: any) {
  const { event, description, metadata } = data;

  // Get current dispute
  const { data: currentDispute, error: fetchError } = await supabase
    .from('disputes')
    .select('timeline')
    .eq('id', disputeId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  // Add event
  const timeline = currentDispute.timeline || [];
  const newEvent = {
    id: crypto.randomUUID(),
    event,
    description,
    metadata,
    timestamp: new Date().toISOString(),
    user_id: userId
  };
  timeline.push(newEvent);

  // Update dispute
  const { data: dispute, error } = await supabase
    .from('disputes')
    .update({ timeline })
    .eq('id', disputeId)
    .select()
    .single();

  if (error) throw error;

  return { dispute, event: newEvent };
}
