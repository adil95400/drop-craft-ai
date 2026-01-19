-- Table pour stocker les taux de change
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  inverse_rate DECIMAL(18, 8) NOT NULL,
  source VARCHAR(50) DEFAULT 'exchangeratesapi',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- Table pour les préférences de devises utilisateur
CREATE TABLE IF NOT EXISTS public.currency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  display_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  supplier_currency VARCHAR(3) DEFAULT 'USD',
  auto_convert_prices BOOLEAN DEFAULT true,
  show_original_prices BOOLEAN DEFAULT true,
  round_prices BOOLEAN DEFAULT true,
  rounding_method VARCHAR(20) DEFAULT 'nearest', -- nearest, up, down
  decimal_places INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table pour l'historique des taux de change
CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 8) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les conversions de prix produits
CREATE TABLE IF NOT EXISTS public.product_price_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  original_price DECIMAL(12, 2) NOT NULL,
  original_currency VARCHAR(3) NOT NULL,
  converted_price DECIMAL(12, 2) NOT NULL,
  converted_currency VARCHAR(3) NOT NULL,
  exchange_rate_used DECIMAL(18, 8) NOT NULL,
  conversion_type VARCHAR(20) DEFAULT 'supplier_to_selling', -- supplier_to_selling, display
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON public.exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_expires ON public.exchange_rates(expires_at);
CREATE INDEX IF NOT EXISTS idx_currency_settings_user ON public.currency_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currencies ON public.exchange_rate_history(base_currency, target_currency, recorded_at);
CREATE INDEX IF NOT EXISTS idx_product_price_conversions_product ON public.product_price_conversions(product_id);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour exchange_rates (lecture publique, écriture admin)
CREATE POLICY "Anyone can read exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage exchange rates"
  ON public.exchange_rates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies pour currency_settings
CREATE POLICY "Users can view own currency settings"
  ON public.currency_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own currency settings"
  ON public.currency_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies pour exchange_rate_history
CREATE POLICY "Anyone can read exchange rate history"
  ON public.exchange_rate_history FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert exchange rate history"
  ON public.exchange_rate_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies pour product_price_conversions
CREATE POLICY "Users can view own price conversions"
  ON public.product_price_conversions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own price conversions"
  ON public.product_price_conversions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_currency_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_currency_settings_timestamp
  BEFORE UPDATE ON public.currency_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_currency_settings_updated_at();

-- Fonction pour obtenir le taux de change actuel
CREATE OR REPLACE FUNCTION get_exchange_rate(p_base VARCHAR(3), p_target VARCHAR(3))
RETURNS DECIMAL(18, 8) AS $$
DECLARE
  v_rate DECIMAL(18, 8);
BEGIN
  IF p_base = p_target THEN
    RETURN 1.0;
  END IF;
  
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE base_currency = p_base 
    AND target_currency = p_target
    AND expires_at > now()
  ORDER BY fetched_at DESC
  LIMIT 1;
  
  IF v_rate IS NULL THEN
    -- Essayer l'inverse
    SELECT inverse_rate INTO v_rate
    FROM public.exchange_rates
    WHERE base_currency = p_target 
      AND target_currency = p_base
      AND expires_at > now()
    ORDER BY fetched_at DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fonction pour convertir un prix
CREATE OR REPLACE FUNCTION convert_price(
  p_amount DECIMAL(12, 2),
  p_from_currency VARCHAR(3),
  p_to_currency VARCHAR(3)
)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  v_rate DECIMAL(18, 8);
BEGIN
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  v_rate := get_exchange_rate(p_from_currency, p_to_currency);
  RETURN ROUND(p_amount * v_rate, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insérer les devises supportées par défaut
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, inverse_rate, expires_at)
VALUES 
  ('EUR', 'USD', 1.0850, 0.9217, now() + interval '1 hour'),
  ('EUR', 'GBP', 0.8420, 1.1876, now() + interval '1 hour'),
  ('EUR', 'CNY', 7.8500, 0.1274, now() + interval '1 hour'),
  ('EUR', 'JPY', 162.50, 0.0062, now() + interval '1 hour'),
  ('EUR', 'CAD', 1.4750, 0.6780, now() + interval '1 hour'),
  ('EUR', 'AUD', 1.6580, 0.6031, now() + interval '1 hour'),
  ('EUR', 'CHF', 0.9380, 1.0661, now() + interval '1 hour'),
  ('USD', 'CNY', 7.2350, 0.1382, now() + interval '1 hour'),
  ('USD', 'GBP', 0.7760, 1.2887, now() + interval '1 hour')
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate,
    inverse_rate = EXCLUDED.inverse_rate,
    fetched_at = now(),
    expires_at = now() + interval '1 hour';