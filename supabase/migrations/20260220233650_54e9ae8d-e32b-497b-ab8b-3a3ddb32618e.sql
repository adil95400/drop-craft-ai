
-- Stats agrégées par produit (table manquante)
CREATE TABLE IF NOT EXISTS public.product_review_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_1 INTEGER DEFAULT 0,
  rating_2 INTEGER DEFAULT 0,
  rating_3 INTEGER DEFAULT 0,
  rating_4 INTEGER DEFAULT 0,
  rating_5 INTEGER DEFAULT 0,
  total_with_images INTEGER DEFAULT 0,
  total_verified INTEGER DEFAULT 0,
  last_review_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_review_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review stats"
  ON public.product_review_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own review stats"
  ON public.product_review_stats FOR ALL
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour les stats automatiquement
CREATE OR REPLACE FUNCTION public.update_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
  target_user_id UUID;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  
  INSERT INTO public.product_review_stats (product_id, user_id, total_reviews, average_rating, rating_1, rating_2, rating_3, rating_4, rating_5, total_with_images, total_verified, last_review_at)
  SELECT
    target_product_id,
    target_user_id,
    COUNT(*),
    COALESCE(AVG(rating), 0),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5),
    COUNT(*) FILTER (WHERE array_length(images, 1) > 0),
    COUNT(*) FILTER (WHERE verified_purchase = true),
    MAX(created_at)
  FROM public.product_reviews
  WHERE product_id = target_product_id
    AND user_id = target_user_id
  ON CONFLICT (product_id)
  DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_1 = EXCLUDED.rating_1,
    rating_2 = EXCLUDED.rating_2,
    rating_3 = EXCLUDED.rating_3,
    rating_4 = EXCLUDED.rating_4,
    rating_5 = EXCLUDED.rating_5,
    total_with_images = EXCLUDED.total_with_images,
    total_verified = EXCLUDED.total_verified,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_review_stats ON public.product_reviews;
CREATE TRIGGER trigger_update_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_stats();
