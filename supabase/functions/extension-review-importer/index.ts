import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewImportRequest {
  source: 'csv' | 'json' | 'trustpilot' | 'google' | 'amazon' | 'aliexpress' | 'url';
  data?: any[];
  apiUrl?: string;
  apiKey?: string;
  productMapping?: Record<string, string>;
}

// Platform-specific review extraction patterns
const extractAmazonReviews = (html: string): any[] => {
  const reviews: any[] = [];
  
  // Extract review blocks
  const reviewPattern = /<div[^>]*data-hook="review"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  const matches = html.matchAll(reviewPattern);
  
  for (const match of matches) {
    const block = match[1];
    
    // Extract rating
    const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:out of|sur)\s*5/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 5;
    
    // Extract title
    const titleMatch = block.match(/data-hook="review-title"[^>]*>([^<]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract comment
    const commentMatch = block.match(/data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/i);
    const comment = commentMatch ? commentMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extract author
    const authorMatch = block.match(/class="a-profile-name"[^>]*>([^<]+)/i);
    const customer_name = authorMatch ? authorMatch[1].trim() : 'Client Amazon';
    
    // Extract date
    const dateMatch = block.match(/data-hook="review-date"[^>]*>[^>]*>([^<]+)/i);
    let review_date = null;
    if (dateMatch) {
      try {
        review_date = new Date(dateMatch[1].trim()).toISOString();
      } catch (e) {
        review_date = null;
      }
    }
    
    // Check verified
    const verified = block.toLowerCase().includes('verified purchase') || 
                     block.toLowerCase().includes('achat vérifié');
    
    // Extract images
    const imageMatches = block.matchAll(/src="([^"]+(?:jpg|jpeg|png|webp)[^"]*)"/gi);
    const images = Array.from(imageMatches).map(m => m[1]).slice(0, 5);
    
    if (comment || title) {
      reviews.push({
        customer_name,
        rating,
        title,
        comment,
        verified_purchase: verified,
        review_date,
        images,
        helpful_count: 0,
      });
    }
  }
  
  return reviews;
};

const extractAliExpressReviews = (html: string): any[] => {
  const reviews: any[] = [];
  
  // Try to find JSON data in the page
  const jsonMatch = html.match(/window\.__INIT_DATA__\s*=\s*({[\s\S]*?});/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const feedbacks = data?.feedbackModule?.feedbackList || [];
      
      for (const fb of feedbacks) {
        reviews.push({
          customer_name: fb.buyerName || 'Client AliExpress',
          rating: fb.buyerEval || 5,
          title: '',
          comment: fb.buyerFeedback || '',
          verified_purchase: true,
          review_date: fb.evalDate || null,
          images: fb.images || [],
          helpful_count: 0,
        });
      }
    } catch (e) {
      console.error('Failed to parse AliExpress JSON:', e);
    }
  }
  
  // Fallback: regex extraction
  if (reviews.length === 0) {
    const reviewPattern = /<div[^>]*class="[^"]*feedback[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const matches = html.matchAll(reviewPattern);
    
    for (const match of matches) {
      const block = match[1];
      const commentMatch = block.match(/>([^<]{20,})</);
      if (commentMatch) {
        reviews.push({
          customer_name: 'Client AliExpress',
          rating: 5,
          title: '',
          comment: commentMatch[1].trim(),
          verified_purchase: true,
          review_date: null,
          images: [],
          helpful_count: 0,
        });
      }
    }
  }
  
  return reviews;
};

