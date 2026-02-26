import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  images?: string[];
}

export class ReviewsService {
  /**
   * Récupère les avis pour un produit depuis la table product_reviews
   */
  static async getProductReviews(productId: string): Promise<Review[]> {
    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !reviews) return [];

    return reviews.map((review) => ({
      id: review.id,
      customer_name: review.author || 'Client anonyme',
      rating: review.rating,
      title: review.text?.substring(0, 50) || 'Avis',
      comment: review.text || '',
      verified_purchase: review.verified_purchase ?? false,
      helpful_count: review.helpful_count ?? 0,
      created_at: review.review_date || review.created_at,
      images: review.images || [],
    }));
  }

  /**
   * Calcule les statistiques des avis
   */
  static calculateReviewStats(reviews: Review[]) {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: [0, 0, 0, 0, 0]
      };
    }

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const distribution = [5, 4, 3, 2, 1].map(rating => 
      reviews.filter(r => r.rating === rating).length
    );

    return {
      averageRating,
      totalReviews: reviews.length,
      distribution
    };
  }
}
