-- Table pour les configurations de profit par utilisateur
CREATE TABLE IF NOT EXISTS public.profit_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_shipping_cost DECIMAL(10,2) DEFAULT 0,
  default_packaging_cost DECIMAL(10,2) DEFAULT 0,
  default_transaction_fee_percent DECIMAL(5,2) DEFAULT 2.9,
  default_ad_cost_percent DECIMAL(5,2) DEFAULT 15,
  default_vat_percent DECIMAL(5,2) DEFAULT 20,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les calculs de profit enregistrés
CREATE TABLE IF NOT EXISTS public.profit_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  product_cost DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  packaging_cost DECIMAL(10,2) DEFAULT 0,
  transaction_fee DECIMAL(10,2) NOT NULL,
  ad_cost DECIMAL(10,2) NOT NULL,
  vat DECIMAL(10,2) NOT NULL,
  other_costs DECIMAL(10,2) DEFAULT 0,
  net_profit DECIMAL(10,2) NOT NULL,
  profit_margin_percent DECIMAL(5,2) NOT NULL,
  roi_percent DECIMAL(5,2) NOT NULL,
  breakeven_units INTEGER NOT NULL,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profit_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_calculations ENABLE ROW LEVEL SECURITY;

-- Policies pour profit_configurations
CREATE POLICY "Users can view their own profit config"
  ON public.profit_configurations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profit config"
  ON public.profit_configurations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profit config"
  ON public.profit_configurations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour profit_calculations
CREATE POLICY "Users can view their own profit calculations"
  ON public.profit_calculations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profit calculations"
  ON public.profit_calculations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profit calculations"
  ON public.profit_calculations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profit calculations"
  ON public.profit_calculations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_profit_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profit_configurations_updated_at
  BEFORE UPDATE ON public.profit_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profit_configurations_updated_at();

CREATE OR REPLACE FUNCTION public.update_profit_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profit_calculations_updated_at
  BEFORE UPDATE ON public.profit_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profit_calculations_updated_at();

-- Index pour performance
CREATE INDEX idx_profit_configurations_user_id ON public.profit_configurations(user_id);
CREATE INDEX idx_profit_calculations_user_id ON public.profit_calculations(user_id);
CREATE INDEX idx_profit_calculations_created_at ON public.profit_calculations(created_at DESC);