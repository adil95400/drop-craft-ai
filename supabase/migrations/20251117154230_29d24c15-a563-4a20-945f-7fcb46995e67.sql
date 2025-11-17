-- Phase 5: Système d'Alertes et Notifications Avancé

-- Table pour les règles d'alertes personnalisées avancées
CREATE TABLE IF NOT EXISTS public.advanced_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- Conditions de déclenchement
  alert_trigger_type TEXT NOT NULL CHECK (alert_trigger_type IN (
    'stock_level', 'sales_threshold', 'order_status', 
    'customer_behavior', 'marketplace_event', 'profit_margin',
    'competitor_price', 'inventory_sync', 'supplier_issue'
  )),
  trigger_conditions JSONB NOT NULL,
  
  -- Canaux de notification
  notification_channels TEXT[] DEFAULT ARRAY['in_app'],
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  webhook_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  
  -- Configuration de l'alerte
  alert_template JSONB,
  throttle_minutes INTEGER DEFAULT 60,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  -- Filtres et groupement
  applies_to_stores UUID[],
  applies_to_products UUID[],
  applies_to_categories TEXT[],
  group_alerts BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour l'historique des notifications
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_rule_id UUID REFERENCES public.advanced_alert_rules(id) ON DELETE SET NULL,
  
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'webhook', 'push')),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  
  -- État de livraison
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  -- Interactions utilisateur
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les préférences de notification
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canaux activés par défaut
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  
  -- Configuration email
  email_address TEXT,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  email_digest BOOLEAN DEFAULT false,
  
  -- Configuration SMS
  phone_number TEXT,
  sms_for_critical_only BOOLEAN DEFAULT true,
  
  -- Configuration push
  push_tokens JSONB,
  
  -- Préférences par catégorie
  stock_alerts_pref BOOLEAN DEFAULT true,
  order_alerts_pref BOOLEAN DEFAULT true,
  customer_alerts_pref BOOLEAN DEFAULT true,
  financial_alerts_pref BOOLEAN DEFAULT true,
  system_alerts_pref BOOLEAN DEFAULT true,
  
  -- Heures de silence (Do Not Disturb)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les templates de notifications
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  
  -- Contenu du template
  subject_template TEXT,
  body_template TEXT,
  variables JSONB,
  
  -- Support multi-langues
  locale TEXT DEFAULT 'fr',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les alertes groupées
CREATE TABLE IF NOT EXISTS public.grouped_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_key TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  
  alert_count INTEGER DEFAULT 1,
  first_alert_at TIMESTAMPTZ DEFAULT now(),
  last_alert_at TIMESTAMPTZ DEFAULT now(),
  
  summary_data JSONB,
  affected_items JSONB,
  
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les webhooks de notification
CREATE TABLE IF NOT EXISTS public.notification_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  
  event_types TEXT[] NOT NULL,
  
  is_active BOOLEAN DEFAULT true,
  
  -- Configuration de sécurité
  secret_token TEXT,
  custom_headers JSONB,
  
  -- Statistiques
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advanced_alert_rules_user ON public.advanced_alert_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON public.notification_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON public.notification_history(status, channel);
CREATE INDEX IF NOT EXISTS idx_grouped_alerts_user ON public.grouped_alerts(user_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_notification_webhooks_active ON public.notification_webhooks(user_id, is_active);

-- Triggers utilisant la fonction existante handle_updated_at
CREATE TRIGGER update_advanced_alert_rules_updated_at
  BEFORE UPDATE ON public.advanced_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_grouped_alerts_updated_at
  BEFORE UPDATE ON public.grouped_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_webhooks_updated_at
  BEFORE UPDATE ON public.notification_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.advanced_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grouped_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;

-- Policies pour advanced_alert_rules
CREATE POLICY "Users can view own advanced alert rules"
  ON public.advanced_alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own advanced alert rules"
  ON public.advanced_alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advanced alert rules"
  ON public.advanced_alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own advanced alert rules"
  ON public.advanced_alert_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour notification_history
CREATE POLICY "Users can view own notification history"
  ON public.notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notification_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notification_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour notification_preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour notification_templates
CREATE POLICY "Users can view notification templates"
  ON public.notification_templates FOR SELECT
  USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY "Users can create own notification templates"
  ON public.notification_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own notification templates"
  ON public.notification_templates FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own notification templates"
  ON public.notification_templates FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Policies pour grouped_alerts
CREATE POLICY "Users can view own grouped alerts"
  ON public.grouped_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own grouped alerts"
  ON public.grouped_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Policies pour notification_webhooks
CREATE POLICY "Users can manage own webhooks"
  ON public.notification_webhooks FOR ALL
  USING (auth.uid() = user_id);