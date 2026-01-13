-- Add auto_sync_config column to integrations table
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS auto_sync_config JSONB DEFAULT '{}';

-- Add auto_sync_enabled column if not exists
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;

-- Add auto_sync_interval column if not exists
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS auto_sync_interval INTEGER DEFAULT 60;

-- Add comment for documentation
COMMENT ON COLUMN public.integrations.auto_sync_config IS 'JSON configuration for auto-sync settings including products, orders, inventory, prices sync options';