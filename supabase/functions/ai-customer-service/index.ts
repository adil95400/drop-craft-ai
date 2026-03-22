import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateJSON } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerServiceRequest {
  action: 'create_ticket' | 'ai_respond' | 'process_return' | 'auto_refund' | 'chat_suggest';
  ticket?: {
    customer_id?: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    order_id?: string;
  };
  ticket_id?: string;
  return_request?: {
    order_id: string;
    items: Array<{ product_id: string; quantity: number; reason: string }>;
    preferred_resolution: 'refund' | 'exchange' | 'store_credit';
  };
  refund_params?: {
    order_id: string;
    amount?: number;
    reason: string;
    full_refund?: boolean;
  };
  chat_context?: {
    customer_message: string;
    conversation_history?: Array<{ role: string; content: string }>;
    customer_id?: string;
  };
}

async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, supabase };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  return generateJSON(systemPrompt, userPrompt, { module: 'chat', temperature: 0.4, enableCache: true });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await requireAuth(req);
    const body: CustomerServiceRequest = await req.json();

    let result: Record<string, unknown>;

    switch (body.action) {
      case 'create_ticket': {
        const t = body.ticket!;
        
        // AI-classify the ticket
        const aiClassification = await callAI(
          `You are a customer service classifier. Analyze a support ticket and classify it.
           Return JSON: { "category": string, "priority": "low"|"medium"|"high"|"urgent", "sentiment": "positive"|"neutral"|"negative"|"angry", "auto_resolvable": boolean, "suggested_tags": string[], "estimated_resolution_time_hours": number }`,
          `Subject: ${t.subject}\nMessage: ${t.message}\nOrder ID: ${t.order_id || 'N/A'}`
        );

        // Create support ticket in activity logs (using existing table)
        const { data: ticket, error } = await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'support_ticket_created',
            entity_type: 'ticket',
            entity_id: t.order_id || null,
            description: t.subject,
            details: {
              message: t.message,
              customer_id: t.customer_id,
              priority: aiClassification.priority || t.priority || 'medium',
              category: aiClassification.category || t.category,
              sentiment: aiClassification.sentiment,
              auto_resolvable: aiClassification.auto_resolvable,
              tags: aiClassification.suggested_tags,
              status: 'open',
            },
            source: 'customer_service',
            severity: aiClassification.priority === 'urgent' ? 'error' : 'info',
          })
          .select()
          .single();

        if (error) throw error;

        result = {
          action: 'create_ticket',
          ticket_id: ticket.id,
          classification: aiClassification,
        };
        break;
      }

      case 'ai_respond': {
        // Get ticket context
        const { data: ticketData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('id', body.ticket_id!)
          .eq('user_id', user.id)
          .single();

        // Get customer order history if available
        let orderContext = '';
        const entityId = ticketData?.entity_id;
        if (entityId) {
          const { data: order } = await supabase
            .from('orders')
            .select('order_number, status, total_amount, created_at, tracking_number')
            .eq('id', entityId)
            .eq('user_id', user.id)
            .single();
          if (order) orderContext = `Order: #${order.order_number}, Status: ${order.status}, Amount: ${order.total_amount}, Tracking: ${order.tracking_number || 'N/A'}`;
        }

        const aiResponse = await callAI(
          `You are a professional, empathetic customer service agent for an e-commerce store.
           Write a helpful response. Be concise, friendly, and solution-oriented.
           Return JSON: { "response": string, "tone": string, "suggested_actions": string[], "follow_up_needed": boolean, "escalate": boolean, "canned_response_id": string | null }`,
          `Ticket: ${JSON.stringify(ticketData?.details || {})}. Subject: ${ticketData?.description}. ${orderContext}`
        );

        result = { action: 'ai_respond', ...aiResponse };
        break;
      }

      case 'process_return': {
        const ret = body.return_request!;

        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', ret.order_id)
          .eq('user_id', user.id)
          .single();

        if (!order) throw new Error('Order not found');

        // Check if within return window (30 days)
        const orderDate = new Date(order.created_at);
        const daysSinceOrder = (Date.now() - orderDate.getTime()) / 86400000;
        const withinWindow = daysSinceOrder <= 30;

        // Create return record
        const { data: returnRecord, error } = await supabase
          .from('returns')
          .insert({
            user_id: user.id,
            order_id: ret.order_id,
            rma_number: `RMA-${Date.now()}`,
            status: withinWindow ? 'approved' : 'pending_review',
            reason: ret.items.map(i => i.reason).join('; '),
            resolution_type: ret.preferred_resolution,
            items: ret.items,
            refund_amount: withinWindow ? order.total_amount : null,
          })
          .select()
          .single();

        if (error) throw error;

        const aiResult = await callAI(
          `You are a returns processing specialist. Evaluate a return request.
           Return JSON: { "approval_recommendation": "approve"|"review"|"deny", "reason": string, "refund_amount_suggested": number, "restocking_fee_applicable": boolean, "restocking_fee_percent": number, "return_shipping_label_needed": boolean, "estimated_processing_days": number, "customer_communication": string }`,
          `Order total: ${order.total_amount}. Days since order: ${daysSinceOrder.toFixed(0)}. Items: ${JSON.stringify(ret.items)}. Resolution: ${ret.preferred_resolution}. Within 30-day window: ${withinWindow}.`
        );

        result = {
          action: 'process_return',
          return_id: returnRecord.id,
          rma_number: returnRecord.rma_number,
          within_return_window: withinWindow,
          ...aiResult,
        };
        break;
      }

      case 'auto_refund': {
        const ref = body.refund_params!;

        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, total_amount, status, payment_status')
          .eq('id', ref.order_id)
          .eq('user_id', user.id)
          .single();

        if (!order) throw new Error('Order not found');

        const refundAmount = ref.full_refund ? order.total_amount : (ref.amount || 0);

        // AI evaluates refund eligibility
        const aiResult = await callAI(
          `You are a refund processing AI. Evaluate whether a refund should be approved automatically.
           Return JSON: { "auto_approve": boolean, "risk_score": number (0-100), "reason": string, "suggested_amount": number, "partial_refund_recommended": boolean, "fraud_indicators": string[], "customer_retention_offer": string | null }`,
          `Order #${order.order_number}: total ${order.total_amount}, status ${order.status}, payment ${order.payment_status}. Refund requested: ${refundAmount}. Reason: ${ref.reason}. Full refund: ${ref.full_refund}.`
        );

        // If auto-approved, update order
        if (aiResult.auto_approve && aiResult.risk_score < 30) {
          await supabase
            .from('orders')
            .update({ payment_status: 'refunded', status: 'refunded' })
            .eq('id', order.id)
            .eq('user_id', user.id);
        }

        result = {
          action: 'auto_refund',
          order_id: order.id,
          requested_amount: refundAmount,
          ...aiResult,
        };
        break;
      }

      case 'chat_suggest': {
        const ctx = body.chat_context!;

        // Get customer context if available
        let customerInfo = '';
        if (ctx.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('first_name, last_name, email, total_orders, total_spent, lifetime_value')
            .eq('id', ctx.customer_id)
            .eq('user_id', user.id)
            .single();
          if (customer) customerInfo = `Customer: ${customer.first_name} ${customer.last_name}, Orders: ${customer.total_orders}, LTV: ${customer.lifetime_value}`;
        }

        const aiResult = await callAI(
          `You are a live chat assistant for e-commerce support. Generate helpful, quick response suggestions.
           Return JSON: { "suggested_responses": [{ "text": string, "tone": "friendly"|"professional"|"empathetic", "confidence": number }], "detected_intent": string, "recommended_action": string | null, "knowledge_base_articles": string[] }`,
          `Customer message: "${ctx.customer_message}". ${customerInfo}. History: ${JSON.stringify(ctx.conversation_history || [])}.`
        );

        result = { action: 'chat_suggest', ...aiResult };
        break;
      }

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
