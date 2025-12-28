-- Email/SMS Marketing Automation Complete System

-- 1. Email Templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  category TEXT DEFAULT 'general',
  variables JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Email Campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  html_content TEXT,
  text_content TEXT,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'sms')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  segment_id UUID,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Campaign Recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Campaign Stats (for aggregate metrics)
CREATE TABLE IF NOT EXISTS public.campaign_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  total_complaints INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  unsubscribe_rate NUMERIC(5,2) DEFAULT 0,
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Automation Flows
CREATE TABLE IF NOT EXISTS public.automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('cart_abandonment', 'post_purchase', 'welcome', 'birthday', 'inactive', 'custom', 'product_view', 'order_status')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  stats JSONB DEFAULT '{"entered": 0, "completed": 0, "converted": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Automation Flow Executions
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.automation_flows(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_data JSONB DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'failed')),
  entered_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_action_at TIMESTAMPTZ,
  actions_log JSONB DEFAULT '[]'::jsonb
);

-- 7. A/B Tests for Campaigns
CREATE TABLE IF NOT EXISTS public.campaign_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.email_campaigns(id),
  name TEXT NOT NULL,
  test_type TEXT DEFAULT 'subject' CHECK (test_type IN ('subject', 'content', 'send_time', 'sender_name')),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  traffic_split JSONB DEFAULT '{"a": 50, "b": 50}'::jsonb,
  winner_criteria TEXT DEFAULT 'open_rate' CHECK (winner_criteria IN ('open_rate', 'click_rate', 'conversion_rate')),
  auto_select_winner BOOLEAN DEFAULT false,
  winner_after_hours INTEGER DEFAULT 24,
  winner_variant TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  results JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Unsubscribes
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  campaign_id UUID REFERENCES public.email_campaigns(id),
  unsubscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email)
);

-- 9. Email Sending Logs
CREATE TABLE IF NOT EXISTS public.email_sending_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.email_campaigns(id),
  recipient_email TEXT NOT NULL,
  message_id TEXT,
  provider TEXT DEFAULT 'resend',
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Deliverability Stats
CREATE TABLE IF NOT EXISTS public.deliverability_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  domain TEXT,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  reputation_score NUMERIC(5,2) DEFAULT 100,
  UNIQUE(user_id, date, domain)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sending_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverability_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their email templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their email campaigns" ON public.email_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view campaign recipients" ON public.campaign_recipients FOR ALL USING (campaign_id IN (SELECT id FROM public.email_campaigns WHERE user_id = auth.uid()));
CREATE POLICY "Users can view campaign stats" ON public.campaign_stats FOR ALL USING (campaign_id IN (SELECT id FROM public.email_campaigns WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their automation flows" ON public.automation_flows FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view automation executions" ON public.automation_executions FOR ALL USING (flow_id IN (SELECT id FROM public.automation_flows WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage their AB tests" ON public.campaign_ab_tests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their unsubscribes" ON public.email_unsubscribes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their sending logs" ON public.email_sending_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their deliverability stats" ON public.deliverability_stats FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_user ON public.email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user ON public.email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON public.campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_automation_flows_user ON public.automation_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_flow ON public.automation_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON public.email_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_email_sending_logs_campaign ON public.email_sending_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliverability_stats_date ON public.deliverability_stats(user_id, date);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_automation_flows_updated_at BEFORE UPDATE ON public.automation_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_campaign_ab_tests_updated_at BEFORE UPDATE ON public.campaign_ab_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();