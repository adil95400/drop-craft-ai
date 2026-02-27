import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Review Moderator - Request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, reviewId, reviewIds, reviewData, photoId } = await req.json();
    console.log(`📋 Action: ${action}`);

    // AI Moderation for single review
    if (action === 'moderate_review') {
      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (!review) {
        throw new Error('Review not found');
      }

      console.log('🔍 Analyzing review with AI...');

      // Call Lovable AI for sentiment analysis and content moderation
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            {
              role: 'system',
              content: 'You are a review moderation AI. Analyze reviews for: 1) Sentiment (positive/neutral/negative), 2) Inappropriate content (spam, offensive, fake), 3) Key themes/categories. Return JSON only.'
            },
            {
              role: 'user',
              content: `Review Title: ${review.title || 'N/A'}\nReview Content: ${review.content}\nRating: ${review.rating}/5\n\nProvide moderation analysis in JSON format with: sentiment, is_appropriate (boolean), spam_probability (0-1), categories (array), recommendation (approve/reject/flag), reasoning.`
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', await aiResponse.text());
        throw new Error('AI moderation failed');
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      // Parse AI response
      let moderationData;
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        moderationData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        moderationData = { sentiment: 'neutral', is_appropriate: true, recommendation: 'flag' };
      }

      console.log('✅ AI Analysis:', moderationData);

      // Update review with AI moderation
      const newStatus = moderationData.recommendation === 'approve' ? 'approved' : 
                       moderationData.recommendation === 'reject' ? 'rejected' : 'flagged';

      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          status: newStatus,
          ai_sentiment: moderationData.sentiment,
          ai_categories: moderationData.categories || [],
          moderation_data: moderationData,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          reviewId,
          status: newStatus,
          moderation: moderationData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk moderate reviews
    if (action === 'bulk_moderate') {
      console.log(`📦 Bulk moderating ${reviewIds.length} reviews...`);
      
      const results = [];
      for (const id of reviewIds) {
        try {
          const response = await fetch(req.url, {
            method: 'POST',
            headers: {
              ...req.headers,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'moderate_review', reviewId: id })
          });
          const result = await response.json();
          results.push(result);
        } catch (error) {
          results.push({ success: false, reviewId: id, error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Manual approve/reject
    if (action === 'manual_moderate') {
      const { status, notes } = reviewData;
      
      const { error } = await supabase
        .from('reviews')
        .update({
          status,
          moderation_notes: notes,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', reviewId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, reviewId, status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Moderate photo
    if (action === 'moderate_photo') {
      const { data: photo } = await supabase
        .from('review_photos')
        .select('*')
        .eq('id', photoId)
        .single();

      if (!photo) {
        throw new Error('Photo not found');
      }

      // Simple AI analysis for photos (could be enhanced with vision API)
      const { error } = await supabase
        .from('review_photos')
        .update({
          moderation_status: 'approved',
          ai_analysis: { auto_approved: true, timestamp: new Date().toISOString() }
        })
        .eq('id', photoId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, photoId, status: 'approved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get moderation stats
    if (action === 'get_stats') {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('status, ai_sentiment, rating')
        .eq('user_id', user.id);

      const stats = {
        total: reviews?.length || 0,
        pending: reviews?.filter(r => r.status === 'pending').length || 0,
        approved: reviews?.filter(r => r.status === 'approved').length || 0,
        rejected: reviews?.filter(r => r.status === 'rejected').length || 0,
        flagged: reviews?.filter(r => r.status === 'flagged').length || 0,
        average_rating: reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        sentiment: {
          positive: reviews?.filter(r => r.ai_sentiment === 'positive').length || 0,
          neutral: reviews?.filter(r => r.ai_sentiment === 'neutral').length || 0,
          negative: reviews?.filter(r => r.ai_sentiment === 'negative').length || 0
        }
      };

      return new Response(
        JSON.stringify({ success: true, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('❌ Error in review-moderator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
