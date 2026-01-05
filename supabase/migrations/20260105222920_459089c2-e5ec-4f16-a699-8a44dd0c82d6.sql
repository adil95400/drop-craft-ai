
-- Workflow Builder tables
CREATE TABLE public.workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- general, order, stock, marketing, sync
  trigger_type TEXT NOT NULL, -- event, schedule, manual, webhook
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running', -- running, completed, failed, cancelled
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  step_results JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

CREATE TABLE public.workflow_step_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  step_type TEXT NOT NULL, -- action, condition, delay, loop, webhook
  icon TEXT,
  category TEXT DEFAULT 'general',
  config_schema JSONB DEFAULT '{}'::jsonb,
  is_global BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Segmentation tables
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT DEFAULT 'dynamic', -- dynamic, static, ai_generated
  rules JSONB DEFAULT '[]'::jsonb,
  customer_count INTEGER DEFAULT 0,
  avg_order_value NUMERIC(10,2),
  total_revenue NUMERIC(12,2),
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  auto_update BOOLEAN DEFAULT true,
  update_frequency TEXT DEFAULT 'daily', -- hourly, daily, weekly
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_segment_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score NUMERIC(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(segment_id, customer_id)
);

CREATE TABLE public.customer_rfm_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  recency_score INTEGER CHECK (recency_score >= 1 AND recency_score <= 5),
  frequency_score INTEGER CHECK (frequency_score >= 1 AND frequency_score <= 5),
  monetary_score INTEGER CHECK (monetary_score >= 1 AND monetary_score <= 5),
  rfm_segment TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2),
  days_since_last_order INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_rfm_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their workflows" ON public.workflow_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their executions" ON public.workflow_executions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Everyone can view step definitions" ON public.workflow_step_definitions FOR SELECT USING (is_global = true);
CREATE POLICY "Users can manage their segments" ON public.customer_segments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage segment members" ON public.customer_segment_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage RFM scores" ON public.customer_rfm_scores FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_workflows_user ON public.workflow_templates(user_id);
CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX idx_segments_user ON public.customer_segments(user_id);
CREATE INDEX idx_segment_members_segment ON public.customer_segment_members(segment_id);
CREATE INDEX idx_rfm_customer ON public.customer_rfm_scores(customer_id);

-- Insert default step definitions
INSERT INTO public.workflow_step_definitions (name, description, step_type, icon, category) VALUES
('Envoyer email', 'Envoie un email au destinataire', 'action', 'mail', 'communication'),
('Attendre', 'Pause le workflow pendant une durée', 'delay', 'clock', 'flow'),
('Condition', 'Branche conditionnelle', 'condition', 'git-branch', 'flow'),
('Webhook', 'Appelle une URL externe', 'webhook', 'globe', 'integration'),
('Mettre à jour produit', 'Modifie un produit', 'action', 'package', 'products'),
('Créer notification', 'Crée une notification utilisateur', 'action', 'bell', 'communication'),
('Mettre à jour stock', 'Modifie le niveau de stock', 'action', 'warehouse', 'stock');
