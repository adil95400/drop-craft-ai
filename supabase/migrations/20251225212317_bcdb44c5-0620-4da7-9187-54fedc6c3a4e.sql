-- Create loyalty_tiers table
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  benefits JSONB DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT 'award',
  color TEXT DEFAULT 'text-orange-600',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_rewards table
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL DEFAULT 0,
  stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_loyalty table for tracking customer points
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES public.loyalty_tiers(id) ON DELETE SET NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty_transactions for points history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_loyalty_id UUID REFERENCES public.customer_loyalty(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'redeemed', 'expired', 'adjusted'
  description TEXT,
  reference_id UUID,
  reference_type TEXT, -- 'order', 'reward', 'referral', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_tiers
CREATE POLICY "Users can manage own loyalty tiers" ON public.loyalty_tiers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loyalty_rewards
CREATE POLICY "Users can manage own loyalty rewards" ON public.loyalty_rewards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for customer_loyalty
CREATE POLICY "Users can manage own customer loyalty" ON public.customer_loyalty
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can manage own loyalty transactions" ON public.loyalty_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_customer_loyalty_customer ON public.customer_loyalty(customer_id);
CREATE INDEX idx_customer_loyalty_tier ON public.customer_loyalty(tier_id);
CREATE INDEX idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_loyalty_id);
CREATE INDEX idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);