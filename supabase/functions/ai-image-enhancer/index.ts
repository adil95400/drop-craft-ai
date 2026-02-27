/**
 * AI Image Enhancer - Enterprise-Safe Implementation
 * P0.1: JWT authentication required
 * P0.4: Secure CORS with allowlist
 * P0.6: Rate limiting per user
 * P0.7: SSRF protection for image URLs
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============ SECURE CORS ============
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getSecureCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.includes('lovable.app');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

// ============ SSRF PROTECTION ============
function isPrivateIPv4(hostname: string): boolean {
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4Match) return false;
  
  const [, a, b] = ipv4Match.map(Number);
  
  // Private ranges
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  
  return false;
}

function validateImageUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid image URL format');
  }

  // Protocol validation
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Image URL must use HTTP/HTTPS protocol');
  }

  const hostname = url.hostname.toLowerCase();

  // Block private IPs and forbidden hosts
  if (isPrivateIPv4(hostname)) {
    throw new Error('Private IP addresses are not allowed');
  }

  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.includes('@')) {
    throw new Error('Forbidden hostname');
  }

  // Block cloud metadata endpoints
  const metadataPatterns = ['169.254.169.254', 'metadata.google', 'metadata.azure'];
  if (metadataPatterns.some(p => hostname.includes(p))) {
    throw new Error('Cloud metadata endpoints are blocked');
  }

  return url;
}

// ============ RATE LIMITING ============
async function checkRateLimit(supabase: any, userId: string, action: string, maxRequests: number, windowMinutes: number): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart);

  const currentCount = count || 0;
  const allowed = currentCount < maxRequests;
  
  if (allowed) {
    await supabase.from('rate_limits').insert({
      user_id: userId,
      action,
      created_at: new Date().toISOString()
    }).catch(() => {});
  }

  return { allowed, remaining: Math.max(0, maxRequests - currentCount - 1) };
}

// ============ AUTHENTICATION ============
async function authenticateUser(req: Request, supabase: any): Promise<{ user: any }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    throw new Error('Invalid or expired authentication token');
  }
  
  return { user: data.user };
}

// Allowed enhancement types
const ALLOWED_ENHANCEMENT_TYPES = new Set([
  'quality',
  'background',
  'lighting',
  'style',
  'upscale'
]);

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // P0.1: Require authentication
    const { user } = await authenticateUser(req, supabase);
    const userId = user.id;

    // P0.6: Rate limiting - 20 requests per hour for image processing
    const rateLimit = await checkRateLimit(supabase, userId, 'ai_image_enhancer', 20, 60);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Reject userId in body
    if ('userId' in body) {
      return new Response(
        JSON.stringify({ error: 'Do not send userId in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageUrl, enhancementType = 'quality', productContext } = body;

    // Validate imageUrl
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // P0.7: SSRF protection
    const validatedUrl = validateImageUrl(imageUrl);

    // Validate enhancement type
    if (!ALLOWED_ENHANCEMENT_TYPES.has(enhancementType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid enhancementType', allowed: Array.from(ALLOWED_ENHANCEMENT_TYPES) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate productContext
    const safeProductContext = typeof productContext === 'string' 
      ? productContext.substring(0, 200) 
      : 'e-commerce product';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI service not configured');
    }

    console.log(`🎨 [${userId.slice(0, 8)}] Enhancing product image: ${enhancementType}`);

    // Enhancement instructions based on type
    const enhancementInstructions: Record<string, string> = {
      quality: 'Enhance image quality: improve sharpness, color vibrancy, lighting balance, remove noise, professional photography look',
      background: 'Professional product photography: clean white background, perfect lighting, studio quality, remove distractions',
      lighting: 'Optimize lighting: balanced exposure, natural highlights, professional studio lighting, enhance product details',
      style: 'Transform to e-commerce style: clean, professional, product-focused, optimized for sales, appealing composition',
      upscale: 'Upscale and enhance: increase resolution, sharpen details, improve clarity, professional quality'
    };

    const instruction = enhancementInstructions[enhancementType];
    const enhancePrompt = `${instruction}. Product: ${safeProductContext}. Maintain product authenticity.`;

    // Enhance image using AI
    const enhanceResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: enhancePrompt },
              { type: 'image_url', image_url: { url: validatedUrl.toString() } }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!enhanceResponse.ok) {
      const status = enhanceResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Image enhancement failed: ${status}`);
    }

    const enhanceData = await enhanceResponse.json();
    const enhancedImage = enhanceData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!enhancedImage) {
      throw new Error('No enhanced image returned from AI');
    }

    // Generate quality score analysis
    let qualityAnalysis = null;
    try {
      const analysisPrompt = `Analyze this product image quality. Return JSON:
{
  "qualityScore": 0-100,
  "improvements": ["improvement 1", "improvement 2"],
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["recommendation 1"]
}`;

      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: analysisPrompt },
                { type: 'image_url', image_url: { url: enhancedImage } }
              ]
            }
          ]
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const analysisContent = analysisData.choices[0].message.content;
        const analysisMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || analysisContent.match(/\{[\s\S]*\}/);
        qualityAnalysis = analysisMatch ? JSON.parse(analysisMatch[1] || analysisMatch[0]) : null;
      }
    } catch (err) {
      console.error('Error analyzing quality:', err);
    }

    // Log the AI task - CRITICAL: Force user_id from JWT
    await supabase.from('ai_tasks').insert({
      user_id: userId, // From JWT, not body
      task_type: 'image_enhancement',
      status: 'completed',
      input_data: { imageUrl: validatedUrl.toString(), enhancementType, productContext: safeProductContext },
      output_data: { enhanced: true, qualityAnalysis }
    });

    return new Response(
      JSON.stringify({
        success: true,
        originalImage: validatedUrl.toString(),
        enhancedImage,
        enhancementType,
        qualityAnalysis,
        processing: {
          model: 'openai/gpt-5-nano',
          method: 'ai-enhancement'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-image-enhancer:', error);
    
    const status = (error as Error).message?.includes('Authentication') ? 401 : 500;
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status, headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
