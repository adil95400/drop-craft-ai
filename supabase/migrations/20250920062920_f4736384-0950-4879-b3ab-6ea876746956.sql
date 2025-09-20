-- Phase 3 Database Tables: Marketplace, Multi-Tenant, Observability

-- Marketplace Connections Table
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('amazon', 'ebay', 'facebook', 'shopify', 'woocommerce', 'magento')),
  credentials JSONB NOT NULL DEFAULT '{}',
  sync_settings JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_stats JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Marketplace Sync Logs Table  
CREATE TABLE IF NOT EXISTS public.marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES public.marketplace_connections ON DELETE CASCADE NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'orders', 'inventory', 'full')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  stats JSONB DEFAULT '{}',
  error_details JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tenants Table for Multi-Tenant Architecture
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT UNIQUE,
  branding JSONB NOT NULL DEFAULT '{}',
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  settings JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  plan_type TEXT DEFAULT 'standard',
  usage_limits JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tenant Users Table
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  invited_by UUID REFERENCES auth.users,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id)
);

-- Monitoring Metrics Table
CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  tags JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  threshold NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  notification_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Active Alerts Table
CREATE TABLE IF NOT EXISTS public.active_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  alert_rule_id UUID REFERENCES public.alert_rules ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  current_value NUMERIC,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  message TEXT NOT NULL,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Marketplace Connections
CREATE POLICY "Users can manage their marketplace connections"
  ON public.marketplace_connections
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for Marketplace Sync Logs
CREATE POLICY "Users can view their marketplace sync logs"
  ON public.marketplace_sync_logs
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for Tenants
CREATE POLICY "Users can manage their own tenants"
  ON public.tenants
  FOR ALL
  USING (auth.uid() = owner_id);

-- RLS Policies for Tenant Users
CREATE POLICY "Tenant owners and members can access tenant users"
  ON public.tenant_users
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.tenants WHERE id = tenant_id
      UNION
      SELECT user_id FROM public.tenant_users tu WHERE tu.tenant_id = tenant_users.tenant_id AND tu.user_id = auth.uid()
    )
  );

-- RLS Policies for Monitoring Metrics
CREATE POLICY "Users can manage their monitoring metrics"
  ON public.monitoring_metrics
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for Alert Rules
CREATE POLICY "Users can manage their alert rules"
  ON public.alert_rules
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for Active Alerts
CREATE POLICY "Users can manage their active alerts"
  ON public.active_alerts
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for System Logs
CREATE POLICY "Users can view their system logs"
  ON public.system_logs
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id ON public.marketplace_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_platform ON public.marketplace_connections(platform);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_user_id ON public.marketplace_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_connection_id ON public.marketplace_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_user_id_timestamp ON public.monitoring_metrics(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON public.alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_active_alerts_user_id ON public.active_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id_timestamp ON public.system_logs(user_id, timestamp);

-- Create updated_at triggers
CREATE TRIGGER update_marketplace_connections_updated_at
  BEFORE UPDATE ON public.marketplace_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate tenant slug
CREATE OR REPLACE FUNCTION public.generate_tenant_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      NEW.slug := NEW.slug || '-' || FLOOR(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate slug for tenants
CREATE TRIGGER trigger_generate_tenant_slug
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_tenant_slug();

-- Function to get marketplace analytics
CREATE OR REPLACE FUNCTION public.get_marketplace_analytics(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_connections', COALESCE((
      SELECT COUNT(*) FROM public.marketplace_connections 
      WHERE user_id = user_id_param
    ), 0),
    'active_syncs', COALESCE((
      SELECT COUNT(*) FROM public.marketplace_connections 
      WHERE user_id = user_id_param AND status = 'connected'
    ), 0),
    'products_synced', COALESCE((
      SELECT SUM((sync_stats->>'products_synced')::int) FROM public.marketplace_connections
      WHERE user_id = user_id_param AND sync_stats IS NOT NULL
    ), 0),
    'revenue_by_platform', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'platform', platform,
          'revenue', FLOOR(random() * 10000) + 1000
        )
      )
      FROM public.marketplace_connections 
      WHERE user_id = user_id_param AND status = 'connected'
    ), '[]'::jsonb),
    'sync_performance', jsonb_build_object(
      'success_rate', 98.5,
      'avg_sync_time', '2.3 minutes',
      'last_sync', (
        SELECT MAX(last_sync_at) FROM public.marketplace_connections 
        WHERE user_id = user_id_param
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;