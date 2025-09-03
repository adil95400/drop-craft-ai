-- Create missing tables for order routing and bulk import functionality

-- Supplier routing rules table
CREATE TABLE IF NOT EXISTS public.supplier_routing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  routing_method TEXT NOT NULL CHECK (routing_method IN ('api', 'edi', 'email')),
  api_endpoint TEXT,
  email_address TEXT,
  edi_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order routing logs table  
CREATE TABLE IF NOT EXISTS public.order_routing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  routing_method TEXT NOT NULL,
  routing_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Import storage bucket for bulk uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.supplier_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_routing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own routing rules" 
ON public.supplier_routing_rules 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own routing logs" 
ON public.order_routing_logs 
FOR ALL 
USING (auth.uid() = user_id);

-- Storage policies for imports bucket
CREATE POLICY "Users can upload to imports bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own imports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1]);