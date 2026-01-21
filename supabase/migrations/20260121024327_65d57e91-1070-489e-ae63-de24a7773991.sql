-- =====================================================
-- Compliance Center Tables
-- =====================================================

-- Compliance Frameworks table
CREATE TABLE IF NOT EXISTS public.compliance_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  compliance_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('compliant', 'non_compliant', 'in_progress', 'pending')),
  last_audit TIMESTAMP WITH TIME ZONE,
  next_audit TIMESTAMP WITH TIME ZONE,
  requirements_met INTEGER DEFAULT 0,
  requirements_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own compliance frameworks"
  ON public.compliance_frameworks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance frameworks"
  ON public.compliance_frameworks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compliance frameworks"
  ON public.compliance_frameworks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own compliance frameworks"
  ON public.compliance_frameworks FOR DELETE
  USING (auth.uid() = user_id);

-- Compliance Checks table
CREATE TABLE IF NOT EXISTS public.compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  framework_id UUID REFERENCES public.compliance_frameworks(id) ON DELETE CASCADE,
  framework_name TEXT,
  requirement TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'pending', 'not_applicable')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  evidence TEXT,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own compliance checks"
  ON public.compliance_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own compliance checks"
  ON public.compliance_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own compliance checks"
  ON public.compliance_checks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own compliance checks"
  ON public.compliance_checks FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp triggers
CREATE TRIGGER update_compliance_frameworks_updated_at
  BEFORE UPDATE ON public.compliance_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_checks_updated_at
  BEFORE UPDATE ON public.compliance_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();