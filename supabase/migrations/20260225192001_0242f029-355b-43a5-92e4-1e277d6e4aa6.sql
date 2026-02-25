-- Add premium supplier fields
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'standard' CHECK (tier IN ('standard', 'silver', 'gold', 'platinum')),
  ADD COLUMN IF NOT EXISTS total_orders integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_delivery_days integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS return_rate numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT null,
  ADD COLUMN IF NOT EXISTS description text DEFAULT null,
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_order_value numeric(10,2) DEFAULT null;

-- Index for verified premium suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_verified_tier ON public.suppliers (is_verified, tier) WHERE is_verified = true;