const extractTrustpilotReviews = (html: string): any[] => {
  const reviews: any[] = [];
  
  const reviewPattern = /<article[^>]*data-service-review-card-paper[^>]*>([\s\S]*?)<\/article>/gi;
  const matches = html.matchAll(reviewPattern);
  
  for (const match of matches) {
    const block = match[1];
    
    // Extract rating from stars
    const ratingMatch = block.match(/rating-(\d)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
    
    // Extract title
    const titleMatch = block.match(/data-service-review-title[^>]*>([^<]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract comment
    const commentMatch = block.match(/data-service-review-text[^>]*>([\s\S]*?)<\/p>/i);
    const comment = commentMatch ? commentMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extract author
    const authorMatch = block.match(/data-consumer-name[^>]*>([^<]+)/i);
    const customer_name = authorMatch ? authorMatch[1].trim() : 'Client Trustpilot';
    
    // Extract date
    const dateMatch = block.match(/datetime="([^"]+)"/i);
    const review_date = dateMatch ? dateMatch[1] : null;
    
    if (comment || title) {
      reviews.push({
        customer_name,
        rating,
        title,
        comment,
        verified_purchase: true,
        review_date,
        images: [],
        helpful_count: 0,
      });
    }
  }
  
  return reviews;
};

const extractGenericReviews = (html: string): any[] => {
  const reviews: any[] = [];
  
  // Look for common review patterns
  const patterns = [
    /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const block = match[1];
      
      // Try to extract rating
      const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*5|out of 5|stars?|étoiles?)/i);
      const rating = ratingMatch ? Math.min(5, parseFloat(ratingMatch[1])) : 5;
      
      // Try to extract text content
      const textContent = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (textContent.length > 30) {
        reviews.push({
          customer_name: 'Client',
          rating,
          title: '',
          comment: textContent.substring(0, 1000),
          verified_purchase: false,
          review_date: null,
          images: [],
          helpful_count: 0,
        });
      }
    }
    
    if (reviews.length > 0) break;
  }
  
  return reviews;
};

const fetchAndExtractReviews = async (url: string): Promise<any[]> => {
  console.log('Fetching reviews from URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('Fetched HTML length:', html.length);
    
    // Detect platform and extract reviews
    if (url.includes('amazon')) {
      return extractAmazonReviews(html);
    } else if (url.includes('aliexpress')) {
      return extractAliExpressReviews(html);
    } else if (url.includes('trustpilot')) {
      return extractTrustpilotReviews(html);
    } else {
      return extractGenericReviews(html);
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { source, data, apiUrl, apiKey, productMapping }: ReviewImportRequest = await req.json();

    let reviews: any[] = [];

    // Import from different sources
    if (source === 'csv' || source === 'json') {
      reviews = data || [];
    } else if (source === 'url' && apiUrl) {
      // Extract reviews from URL
      reviews = await fetchAndExtractReviews(apiUrl);
      console.log(`Extracted ${reviews.length} reviews from URL`);
      
      // Return extracted reviews without saving (for preview)
      return new Response(
        JSON.stringify({
          success: true,
          reviews,
          count: reviews.length,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (source === 'trustpilot' && apiUrl) {
      // Import from Trustpilot API
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Erreur Trustpilot: ${response.statusText}`);
      }
      const trustpilotData = await response.json();
      reviews = trustpilotData.reviews || [];
    } else if (source === 'google' && apiUrl) {
      // Import from Google Reviews
      const response = await fetch(`${apiUrl}?key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Erreur Google: ${response.statusText}`);
      }
      const googleData = await response.json();
      reviews = googleData.result?.reviews || [];
    } else if ((source === 'amazon' || source === 'aliexpress') && data) {
      reviews = data;
    }

    // Normalize and insert reviews
    const normalizedReviews = reviews.map(r => ({
      product_name: r.product_name || r.productName || '',
      product_sku: r.product_sku || r.sku || '',
      customer_name: r.customer_name || r.author_name || r.name || 'Anonyme',
      rating: parseFloat(r.rating || r.stars || 0),
      title: r.title || '',
      comment: r.comment || r.text || r.review || '',
      verified_purchase: r.verified_purchase || r.verified || false,
      helpful_count: r.helpful_count || 0,
      review_date: r.review_date || r.date || new Date().toISOString(),
      images: r.images || [],
      source: source,
      user_id: user.id,
    }));

    const { data: insertedReviews, error } = await supabaseClient
      .from('imported_reviews')
      .insert(normalizedReviews)
      .select();

    if (error) throw error;

    // Update product statistics
    for (const review of normalizedReviews) {
      if (review.product_sku) {
        const { data: product } = await supabaseClient
          .from('products')
          .select('id, rating, reviews_count')
          .eq('sku', review.product_sku)
          .eq('user_id', user.id)
          .single();

        if (product) {
          const newReviewsCount = (product.reviews_count || 0) + 1;
          const currentRating = product.rating || 0;
          const newRating = ((currentRating * (product.reviews_count || 0)) + review.rating) / newReviewsCount;

          await supabaseClient
            .from('products')
            .update({
              rating: newRating,
              reviews_count: newReviewsCount,
            })
            .eq('id', product.id);
        }
      }
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'extension_review_import',
        description: `Import de ${insertedReviews?.length || 0} avis via ${source}`,
        details: {
          source,
          count: insertedReviews?.length || 0,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedReviews?.length || 0,
        reviews: insertedReviews,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur import avis:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
