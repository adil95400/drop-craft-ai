-- Create disputes table for order disputes management
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID,
  type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  marketplace TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_products table for cross-marketplace product sync
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID,
  marketplace TEXT NOT NULL,
  external_id TEXT,
  stock INTEGER DEFAULT 0,
  price DECIMAL(12,2),
  title TEXT,
  description TEXT,
  sync_status TEXT DEFAULT 'pending',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_price_rules table for dynamic pricing rules
CREATE TABLE IF NOT EXISTS public.marketplace_price_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marketplace TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'fixed_markup',
  value DECIMAL(12,4),
  min_price DECIMAL(12,2),
  max_price DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_price_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Users can view their own disputes" ON public.disputes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own disputes" ON public.disputes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own disputes" ON public.disputes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for marketplace_products
CREATE POLICY "Users can view their own marketplace products" ON public.marketplace_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own marketplace products" ON public.marketplace_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own marketplace products" ON public.marketplace_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own marketplace products" ON public.marketplace_products FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for marketplace_price_rules
CREATE POLICY "Users can view their own price rules" ON public.marketplace_price_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own price rules" ON public.marketplace_price_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own price rules" ON public.marketplace_price_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own price rules" ON public.marketplace_price_rules FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_user_id ON public.marketplace_products(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_marketplace ON public.marketplace_products(marketplace);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_rules_user_id ON public.marketplace_price_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_price_rules_marketplace ON public.marketplace_price_rules(marketplace);

-- Triggers for updated_at
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_marketplace_products_updated_at BEFORE UPDATE ON public.marketplace_products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_marketplace_price_rules_updated_at BEFORE UPDATE ON public.marketplace_price_rules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();