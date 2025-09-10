-- Fix RLS security issue: Enable RLS on tables missing protection

-- Enable RLS on ingestion_jobs table
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_routing table  
ALTER TABLE public.order_routing ENABLE ROW LEVEL SECURITY;

-- Enable RLS on store_integrations table
ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sync_history table
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- Create secure user access policies for each table
CREATE POLICY "secure_user_access_ingestion_jobs" 
ON public.ingestion_jobs 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_user_access_order_routing" 
ON public.order_routing 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_user_access_store_integrations" 
ON public.store_integrations 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "secure_user_access_sync_history" 
ON public.sync_history 
FOR ALL 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);