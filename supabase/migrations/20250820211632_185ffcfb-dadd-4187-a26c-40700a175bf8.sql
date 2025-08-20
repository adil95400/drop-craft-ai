-- CRM & Marketing Tables
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'customer', 'prospect')),
  lead_score INTEGER DEFAULT 0,
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'marketing_qualified_lead', 'sales_qualified_lead', 'opportunity', 'customer', 'evangelist')),
  source TEXT,
  attribution JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'social', 'ads', 'retargeting')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  budget_total DECIMAL(10,2),
  budget_spent DECIMAL(10,2) DEFAULT 0,
  target_audience JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  contact_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation & AI Tables
CREATE TABLE IF NOT EXISTS automation_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'event', 'webhook', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  step_results JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('content_generation', 'seo_optimization', 'product_analysis', 'market_research', 'competitor_analysis')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  error_message TEXT,
  processing_time_ms INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO & Reviews Tables
CREATE TABLE IF NOT EXISTS seo_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT,
  title TEXT,
  meta_description TEXT,
  h1_tag TEXT,
  meta_keywords TEXT[],
  performance_score INTEGER,
  seo_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  content_analysis JSONB DEFAULT '{}',
  technical_analysis JSONB DEFAULT '{}',
  competitors_data JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty_score INTEGER,
  cpc DECIMAL(10,2),
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  trends JSONB DEFAULT '[]',
  related_keywords TEXT[],
  current_position INTEGER,
  target_url TEXT,
  tracking_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('title', 'meta_description', 'article', 'product_description', 'email', 'ad_copy')),
  target_keyword TEXT,
  generated_title TEXT,
  generated_meta_description TEXT,
  generated_content TEXT,
  optimization_score INTEGER,
  language TEXT DEFAULT 'fr',
  ai_model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own CRM contacts" ON crm_contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing campaigns" ON marketing_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own marketing segments" ON marketing_segments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own automation workflows" ON automation_workflows
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own automation executions" ON automation_executions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI tasks" ON ai_tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own SEO analyses" ON seo_analyses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own SEO keywords" ON seo_keywords
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own generated content" ON generated_content
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX idx_marketing_campaigns_user_id ON marketing_campaigns(user_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_automation_workflows_user_id ON automation_workflows(user_id);
CREATE INDEX idx_automation_workflows_status ON automation_workflows(status);
CREATE INDEX idx_seo_analyses_user_id ON seo_analyses(user_id);
CREATE INDEX idx_seo_keywords_user_id ON seo_keywords(user_id);
CREATE INDEX idx_seo_keywords_keyword ON seo_keywords(keyword);

-- Triggers for updated_at
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_segments_updated_at
  BEFORE UPDATE ON marketing_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON automation_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON ai_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_analyses_updated_at
  BEFORE UPDATE ON seo_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_keywords_updated_at
  BEFORE UPDATE ON seo_keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();