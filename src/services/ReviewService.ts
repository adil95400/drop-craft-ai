import { supabase } from '@/integrations/supabase/client';

export class ReviewService {
  // Get all reviews
  static async getReviews(filters?: any) {
    const query = supabase
      .from('reviews' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query.eq('status', filters.status);
    }
    if (filters?.product_id) {
      query.eq('product_id', filters.product_id);
    }
    if (filters?.platform) {
      query.eq('platform', filters.platform);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Create manual review
  static async createReview(review: any) {
    const { data, error } = await supabase
      .from('reviews' as any)
      .insert({
        ...review,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update review
  static async updateReview(id: string, updates: any) {
    const { data, error } = await supabase
      .from('reviews' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete review
  static async deleteReview(id: string) {
    const { error } = await supabase
      .from('reviews' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // AI Moderate review
  static async moderateReview(reviewId: string) {
    const { data, error } = await supabase.functions.invoke('review-moderator', {
      body: { action: 'moderate_review', reviewId }
    });

    if (error) throw error;
    return data;
  }

  // Bulk moderate
  static async bulkModerate(reviewIds: string[]) {
    const { data, error } = await supabase.functions.invoke('review-moderator', {
      body: { action: 'bulk_moderate', reviewIds }
    });

    if (error) throw error;
    return data;
  }

  // Manual moderate
  static async manualModerate(reviewId: string, status: string, notes?: string) {
    const { data, error } = await supabase.functions.invoke('review-moderator', {
      body: { 
        action: 'manual_moderate', 
        reviewId, 
        reviewData: { status, notes } 
      }
    });

    if (error) throw error;
    return data;
  }

  // Get moderation stats
  static async getModerationStats() {
    const { data, error } = await supabase.functions.invoke('review-moderator', {
      body: { action: 'get_stats' }
    });

    if (error) throw error;
    return data?.stats;
  }

  // Review Photos
  static async getReviewPhotos(reviewId: string) {
    const { data, error } = await supabase
      .from('review_photos' as any)
      .select('*')
      .eq('review_id', reviewId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async uploadReviewPhoto(reviewId: string, file: File) {
    const fileName = `${reviewId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('review-photos')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('review_photos' as any)
      .insert({
        review_id: reviewId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        photo_url: urlData.publicUrl
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Review Widgets
  static async getWidgets() {
    const { data, error } = await supabase
      .from('review_widgets' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createWidget(widget: any) {
    const { data, error } = await supabase
      .from('review_widgets' as any)
      .insert({
        ...widget,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Import Jobs
  static async getImportJobs() {
    const { data, error } = await supabase
      .from('review_import_jobs' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createImportJob(job: any) {
    const { data, error } = await supabase
      .from('review_import_jobs' as any)
      .insert({
        ...job,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics
  static async getReviewAnalytics() {
    const { data: reviews } = await supabase
      .from('reviews' as any)
      .select('status, rating, ai_sentiment, platform, created_at');

    if (!reviews || !Array.isArray(reviews)) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total_reviews: reviews.length,
      average_rating: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0,
      by_status: {
        pending: reviews.filter((r: any) => r.status === 'pending').length,
        approved: reviews.filter((r: any) => r.status === 'approved').length,
        rejected: reviews.filter((r: any) => r.status === 'rejected').length,
        flagged: reviews.filter((r: any) => r.status === 'flagged').length
      },
      by_sentiment: {
        positive: reviews.filter((r: any) => r.ai_sentiment === 'positive').length,
        neutral: reviews.filter((r: any) => r.ai_sentiment === 'neutral').length,
        negative: reviews.filter((r: any) => r.ai_sentiment === 'negative').length
      },
      by_platform: reviews.reduce((acc: any, r: any) => {
        acc[r.platform] = (acc[r.platform] || 0) + 1;
        return acc;
      }, {} as any),
      recent_trend: reviews.filter((r: any) => new Date(r.created_at) >= thirtyDaysAgo).length
    };
  }
}
