-- Add missing columns to stock_alerts
ALTER TABLE public.stock_alerts 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Alerte Stock',
ADD COLUMN IF NOT EXISTS current_stock INTEGER,
ADD COLUMN IF NOT EXISTS recommended_action TEXT,
ADD COLUMN IF NOT EXISTS action_data JSONB,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update existing records to have proper values
UPDATE public.stock_alerts SET 
  title = COALESCE(title, 'Alerte: ' || alert_type),
  current_stock = COALESCE(current_stock, current_value),
  is_read = COALESCE(is_read, false);

-- Create trigger for updated_at if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_alerts_updated_at'
  ) THEN
    CREATE TRIGGER update_stock_alerts_updated_at
      BEFORE UPDATE ON public.stock_alerts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;