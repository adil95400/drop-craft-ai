-- Table pour les segments clients
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '{}',
  contact_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own segments" ON public.customer_segments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own segments" ON public.customer_segments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own segments" ON public.customer_segments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own segments" ON public.customer_segments
FOR DELETE USING (auth.uid() = user_id);

-- Table pour les connexions marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marketplace_id TEXT NOT NULL,
  marketplace_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  config JSONB DEFAULT '{}',
  credentials_encrypted TEXT,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT false,
  stats JSONB DEFAULT '{"published": 0, "pending": 0, "rejected": 0}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own connections" ON public.marketplace_connections
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" ON public.marketplace_connections
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON public.marketplace_connections
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON public.marketplace_connections
FOR DELETE USING (auth.uid() = user_id);

-- Table pour les transporteurs (carriers)
CREATE TABLE IF NOT EXISTS public.carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  carrier_code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  tracking_url_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own carriers" ON public.carriers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carriers" ON public.carriers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own carriers" ON public.carriers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own carriers" ON public.carriers
FOR DELETE USING (auth.uid() = user_id);

-- Table pour les retours RMA
CREATE TABLE IF NOT EXISTS public.returns_rma (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID,
  rma_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  reason_category TEXT NOT NULL,
  reason TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  refund_amount NUMERIC(10,2),
  refund_method TEXT,
  refund_status TEXT DEFAULT 'pending',
  return_label_url TEXT,
  return_tracking_number TEXT,
  return_carrier TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  inspected_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  quantity INTEGER DEFAULT 1,
  images TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.returns_rma ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own returns" ON public.returns_rma
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own returns" ON public.returns_rma
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own returns" ON public.returns_rma
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own returns" ON public.returns_rma
FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_customer_segments_updated_at
BEFORE UPDATE ON public.customer_segments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_connections_updated_at
BEFORE UPDATE ON public.marketplace_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at
BEFORE UPDATE ON public.carriers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_returns_rma_updated_at
BEFORE UPDATE ON public.returns_rma
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();