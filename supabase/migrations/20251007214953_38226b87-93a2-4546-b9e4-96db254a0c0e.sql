-- Phase 3: Tables et politiques RLS pour Marketplace Hub, Multi-Tenant et Observability

-- ============================================================================
-- MARKETPLACE HUB TABLES
-- ============================================================================

-- Table pour les connexions marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les logs de synchronisation marketplace
CREATE TABLE IF NOT EXISTS public.marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.marketplace_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- MULTI-TENANT TABLES
-- ============================================================================

-- Table pour les tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  plan_type TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les utilisateurs de tenants (SANS récursion)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- ============================================================================
-- OBSERVABILITY TABLES
-- ============================================================================

-- Table pour les métriques de monitoring
CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  tags JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les logs système
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - MARKETPLACE
-- ============================================================================

-- Nettoyer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users manage own marketplace connections" ON public.marketplace_connections;
DROP POLICY IF EXISTS "Users view own sync logs" ON public.marketplace_sync_logs;

-- Marketplace connections
CREATE POLICY "Users manage own marketplace connections"
ON public.marketplace_connections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Marketplace sync logs
CREATE POLICY "Users view own sync logs"
ON public.marketplace_sync_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - MULTI-TENANT (SANS RÉCURSION)
-- ============================================================================

-- Nettoyer les anciennes politiques
DROP POLICY IF EXISTS "Tenant owners manage tenants" ON public.tenants;
DROP POLICY IF EXISTS "Tenant members view tenant" ON public.tenants;
DROP POLICY IF EXISTS "Tenant admins manage users" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant members view users" ON public.tenant_users;

-- Tenants - Les propriétaires peuvent tout faire
CREATE POLICY "Tenant owners manage tenants"
ON public.tenants
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Tenants - Les membres peuvent voir leur tenant
CREATE POLICY "Tenant members view tenant"
ON public.tenants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenants.id
    AND tu.user_id = auth.uid()
  )
);

-- Tenant users - Accès simple sans récursion
CREATE POLICY "Tenant admins manage users"
ON public.tenant_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = tenant_users.tenant_id
    AND t.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = tenant_users.tenant_id
    AND t.owner_id = auth.uid()
  )
);

-- Tenant users - Les membres peuvent voir les utilisateurs de leur tenant
CREATE POLICY "Tenant members view users"
ON public.tenant_users
FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - OBSERVABILITY
-- ============================================================================

-- Nettoyer les anciennes politiques
DROP POLICY IF EXISTS "Users manage own metrics" ON public.monitoring_metrics;
DROP POLICY IF EXISTS "Users manage own logs" ON public.system_logs;

-- Alert rules - déjà créée mais on vérifie
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alert_rules' 
    AND policyname = 'Users manage own alert rules'
  ) THEN
    CREATE POLICY "Users manage own alert rules"
    ON public.alert_rules
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Active alerts - déjà créée mais on vérifie
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'active_alerts' 
    AND policyname = 'Users manage own active alerts'
  ) THEN
    CREATE POLICY "Users manage own active alerts"
    ON public.active_alerts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Monitoring metrics
CREATE POLICY "Users manage own metrics"
ON public.monitoring_metrics
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System logs
CREATE POLICY "Users manage own logs"
ON public.system_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES pour performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id ON public.marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_connection_id ON public.marketplace_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_user_id ON public.marketplace_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_user_id ON public.monitoring_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- ============================================================================
-- TRIGGERS pour updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_marketplace_connections_updated_at ON public.marketplace_connections;
CREATE TRIGGER update_marketplace_connections_updated_at
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();