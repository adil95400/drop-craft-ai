/**
 * CRM Automation - Secured with requireAuth() JWT-first
 */
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { action, data = {} } = await req.json()

    const validActions = ['sync_contacts', 'analyze_lead_score', 'generate_email_template', 'create_campaign', 'get_analytics']
    if (!validActions.includes(action)) {
      return errorResponse('Invalid action', corsHeaders, 400)
    }

    console.log(`[CRM] action: ${action} for user: ${userId}`)

    switch (action) {
      case 'sync_contacts': {
        const mockContacts = [
          { name: 'Jean Dupont', email: 'jean.dupont@example.com', company: 'TechCorp', position: 'Directeur Marketing', lead_score: 85, lifecycle_stage: 'marketing_qualified_lead', source: 'organic_search', tags: ['high-value'] },
          { name: 'Marie Martin', email: 'marie.martin@startup.com', company: 'StartupXYZ', position: 'CEO', lead_score: 92, lifecycle_stage: 'sales_qualified_lead', source: 'referral', tags: ['decision-maker'] },
        ]

        const contactsToInsert = mockContacts.map(c => ({
          ...c, user_id: userId, attribution: { campaign: data?.campaign || 'direct' },
          custom_fields: {}, last_activity_at: new Date().toISOString(),
        }))

        const { data: insertedContacts, error } = await supabase.from('crm_contacts').insert(contactsToInsert).select()
        if (error) throw error

        return successResponse({ contacts_synced: insertedContacts?.length || 0, contacts: insertedContacts }, corsHeaders)
      }

      case 'analyze_lead_score': {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (!LOVABLE_API_KEY) return errorResponse('LOVABLE_API_KEY not configured', corsHeaders, 500)

        if (!data.contact_id) return errorResponse('contact_id required', corsHeaders, 400)

        // RLS-scoped
        const { data: contact, error } = await supabase.from('crm_contacts').select('*').eq('id', data.contact_id).single()
        if (error || !contact) return errorResponse('Contact not found', corsHeaders, 404)

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a CRM expert specializing in lead scoring.' },
              { role: 'user', content: `Analyze lead: ${contact.name}, ${contact.company}, score: ${contact.lead_score}, tags: ${contact.tags?.join(', ')}. Provide recommended score (0-100) and next actions.` },
            ],
          }),
        })

        const aiResult = await response.json()
        const analysis = aiResult.choices?.[0]?.message?.content || ''
        const scoreMatch = analysis.match(/score[:\s]*(\d+)/i)
        const newScore = scoreMatch ? parseInt(scoreMatch[1]) : contact.lead_score

        await supabase.from('crm_contacts').update({ lead_score: newScore, last_activity_at: new Date().toISOString() }).eq('id', data.contact_id)

        return successResponse({ analysis, updated_score: newScore, contact_id: data.contact_id }, corsHeaders)
      }

      case 'generate_email_template': {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (!LOVABLE_API_KEY) return errorResponse('LOVABLE_API_KEY not configured', corsHeaders, 500)

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an expert email marketing copywriter for French e-commerce.' },
              { role: 'user', content: `Create email template for ${data.template_type || 'marketing'}, segment: ${data.target_segment || 'general'}, product: ${data.product_info || 'e-commerce'}. Include subject, body, CTA.` },
            ],
          }),
        })

        const aiResult = await response.json()
        const template = aiResult.choices?.[0]?.message?.content || ''

        const { data: saved } = await supabase.from('generated_content').insert({
          user_id: userId, content_type: 'email', target_keyword: data.target_segment,
          generated_content: template, ai_model: 'gemini-2.5-flash', tokens_used: aiResult.usage?.total_tokens || 0,
        }).select().single()

        return successResponse({ template, template_id: saved?.id }, corsHeaders)
      }

      case 'create_campaign': {
        const { data: campaign, error } = await supabase.from('marketing_campaigns').insert({
          user_id: userId, name: data.name, description: data.description, type: data.type,
          budget_total: data.budget_total, target_audience: data.target_audience, content: data.content,
          scheduled_at: data.scheduled_at, status: data.scheduled_at ? 'scheduled' : 'draft',
          settings: { auto_optimize: true, track_opens: true, track_clicks: true },
        }).select().single()

        if (error) throw error
        return successResponse({ campaign }, corsHeaders)
      }

      case 'get_analytics': {
        const { data: contacts } = await supabase.from('crm_contacts').select('*')
        const { data: campaigns } = await supabase.from('marketing_campaigns').select('*')

        const c = contacts || []
        const camp = campaigns || []

        return successResponse({
          analytics: {
            contacts: {
              total: c.length,
              active: c.filter((x: any) => x.status === 'active').length,
              leads: c.filter((x: any) => x.lifecycle_stage?.includes('lead')).length,
              avg_lead_score: c.reduce((s: number, x: any) => s + (x.lead_score || 0), 0) / c.length || 0,
            },
            campaigns: {
              total: camp.length,
              active: camp.filter((x: any) => x.status === 'active').length,
              total_budget: camp.reduce((s: number, x: any) => s + (x.budget_total || 0), 0),
            },
          },
        }, corsHeaders)
      }
    }

    return errorResponse('Unknown action', corsHeaders, 400)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('CRM error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 500)
  }
})
