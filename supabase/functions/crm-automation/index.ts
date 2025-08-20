import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    console.log(`CRM Automation action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'sync_contacts':
        return await syncContacts(user.id, data);
      
      case 'analyze_lead_score':
        return await analyzeLeadScore(user.id, data);
      
      case 'generate_email_template':
        return await generateEmailTemplate(user.id, data);
      
      case 'create_campaign':
        return await createCampaign(user.id, data);
      
      case 'get_analytics':
        return await getCRMAnalytics(user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in CRM automation function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncContacts(userId: string, data: any) {
  console.log('Syncing contacts for user:', userId);
  
  // Simulate external CRM sync (would integrate with HubSpot, Salesforce, etc.)
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
  ];

  // Insert contacts into database
  const contactsToInsert = mockContacts.map(contact => ({
    ...contact,
    user_id: userId,
    attribution: { campaign: data?.campaign || 'direct' },
    custom_fields: {},
    last_activity_at: new Date().toISOString()
  }));

  const { data: insertedContacts, error } = await supabase
    .from('crm_contacts')
    .insert(contactsToInsert)
    .select();

  if (error) {
    console.error('Error inserting contacts:', error);
    throw error;
  }

  console.log(`Successfully synced ${insertedContacts.length} contacts`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      contacts_synced: insertedContacts.length,
      contacts: insertedContacts
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function analyzeLeadScore(userId: string, data: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { contact_id } = data;
  
  // Get contact data
  const { data: contact, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', contact_id)
    .eq('user_id', userId)
    .single();

  if (error || !contact) {
    throw new Error('Contact not found');
  }

  // Use AI to analyze and improve lead scoring
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
  4. Lifecycle stage recommendation`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are a CRM expert specializing in lead scoring and sales optimization.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 500,
    }),
  });

  const aiResult = await response.json();
  const analysis = aiResult.choices[0].message.content;

  // Update contact with AI recommendations
  const scoreMatch = analysis.match(/score[:\s]*(\d+)/i);
  const newScore = scoreMatch ? parseInt(scoreMatch[1]) : contact.lead_score;

  const { error: updateError } = await supabase
    .from('crm_contacts')
    .update({ 
      lead_score: newScore,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', contact_id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating contact:', updateError);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysis,
      updated_score: newScore,
      contact_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateEmailTemplate(userId: string, data: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { template_type, target_segment, product_info } = data;

  const prompt = `Create a professional email template for ${template_type}:
  
  Target Segment: ${target_segment}
  Product/Service: ${product_info}
  
  Generate:
  1. Subject line (engaging, under 50 characters)
  2. Email body (personalized, action-oriented)
  3. Call-to-action
  4. Follow-up recommendations
  
  Make it conversion-focused and personalized for the French market.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: 'You are an expert email marketing copywriter specializing in French e-commerce.' },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 800,
    }),
  });

  const aiResult = await response.json();
  const template = aiResult.choices[0].message.content;

  // Store generated template
  const { data: savedTemplate, error } = await supabase
    .from('generated_content')
    .insert({
      user_id: userId,
      content_type: 'email',
      target_keyword: target_segment,
      generated_content: template,
      ai_model: 'gpt-5-mini-2025-08-07',
      tokens_used: aiResult.usage?.total_tokens || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving template:', error);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      template,
      template_id: savedTemplate?.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createCampaign(userId: string, data: any) {
  const {
    name,
    description,
    type,
    budget_total,
    target_audience,
    content,
    scheduled_at
  } = data;

  const { data: campaign, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      user_id: userId,
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
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getCRMAnalytics(userId: string) {
  // Get contacts stats
  const { data: contacts, error: contactsError } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('user_id', userId);

  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
    throw contactsError;
  }

  // Get campaign stats
  const { data: campaigns, error: campaignsError } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('user_id', userId);

  if (campaignsError) {
    console.error('Error fetching campaigns:', campaignsError);
    throw campaignsError;
  }

  const analytics = {
    contacts: {
      total: contacts.length,
      active: contacts.filter(c => c.status === 'active').length,
      leads: contacts.filter(c => c.lifecycle_stage.includes('lead')).length,
      customers: contacts.filter(c => c.lifecycle_stage === 'customer').length,
      avg_lead_score: contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length || 0
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      total_budget: campaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
      total_spent: campaigns.reduce((sum, c) => sum + (c.budget_spent || 0), 0)
    },
    growth: {
      new_contacts_this_month: contacts.filter(c => 
        new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      conversion_rate: contacts.filter(c => c.lifecycle_stage === 'customer').length / contacts.length * 100 || 0
    }
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      analytics
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}