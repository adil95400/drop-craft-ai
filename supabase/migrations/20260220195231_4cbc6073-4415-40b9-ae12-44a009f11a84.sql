
-- Add Stripe-specific columns to promotional_coupons
ALTER TABLE public.promotional_coupons
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text,
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id text,
  ADD COLUMN IF NOT EXISTS coupon_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'eur',
  ADD COLUMN IF NOT EXISTS duration text DEFAULT 'once',
  ADD COLUMN IF NOT EXISTS duration_in_months integer,
  ADD COLUMN IF NOT EXISTS max_redemptions integer,
  ADD COLUMN IF NOT EXISTS synced_to_stripe boolean DEFAULT false;

-- Create unique index on stripe_coupon_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotional_coupons_stripe_coupon_id 
  ON public.promotional_coupons(stripe_coupon_id) WHERE stripe_coupon_id IS NOT NULL;

-- Create unique index on code per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotional_coupons_code_user 
  ON public.promotional_coupons(user_id, code);
