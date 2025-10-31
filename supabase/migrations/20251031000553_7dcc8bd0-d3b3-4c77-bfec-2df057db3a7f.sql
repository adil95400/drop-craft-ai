-- Table pour les configurations de dropshipping rapide
CREATE TABLE IF NOT EXISTS public.dropshipping_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuration du template
  template_id TEXT,
  supplier_platform TEXT NOT NULL,
  
  -- Règles d'automatisation
  auto_import BOOLEAN DEFAULT false,
  auto_fulfill BOOLEAN DEFAULT false,
  price_optimization BOOLEAN DEFAULT true,
  target_margin DECIMAL DEFAULT 30,
  sync_frequency TEXT DEFAULT '1hour' CHECK (sync_frequency IN ('15min', '1hour', '6hours', 'daily')),
  
  -- Filtres et paramètres
  filter_settings JSONB DEFAULT '{}'::jsonb,
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dropshipping_configs_user ON public.dropshipping_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_dropshipping_configs_status ON public.dropshipping_configs(status);

-- RLS Policies
ALTER TABLE public.dropshipping_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dropshipping config"
ON public.dropshipping_configs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dropshipping config"
ON public.dropshipping_configs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dropshipping config"
ON public.dropshipping_configs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_dropshipping_configs_updated_at
  BEFORE UPDATE ON public.dropshipping_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();