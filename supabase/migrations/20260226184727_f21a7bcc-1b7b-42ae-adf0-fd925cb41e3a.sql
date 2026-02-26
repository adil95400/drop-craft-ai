
-- Table for persisting visual workflows
CREATE TABLE public.saved_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_type TEXT,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows" ON public.saved_workflows
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflows" ON public.saved_workflows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows" ON public.saved_workflows
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows" ON public.saved_workflows
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_workflows_updated_at
  BEFORE UPDATE ON public.saved_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_saved_workflows_user_id ON public.saved_workflows(user_id);
CREATE INDEX idx_saved_workflows_status ON public.saved_workflows(status);
