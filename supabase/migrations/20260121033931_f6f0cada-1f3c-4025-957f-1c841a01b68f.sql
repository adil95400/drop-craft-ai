-- Add sync_settings column to integrations table for storing sync configuration
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{}'::jsonb;