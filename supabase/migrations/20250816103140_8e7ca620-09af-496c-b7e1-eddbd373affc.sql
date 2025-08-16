-- Création du système de plans et quotas
-- Mise à jour du type de plan
ALTER TYPE public.plan_type RENAME TO plan_type_old;
CREATE TYPE public.plan_type AS ENUM ('standard', 'pro', 'ultra_pro');
ALTER TABLE public.profiles ALTER COLUMN plan TYPE plan_type USING plan::text::plan_type;
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'standard';
DROP TYPE public.plan_type_old;

-- Table des limites par plan
CREATE TABLE public.plans_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan plan_type NOT NULL,
  limit_key TEXT NOT NULL,
  limit_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan, limit_key)
);

-- Enable RLS
ALTER TABLE public.plans_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans_limits
CREATE POLICY "Plans limits are readable by authenticated users"
ON public.plans_limits FOR SELECT
TO authenticated
USING (true);

-- Table des usages/quotas utilisateur
CREATE TABLE public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quota_key TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  reset_date TIMESTAMPTZ DEFAULT (date_trunc('day', now()) + interval '1 day'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quota_key)
);

-- Enable RLS
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_quotas
CREATE POLICY "Users can view their own quotas"
ON public.user_quotas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotas"
ON public.user_quotas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotas"
ON public.user_quotas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fonction pour vérifier les quotas
CREATE OR REPLACE FUNCTION public.check_quota(user_id_param UUID, quota_key_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER := 0;
  limit_value INTEGER := 0;
  user_plan plan_type;
BEGIN
  -- Récupérer le plan utilisateur
  SELECT plan INTO user_plan FROM public.profiles WHERE id = user_id_param;
  
  -- Récupérer la limite pour ce plan
  SELECT pl.limit_value INTO limit_value 
  FROM public.plans_limits pl 
  WHERE pl.plan = user_plan AND pl.limit_key = quota_key_param;
  
  -- Si pas de limite définie, autoriser
  IF limit_value IS NULL OR limit_value = -1 THEN
    RETURN true;
  END IF;
  
  -- Récupérer l'usage actuel
  SELECT COALESCE(uq.current_count, 0) INTO current_usage
  FROM public.user_quotas uq
  WHERE uq.user_id = user_id_param AND uq.quota_key = quota_key_param
    AND uq.reset_date > now();
  
  RETURN current_usage < limit_value;
END;
$$;

-- Fonction pour incrémenter les quotas
CREATE OR REPLACE FUNCTION public.increment_quota(user_id_param UUID, quota_key_param TEXT, increment_by INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, quota_key, current_count, reset_date)
  VALUES (user_id_param, quota_key_param, increment_by, date_trunc('day', now()) + interval '1 day')
  ON CONFLICT (user_id, quota_key)
  DO UPDATE SET
    current_count = CASE 
      WHEN user_quotas.reset_date <= now() THEN increment_by
      ELSE user_quotas.current_count + increment_by
    END,
    reset_date = CASE
      WHEN user_quotas.reset_date <= now() THEN date_trunc('day', now()) + interval '1 day'
      ELSE user_quotas.reset_date
    END,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Insérer les limites par défaut
INSERT INTO public.plans_limits (plan, limit_key, limit_value) VALUES
-- Import quotas
('standard', 'import_feeds_per_day', 10),
('pro', 'import_feeds_per_day', 100),
('ultra_pro', 'import_feeds_per_day', -1), -- illimité

('standard', 'import_ftp_per_day', 5),
('pro', 'import_ftp_per_day', 50),
('ultra_pro', 'import_ftp_per_day', -1),

-- Features/connectors disponibles (1 = disponible, 0 = non disponible)
('standard', 'connector_feeds', 1),
('standard', 'connector_ftp_manual', 1),
('standard', 'connector_ecommerce', 0),
('standard', 'connector_oauth', 0),
('standard', 'connector_ftp_scheduled', 0),
('standard', 'connector_ftp_advanced', 0),

('pro', 'connector_feeds', 1),
('pro', 'connector_ftp_manual', 1),
('pro', 'connector_ecommerce', 1),
('pro', 'connector_oauth', 0),
('pro', 'connector_ftp_scheduled', 1),
('pro', 'connector_ftp_advanced', 0),

('ultra_pro', 'connector_feeds', 1),
('ultra_pro', 'connector_ftp_manual', 1),
('ultra_pro', 'connector_ecommerce', 1),
('ultra_pro', 'connector_oauth', 1),
('ultra_pro', 'connector_ftp_scheduled', 1),
('ultra_pro', 'connector_ftp_advanced', 1);

-- Table des connecteurs d'import
CREATE TABLE public.import_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'shopify', 'woocommerce', 'csv', 'ftp', etc.
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}', -- Encrypted
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_connectors ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_connectors
CREATE POLICY "Users can manage their own import connectors"
ON public.import_connectors FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Trigger pour update_updated_at
CREATE TRIGGER update_plans_limits_updated_at
  BEFORE UPDATE ON public.plans_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_connectors_updated_at
  BEFORE UPDATE ON public.import_connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();