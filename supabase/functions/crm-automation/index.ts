/**
 * CRM Automation - Secure Implementation
 * P1.1: Auth obligatoire, rate limiting, validation Zod, scoping user_id
 * Uses Lovable AI instead of OpenAI
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ActionSchema = z.enum([
  'sync_contacts', 'analyze_lead_score', 'generate_email_template', 
  'create_campaign', 'get_analytics'
])

const DataSchema = z.object({
  campaign: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  template_type: z.string().optional(),
  target_segment: z.string().optional(),
  product_info: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  budget_total: z.number().optional(),
  target_audience: z.any().optional(),
  content: z.any().optional(),
  scheduled_at: z.string().optional(),
}).passthrough()

const RequestSchema = z.object({
  action: ActionSchema,
  data: DataSchema.optional()
})

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    // 2. Rate limiting
    const rateCheck = await checkRateLimit(supabase, userId, 'crm_automation', 30, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
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

    const { action, data } = parseResult.data

    console.log(`[SECURE] CRM Automation action: ${action} for user: ${userId}`)

    switch (action) {
      case 'sync_contacts':
        return await syncContacts(userId, data || {}, supabase, corsHeaders)
      
      case 'analyze_lead_score':
        return await analyzeLeadScore(userId, data || {}, supabase, corsHeaders)
      
      case 'generate_email_template':
        return await generateEmailTemplate(userId, data || {}, supabase, corsHeaders)
      
      case 'create_campaign':
        return await createCampaign(userId, data || {}, supabase, corsHeaders)
      
      case 'get_analytics':
        return await getCRMAnalytics(userId, supabase, corsHeaders)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Error in CRM automation function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncContacts(userId: string, data: any, supabase: any, corsHeaders: any) {
  console.log('Syncing contacts for user:', userId)
  
  // Simulate external CRM sync
  const mockContacts = [
    {
      name: "Jean Dupont",
      email: "jean.dupont@example.com",
      phone: "+33123456789",
      company: "TechCorp",
      position: "Directeur Marketing",
      lead_score: 85,
      lifecycle_stage: "marketing_qualified_lead",
      source: "organic_search",
      tags: ["high-value", "tech-industry"]
    },
    {
      name: "Marie Martin",
      email: "marie.martin@startup.com",
      phone: "+33987654321",
      company: "StartupXYZ",
      position: "CEO",
      lead_score: 92,
      lifecycle_stage: "sales_qualified_lead",
      source: "referral",
      tags: ["decision-maker", "startup"]
    }
  ]

  // Insert contacts - SCOPED to user
  const contactsToInsert = mockContacts.map(contact => ({
    ...contact,
    user_id: userId, // CRITICAL: from token only
    attribution: { campaign: data?.campaign || 'direct' },
    custom_fields: {},
    last_activity_at: new Date().toISOString()
  }))

  const { data: insertedContacts, error } = await supabase
    .from('crm_contacts')
    .insert(contactsToInsert)
    .select()

  if (error) {
    console.error('Error inserting contacts:', error)
    throw error
  }

  console.log(`Successfully synced ${insertedContacts.length} contacts`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      contacts_synced: insertedContacts.length,
      contacts: insertedContacts
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function analyzeLeadScore(userId: string, data: any, supabase: any, corsHeaders: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }

  const { contact_id } = data
  if (!contact_id) {
    throw new Error('contact_id required')
  }
  
  // Get contact data - SCOPED to user
  const { data: contact, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', contact_id)
    .eq('user_id', userId) // CRITICAL: scope to user
    .single()

  if (error || !contact) {
    throw new Error('Contact not found')
  }

  const prompt = `Analyze this lead and provide scoring recommendations:
  
  Contact: ${contact.name}
  Company: ${contact.company}
  Position: ${contact.position}
  Source: ${contact.source}
  Current Score: ${contact.lead_score}
  Tags: ${contact.tags?.join(', ') || 'None'}
  
  Provide:
  1. Recommended lead score (0-100)
  2. Key factors influencing the score
  3. Next best actions
  4. Lifecycle stage recommendation`

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a CRM expert specializing in lead scoring and sales optimization.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
    }),
  })

  const aiResult = await response.json()
  const analysis = aiResult.choices[0].message.content

  // Update contact with AI recommendations - SCOPED to user
  const scoreMatch = analysis.match(/score[:\s]*(\d+)/i)
  const newScore = scoreMatch ? parseInt(scoreMatch[1]) : contact.lead_score

  await supabase
    .from('crm_contacts')
    .update({ 
      lead_score: newScore,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', contact_id)
    .eq('user_id', userId) // CRITICAL: scope to user

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysis,
      updated_score: newScore,
      contact_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateEmailTemplate(userId: string, data: any, supabase: any, corsHeaders: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured')
  }

  const { template_type, target_segment, product_info } = data

  const prompt = `Create a professional email template for ${template_type || 'marketing'}:
  
  Target Segment: ${target_segment || 'general'}
  Product/Service: ${product_info || 'e-commerce'}
  
  Generate:
  1. Subject line (engaging, under 50 characters)
  2. Email body (personalized, action-oriented)
  3. Call-to-action
  4. Follow-up recommendations
  
  Make it conversion-focused and personalized for the French market.`

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert email marketing copywriter specializing in French e-commerce.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
    }),
  })

  const aiResult = await response.json()
  const template = aiResult.choices[0].message.content

  // Store generated template - SCOPED to user
  const { data: savedTemplate, error } = await supabase
    .from('generated_content')
    .insert({
      user_id: userId, // CRITICAL: from token only
      content_type: 'email',
      target_keyword: target_segment,
      generated_content: template,
      ai_model: 'gemini-2.5-flash',
      tokens_used: aiResult.usage?.total_tokens || 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving template:', error)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      template,
      template_id: savedTemplate?.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createCampaign(userId: string, data: any, supabase: any, corsHeaders: any) {
  const {
    name,
    description,
    type,
    budget_total,
    target_audience,
    content,
    scheduled_at
  } = data

  // Create campaign - SCOPED to user
  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      user_id: userId, // CRITICAL: from token only
      name,
      description,
      type,
      budget_total,
      target_audience,
      content,
      scheduled_at,
      status: scheduled_at ? 'scheduled' : 'draft',
      settings: {
        auto_optimize: true,
        track_opens: true,
        track_clicks: true
      }
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating campaign:', error)
    throw error
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCRMAnalytics(userId: string, supabase: any, corsHeaders: any) {
  // Get contacts stats - SCOPED to user
  const { data: contacts, error: contactsError } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', userId) // CRITICAL: scope to user

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError)
    throw contactsError
  }

  // Get campaign stats - SCOPED to user
  const { data: campaigns, error: campaignsError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('user_id', userId) // CRITICAL: scope to user

  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError)
    throw campaignsError
  }

  const analytics = {
    contacts: {
      total: contacts.length,
      active: contacts.filter((c: any) => c.status === 'active').length,
      leads: contacts.filter((c: any) => c.lifecycle_stage?.includes('lead')).length,
      customers: contacts.filter((c: any) => c.lifecycle_stage === 'customer').length,
      avg_lead_score: contacts.reduce((sum: number, c: any) => sum + (c.lead_score || 0), 0) / contacts.length || 0
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter((c: any) => c.status === 'active').length,
      total_budget: campaigns.reduce((sum: number, c: any) => sum + (c.budget_total || 0), 0),
      total_spent: campaigns.reduce((sum: number, c: any) => sum + (c.budget_spent || 0), 0)
    },
    growth: {
      new_contacts_this_month: contacts.filter((c: any) => 
        new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      conversion_rate: contacts.filter((c: any) => c.lifecycle_stage === 'customer').length / contacts.length * 100 || 0
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      analytics
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
