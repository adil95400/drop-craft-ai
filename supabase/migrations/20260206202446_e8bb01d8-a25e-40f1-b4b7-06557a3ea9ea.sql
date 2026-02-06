
-- ============================================
-- CRM Tables - Phase 1 Stabilisation
-- ============================================

-- CRM Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  estimated_value NUMERIC DEFAULT 0,
  expected_close_date DATE,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  converted_to_customer_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leads" ON public.crm_leads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CRM Deals
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_id UUID,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'prospecting',
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  actual_close_date DATE,
  source TEXT,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deals" ON public.crm_deals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CRM Activities
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL DEFAULT 'note',
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own activities" ON public.crm_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CRM Tasks
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contact_id UUID,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.crm_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CRM Calls
CREATE TABLE IF NOT EXISTS public.crm_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  type TEXT NOT NULL DEFAULT 'outgoing',
  status TEXT NOT NULL DEFAULT 'completed',
  duration INTEGER DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  follow_up TEXT,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calls" ON public.crm_calls FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CRM Calendar Events
CREATE TABLE IF NOT EXISTS public.crm_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'meeting',
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  platform TEXT,
  notes TEXT,
  color TEXT,
  attendees TEXT[],
  duration_minutes INTEGER,
  location TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calendar events" ON public.crm_calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEO Tracked Keywords
CREATE TABLE IF NOT EXISTS public.seo_tracked_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  url TEXT,
  current_position INTEGER,
  previous_position INTEGER,
  change INTEGER,
  volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  competition TEXT DEFAULT 'Medium',
  trend TEXT DEFAULT 'stable',
  last_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_tracked_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own keywords" ON public.seo_tracked_keywords FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
