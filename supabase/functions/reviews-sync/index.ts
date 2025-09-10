// Supabase Edge Function for syncing reviews from Chrome extension
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Review {
  id: string;
  platform: string;
  rating: number;
  title?: string;
  content: string;
  author: string;
  date: string;
  verified?: boolean;
  url: string;
  scrapedAt: string;
  country?: string;
}

interface SyncRequest {
  reviews: Review[];
  source: string;
  extensionVersion: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== Reviews Sync Request ===')
    console.log('Method:', req.method)
    console.log('URL:', req.url)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body: SyncRequest = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    if (!body.reviews || !Array.isArray(body.reviews)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reviews data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing ${body.reviews.length} reviews...`)

    // Ensure reviews table exists
    await ensureReviewsTable(supabase)

    // Process and insert reviews
    const processedReviews = body.reviews.map(review => ({
      id: review.id,
      platform: review.platform,
      rating: review.rating,
      title: review.title || null,
      content: review.content,
      author: review.author,
      date: review.date,
      verified: review.verified || false,
      url: review.url,
      scraped_at: review.scrapedAt,
      country: review.country || null,
      source: body.source,
      extension_version: body.extensionVersion,
      synced_at: new Date().toISOString()
    }))

    // Upsert reviews (insert or update if exists)
    const { data, error } = await supabase
      .from('imported_reviews')
      .upsert(processedReviews, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully synced ${processedReviews.length} reviews`)

    // Update sync statistics
    await updateSyncStats(supabase, processedReviews.length, body.source)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${processedReviews.length} reviews`,
        synced_count: processedReviews.length,
        synced_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function ensureReviewsTable(supabase: any) {
  // Check if the imported_reviews table exists, create if not
  const { error } = await supabase.rpc('create_imported_reviews_table_if_not_exists')
  
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating reviews table:', error)
    
    // Fallback: try to create the table directly
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS imported_reviews (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        rating INTEGER,
        title TEXT,
        content TEXT NOT NULL,
        author TEXT,
        date TEXT,
        verified BOOLEAN DEFAULT false,
        url TEXT,
        scraped_at TIMESTAMP WITH TIME ZONE,
        country TEXT,
        source TEXT,
        extension_version TEXT,
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_imported_reviews_platform ON imported_reviews(platform);
      CREATE INDEX IF NOT EXISTS idx_imported_reviews_rating ON imported_reviews(rating);
      CREATE INDEX IF NOT EXISTS idx_imported_reviews_synced_at ON imported_reviews(synced_at);
    `
    
    // This would require admin privileges, so we'll just log the error
    console.log('Table creation SQL for manual execution:', createTableSQL)
  }
}

async function updateSyncStats(supabase: any, count: number, source: string) {
  try {
    // Update or create sync statistics
    const { error } = await supabase
      .from('sync_statistics')
      .upsert({
        source: source,
        type: 'reviews',
        last_sync_at: new Date().toISOString(),
        total_synced: count,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'source,type'
      })

    if (error) {
      console.error('Error updating sync stats:', error)
    }
  } catch (error) {
    console.error('Error in updateSyncStats:', error)
  }
}