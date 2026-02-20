import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductReview {
  id: string;
  product_id: string | null;
  user_id: string;
  rating: number;
  text: string;
  author: string;
  review_date: string | null;
  country: string | null;
  helpful_count: number | null;
  verified_purchase: boolean | null;
  images: string[] | null;
  source_url: string | null;
  source_platform: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  product_name?: string;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
  positiveCount: number;
  negativeCount: number;
  verifiedCount: number;
  withImagesCount: number;
}

export function useProductReviews(filters?: {
  productId?: string;
  minRating?: number;
  maxRating?: number;
  platform?: string;
  search?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['product-reviews', user?.id, filters],
    queryFn: async (): Promise<ProductReview[]> => {
      if (!user) return [];

      let query = supabase
        .from('product_reviews')
        .select('*, products!product_reviews_product_id_fkey(name, title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }
      if (filters?.maxRating) {
        query = query.lte('rating', filters.maxRating);
      }
      if (filters?.platform && filters.platform !== 'all') {
        query = query.eq('source_platform', filters.platform);
      }
      if (filters?.search) {
        query = query.or(`text.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;

      return (data || []).map((r: any) => ({
        ...r,
        product_name: r.products?.name || r.products?.title || 'Produit inconnu',
      }));
    },
    enabled: !!user,
  });
}

export function useReviewStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['review-stats', user?.id],
    queryFn: async (): Promise<ReviewStats> => {
      if (!user) return { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, positiveCount: 0, negativeCount: 0, verifiedCount: 0, withImagesCount: 0 };

      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating, verified_purchase, images')
        .eq('user_id', user.id);

      if (error) throw error;

      const reviews = data || [];
      const total = reviews.length;
      const average = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

      return {
        total,
        average: Math.round(average * 10) / 10,
        distribution,
        positiveCount: reviews.filter(r => r.rating >= 4).length,
        negativeCount: reviews.filter(r => r.rating <= 2).length,
        verifiedCount: reviews.filter(r => r.verified_purchase).length,
        withImagesCount: reviews.filter(r => r.images && r.images.length > 0).length,
      };
    },
    enabled: !!user,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: {
      product_id?: string;
      rating: number;
      text: string;
      author: string;
      verified_purchase?: boolean;
      source_platform?: string;
      images?: string[];
      review_date?: string;
    }) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: user.id,
          product_id: review.product_id || null,
          rating: review.rating,
          text: review.text,
          author: review.author,
          verified_purchase: review.verified_purchase || false,
          source_platform: review.source_platform || 'manual',
          images: review.images || [],
          review_date: review.review_date || new Date().toISOString().split('T')[0],
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
      toast.success('Avis ajouté avec succès');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
      toast.success('Avis supprimé');
    },
    onError: (err: any) => toast.error(err.message),
  });
}
