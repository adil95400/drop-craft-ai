
-- =====================================================
-- SYSTÈME DE SUIVI DE CONSOMMATION EN TEMPS RÉEL
-- =====================================================

-- 1. Table des logs de consommation détaillés
CREATE TABLE IF NOT EXISTS public.consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_key TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_detail JSONB DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    cost_estimate DECIMAL(10,6) DEFAULT 0,
    source TEXT DEFAULT 'web',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumption_logs_user_date ON consumption_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_quota_key ON consumption_logs(quota_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_source ON consumption_logs(source, created_at DESC);

-- 2. Table des alertes de consommation (sans colonne générée)
CREATE TABLE IF NOT EXISTS public.consumption_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_key TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    threshold_percent INTEGER NOT NULL,
    current_usage INTEGER NOT NULL,
    limit_value INTEGER NOT NULL,
    message TEXT,
    channels_sent TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- Unique constraint for one alert per day per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_consumption_alerts_unique_daily 
ON consumption_alerts(user_id, quota_key, alert_type, alert_date);

CREATE INDEX IF NOT EXISTS idx_consumption_alerts_user ON consumption_alerts(user_id, is_read, created_at DESC);

-- 3. Table de configuration des alertes par utilisateur
CREATE TABLE IF NOT EXISTS public.alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_key TEXT NOT NULL,
    alert_at_10_percent BOOLEAN DEFAULT true,
    alert_at_5_percent BOOLEAN DEFAULT true,
    email_alerts BOOLEAN DEFAULT true,
    in_app_alerts BOOLEAN DEFAULT true,
    webhook_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, quota_key)
);

-- 4. Table des add-ons achetés
CREATE TABLE IF NOT EXISTS public.quota_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_key TEXT NOT NULL,
    additional_credits INTEGER NOT NULL DEFAULT 0,
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    stripe_payment_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quota_addons_user ON quota_addons(user_id, is_active);

-- 5. Enable RLS
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_addons ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can view their own consumption logs"
ON consumption_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert consumption logs"
ON consumption_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own alerts"
ON consumption_alerts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON consumption_alerts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their alert preferences"
ON alert_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own addons"
ON quota_addons FOR SELECT USING (auth.uid() = user_id);

-- 7. Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE consumption_alerts;
