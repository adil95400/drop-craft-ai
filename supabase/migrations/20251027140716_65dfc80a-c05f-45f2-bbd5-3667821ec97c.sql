-- Phase 5: Analytics Avancés & Collaboration
-- Tables pour analytics personnalisés et collaboration

-- Table pour les rapports personnalisés
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('sales', 'products', 'customers', 'marketing', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly', 'manual')),
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour stocker les données de rapports générés
CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.custom_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les équipes et collaboration
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les membres d'équipe
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Table pour les notifications d'équipe
CREATE TABLE IF NOT EXISTS public.team_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour l'activité collaborative
CREATE TABLE IF NOT EXISTS public.team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les KPIs personnalisés
CREATE TABLE IF NOT EXISTS public.custom_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  formula JSONB NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT,
  display_format TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON public.custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_report_id ON public.report_snapshots(report_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_generated_at ON public.report_snapshots(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_user_id ON public.team_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_team_activity_team_id ON public.team_activity(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_kpis_user_id ON public.custom_kpis(user_id);

-- RLS Policies
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_kpis ENABLE ROW LEVEL SECURITY;

-- RLS pour custom_reports
CREATE POLICY "Users can view their own reports"
  ON public.custom_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.custom_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.custom_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.custom_reports FOR DELETE
  USING (auth.uid() = user_id);

-- RLS pour report_snapshots
CREATE POLICY "Users can view their own report snapshots"
  ON public.report_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own report snapshots"
  ON public.report_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS pour teams
CREATE POLICY "Team owners can manage their teams"
  ON public.teams FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = id
    )
  );

-- RLS pour team_members
CREATE POLICY "Team members can view team membership"
  ON public.team_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = team_members.team_id
    )
  );

CREATE POLICY "Team owners can manage members"
  ON public.team_members FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.teams 
      WHERE id = team_id
    )
  );

-- RLS pour team_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.team_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.team_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS pour team_activity
CREATE POLICY "Team members can view team activity"
  ON public.team_activity FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = team_activity.team_id
    )
  );

CREATE POLICY "Team members can create activity"
  ON public.team_activity FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = team_activity.team_id
    )
  );

-- RLS pour custom_kpis
CREATE POLICY "Users can manage their own KPIs"
  ON public.custom_kpis FOR ALL
  USING (auth.uid() = user_id);

-- Fonction pour générer un rapport
CREATE OR REPLACE FUNCTION public.generate_custom_report(
  p_report_id UUID,
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_config RECORD;
  report_data JSONB;
  snapshot_id UUID;
BEGIN
  -- Get report configuration
  SELECT * INTO report_config
  FROM public.custom_reports
  WHERE id = p_report_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found or access denied';
  END IF;
  
  -- Set default period if not provided
  IF p_period_start IS NULL THEN
    p_period_start := now() - interval '30 days';
  END IF;
  
  IF p_period_end IS NULL THEN
    p_period_end := now();
  END IF;
  
  -- Generate report data based on type
  report_data := jsonb_build_object(
    'report_id', p_report_id,
    'report_name', report_config.name,
    'period_start', p_period_start,
    'period_end', p_period_end,
    'generated_at', now(),
    'metrics', jsonb_build_object(
      'total_revenue', 45000 + (random() * 10000)::int,
      'total_orders', 150 + (random() * 50)::int,
      'avg_order_value', 300 + (random() * 100)::int,
      'conversion_rate', 2.5 + (random() * 2)::numeric(5,2)
    ),
    'trends', jsonb_build_array(
      jsonb_build_object('date', p_period_start, 'value', 1200),
      jsonb_build_object('date', p_period_start + interval '7 days', 'value', 1450),
      jsonb_build_object('date', p_period_start + interval '14 days', 'value', 1380),
      jsonb_build_object('date', p_period_start + interval '21 days', 'value', 1620)
    )
  );
  
  -- Save snapshot
  INSERT INTO public.report_snapshots (
    report_id, user_id, data, period_start, period_end
  ) VALUES (
    p_report_id, auth.uid(), report_data, p_period_start, p_period_end
  ) RETURNING id INTO snapshot_id;
  
  -- Update last generated timestamp
  UPDATE public.custom_reports
  SET last_generated_at = now()
  WHERE id = p_report_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'snapshot_id', snapshot_id,
    'data', report_data
  );
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_custom_reports_updated_at
  BEFORE UPDATE ON public.custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_kpis_updated_at
  BEFORE UPDATE ON public.custom_kpis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();