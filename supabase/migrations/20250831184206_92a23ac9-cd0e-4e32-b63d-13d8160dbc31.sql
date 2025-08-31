-- Create tables for Phase 1: Hub Fournisseurs & Import Multi-formats (Fixed)

-- Create supplier_connectors table for managing connections
CREATE TABLE IF NOT EXISTS public.supplier_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  credentials jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'disconnected',
  connected_at timestamp with time zone,
  disconnected_at timestamp with time zone,
  last_sync_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

-- Enable RLS
ALTER TABLE public.supplier_connectors ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_connectors
CREATE POLICY "Users can manage their own supplier connectors"
ON public.supplier_connectors
FOR ALL 
USING (auth.uid() = user_id);

-- Create import_templates table for reusable field mappings
CREATE TABLE IF NOT EXISTS public.import_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  file_type text NOT NULL DEFAULT 'csv',
  field_mappings jsonb NOT NULL DEFAULT '[]',
  validation_rules jsonb NOT NULL DEFAULT '[]',
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_templates
CREATE POLICY "Users can manage their own import templates"
ON public.import_templates
FOR ALL 
USING (auth.uid() = user_id);

-- Create sync_schedules table for automatic synchronization
CREATE TABLE IF NOT EXISTS public.sync_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily',
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamp with time zone,
  next_sync_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.sync_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync_schedules
CREATE POLICY "Users can manage their own sync schedules"
ON public.sync_schedules
FOR ALL 
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_connectors_user_id ON public.supplier_connectors(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_connectors_status ON public.supplier_connectors(status);
CREATE INDEX IF NOT EXISTS idx_import_templates_user_id ON public.import_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_import_templates_file_type ON public.import_templates(file_type);
CREATE INDEX IF NOT EXISTS idx_sync_schedules_user_id ON public.sync_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_schedules_enabled ON public.sync_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_sync_schedules_next_sync ON public.sync_schedules(next_sync_at);

-- Add trigger for updating timestamps
CREATE TRIGGER update_supplier_connectors_updated_at
  BEFORE UPDATE ON public.supplier_connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_templates_updated_at
  BEFORE UPDATE ON public.import_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_schedules_updated_at
  BEFORE UPDATE ON public.sync_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();