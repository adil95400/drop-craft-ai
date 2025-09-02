-- Étendre la table suppliers pour supporter les nouveaux fournisseurs Wise2Sync
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplier_type text DEFAULT 'api';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS connector_type text DEFAULT 'generic';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS setup_complexity text DEFAULT 'medium';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS integration_features jsonb DEFAULT '{"products": true, "inventory": false, "orders": false, "webhooks": false}'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS rate_limits jsonb DEFAULT '{"requestsPerMinute": 60, "requestsPerHour": 1000}'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supported_regions text[] DEFAULT '{"EU"}';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS setup_fee numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS minimum_order_value numeric DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS delivery_time_days integer DEFAULT 3;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS product_count integer DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS sync_frequency text DEFAULT 'daily';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS last_sync_status text DEFAULT 'never';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS success_rate numeric DEFAULT 100.0;

-- Créer une table pour les connecteurs de fournisseurs
CREATE TABLE IF NOT EXISTS public.supplier_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  connector_id text NOT NULL,
  connector_type text NOT NULL DEFAULT 'api',
  status text NOT NULL DEFAULT 'disconnected',
  credentials jsonb DEFAULT '{}'::jsonb,
  configuration jsonb DEFAULT '{}'::jsonb,
  last_sync_at timestamp with time zone,
  next_sync_at timestamp with time zone,
  sync_frequency text DEFAULT 'daily',
  error_message text,
  error_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, supplier_id)
);

-- Activer RLS sur supplier_connectors
ALTER TABLE public.supplier_connectors ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour supplier_connectors
CREATE POLICY "Users can manage their own supplier connectors"
ON public.supplier_connectors
FOR ALL
USING (auth.uid() = user_id);

-- Créer une table pour les jobs de synchronisation
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  connector_id text NOT NULL,
  job_type text NOT NULL DEFAULT 'products',
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 5,
  scheduled_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  progress integer DEFAULT 0,
  total_items integer DEFAULT 0,
  processed_items integer DEFAULT 0,
  success_items integer DEFAULT 0,
  error_items integer DEFAULT 0,
  errors text[],
  result_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Activer RLS sur sync_jobs
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour sync_jobs
CREATE POLICY "Users can manage their own sync jobs"
ON public.sync_jobs
FOR ALL
USING (auth.uid() = user_id);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_supplier_connectors_user_status ON public.supplier_connectors(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_status ON public.sync_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_scheduled ON public.sync_jobs(scheduled_at) WHERE status = 'pending';

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER handle_supplier_connectors_updated_at
  BEFORE UPDATE ON public.supplier_connectors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();