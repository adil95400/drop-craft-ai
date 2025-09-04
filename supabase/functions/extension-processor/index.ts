import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { jobId } = await req.json()

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('extension_jobs')
      .select('*, extensions(*)')
      .eq('id', jobId)
      .single()

    if (jobError) throw jobError

    // Update job status to processing
    await supabase
      .from('extension_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 0
      })
      .eq('id', jobId)

    // Process based on extension type
    let results = []
    const extension = job.extensions

    if (extension.provider === 'amazon') {
      results = await processAmazonImport(job, supabase)
    } else if (extension.provider === 'social_media') {
      results = await processSocialReviews(job, supabase)
    } else if (extension.provider === 'shopify') {
      results = await processShopifySync(job, supabase)
    }

    // Update job completion
    await supabase
      .from('extension_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100,
        success_items: results.length,
        output_data: { results }
      })
      .eq('id', jobId)

    return new Response(
      JSON.stringify({ success: true, processed: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processAmazonImport(job: any, supabase: any) {
  const { searchTerm, maxProducts = 10 } = job.input_data
  const results = []

  // Mock Amazon products
  for (let i = 0; i < maxProducts; i++) {
    const mockProduct = {
      external_id: `amazon_${Date.now()}_${i}`,
      name: `Produit Amazon ${i + 1} - ${searchTerm}`,
      price: Math.floor(Math.random() * 100) + 10,
      description: `Description détaillée du produit Amazon ${i + 1}`,
      category: 'Electronics',
      rating: (Math.random() * 2 + 3).toFixed(1),
      image_url: `https://via.placeholder.com/300x300?text=Product${i + 1}`
    }

    // Store in extension_data
    await supabase
      .from('extension_data')
      .insert({
        user_id: job.user_id,
        extension_id: job.extension_id,
        job_id: job.id,
        data_type: 'product',
        external_id: mockProduct.external_id,
        data_content: mockProduct,
        quality_score: Math.random() * 100
      })

    results.push(mockProduct)
  }

  return results
}

async function processSocialReviews(job: any, supabase: any) {
  const { platform, productId } = job.input_data
  const results = []

  // Mock social media reviews
  for (let i = 0; i < 5; i++) {
    const mockReview = {
      external_id: `${platform}_${productId}_${Date.now()}_${i}`,
      platform,
      rating: Math.floor(Math.random() * 5) + 1,
      content: `Excellent produit! Je le recommande vivement. Avis ${i + 1}`,
      customer_name: `Utilisateur ${i + 1}`,
      verified_purchase: Math.random() > 0.3
    }

    await supabase
      .from('extension_data')
      .insert({
        user_id: job.user_id,
        extension_id: job.extension_id,
        job_id: job.id,
        data_type: 'review',
        external_id: mockReview.external_id,
        data_content: mockReview,
        quality_score: Math.random() * 100
      })

    results.push(mockReview)
  }

  return results
}

async function processShopifySync(job: any, supabase: any) {
  const results = []
  
  // Mock Shopify sync
  for (let i = 0; i < 3; i++) {
    const mockSync = {
      external_id: `shopify_sync_${Date.now()}_${i}`,
      type: 'product_update',
      status: 'synced',
      changes: ['price', 'inventory']
    }

    results.push(mockSync)
  }

  return results
}