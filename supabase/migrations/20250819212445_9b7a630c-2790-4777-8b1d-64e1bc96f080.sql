-- Create category_mapping_rules table
CREATE TABLE public.category_mapping_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_category text NOT NULL,
  target_category text NOT NULL,
  confidence numeric NOT NULL DEFAULT 1.0,
  is_ai boolean NOT NULL DEFAULT false,
  keywords text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sync_jobs table
CREATE TABLE public.sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  supplier text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_sync timestamp with time zone,
  next_sync timestamp with time zone,
  frequency text NOT NULL DEFAULT 'daily',
  products_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for category_mapping_rules
CREATE POLICY "Users can manage their own category mapping rules"
ON public.category_mapping_rules
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for sync_jobs
CREATE POLICY "Users can manage their own sync jobs"
ON public.sync_jobs
FOR ALL
USING (auth.uid() = user_id);

-- Create update triggers
CREATE TRIGGER update_category_mapping_rules_updated_at
  BEFORE UPDATE ON public.category_mapping_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();