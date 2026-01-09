-- Create KPIs table for tracking user KPIs
CREATE TABLE public.user_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '',
  kpi_type TEXT NOT NULL DEFAULT 'custom',
  period TEXT NOT NULL DEFAULT 'monthly',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_kpis ENABLE ROW LEVEL SECURITY;

-- Create policies for user KPIs
CREATE POLICY "Users can view their own KPIs" 
ON public.user_kpis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own KPIs" 
ON public.user_kpis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own KPIs" 
ON public.user_kpis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own KPIs" 
ON public.user_kpis 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_kpis_updated_at
BEFORE UPDATE ON public.user_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();