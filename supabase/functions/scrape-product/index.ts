import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string
  userId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, userId }: ScrapeRequest = await req.json()

    if (!url || !userId) {
      throw new Error('URL and userId are required')
    }

    console.log(`Scraping product from: ${url}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // Basic HTML parsing to extract product information
    const extractMetaTag = (content: string, property: string): string | null => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
      const match = content.match(regex)
      return match ? match[1] : null
    }

    const extractTitle = (content: string): string => {
      const match = content.match(/<title[^>]*>([^<]+)<\/title>/i)
      return match ? match[1].trim() : 'Produit sans titre'
    }

    const extractPrice = (content: string): number => {
      // Try to find price in common formats
      const pricePatterns = [
        /€\s*(\d+[,.]?\d*)/,
        /(\d+[,.]?\d*)\s*€/,
        /\$\s*(\d+[.,]?\d*)/,
        /(\d+[.,]?\d*)\s*\$/,
        /"price"[^>]*>(\d+[.,]?\d*)/i,
      ]

      for (const pattern of pricePatterns) {
        const match = content.match(pattern)
        if (match) {
          const price = parseFloat(match[1].replace(',', '.'))
          if (!isNaN(price)) return price
        }
      }
      return 0
    }

    const extractImages = (content: string): string[] => {
      const images: string[] = []
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
      let match

      while ((match = imgRegex.exec(content)) !== null) {
        const imgUrl = match[1]
        if (imgUrl.startsWith('http') && !imgUrl.includes('logo') && !imgUrl.includes('icon')) {
          images.push(imgUrl)
        }
      }

      return images.slice(0, 5) // Return first 5 images
    }

    // Extract product data
    const productData = {
      name: extractMetaTag(html, 'og:title') || extractTitle(html),
      description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '',
      price: extractPrice(html),
      currency: 'EUR',
      image_urls: extractImages(html),
      source_url: url,
      scraped_at: new Date().toISOString()
    }

    console.log('Extracted product data:', productData)

    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId,
        source_type: 'url',
        source_url: url,
        total_rows: 1,
        processed_rows: 0,
        failed_rows: 0
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating import job:', jobError)
      throw jobError
    }

    // Import the product
    const { data: product, error: productError } = await supabase
      .from('imported_products')
      .insert({
        user_id: userId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        image_urls: productData.image_urls,
        source_url: productData.source_url,
        status: 'draft',
        ai_optimized: false
      })
      .select()
      .single()

    if (productError) {
      console.error('Error importing product:', productError)
      
      // Update job as failed
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          failed_rows: 1,
          errors: [productError.message],
          completed_at: new Date().toISOString()
        })
        .eq('id', importJob.id)

      throw productError
    }

    // Update job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        processed_rows: 1,
        completed_at: new Date().toISOString()
      })
      .eq('id', importJob.id)

    console.log('Product imported successfully:', product.id)

    return new Response(
      JSON.stringify({
        success: true,
        product,
        jobId: importJob.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in scrape-product function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
