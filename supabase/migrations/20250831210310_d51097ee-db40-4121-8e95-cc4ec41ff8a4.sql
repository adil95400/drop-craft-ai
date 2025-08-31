-- Create cron job for automated sync (requires pg_cron extension)
-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule automated sync to run every hour
SELECT cron.schedule(
  'automated-supplier-sync',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/automated-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
        body:=concat('{"time": "', now(), '", "type": "scheduled"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule order tracking updates every 6 hours
SELECT cron.schedule(
  'order-tracking-updates',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
        url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/order-tracking',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
        body:='{"action": "update_all", "scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule daily maintenance tasks
SELECT cron.schedule(
  'daily-maintenance',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/automated-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
        body:='{"type": "maintenance", "scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Add indexes for better performance on sync queries
CREATE INDEX IF NOT EXISTS idx_imported_products_updated_at ON imported_products(updated_at);
CREATE INDEX IF NOT EXISTS idx_imported_products_user_supplier ON imported_products(user_id, supplier_name);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status_scheduled ON import_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number, tracking_status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action ON activity_logs(user_id, action, created_at);

-- Add webhook security configuration table
CREATE TABLE IF NOT EXISTS webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform_type TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  events_enabled TEXT[] DEFAULT ARRAY['orders', 'products', 'inventory'],
  last_event_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on webhook configurations
ALTER TABLE webhook_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook configurations
CREATE POLICY "Users can manage their own webhook configurations"
ON webhook_configurations
FOR ALL
USING (auth.uid() = user_id);

-- Add sync statistics table for monitoring
CREATE TABLE IF NOT EXISTS sync_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sync_type TEXT NOT NULL,
  products_processed INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  sync_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sync statistics
ALTER TABLE sync_statistics ENABLE ROW LEVEL SECURITY;

-- RLS policies for sync statistics
CREATE POLICY "Users can view their own sync statistics"
ON sync_statistics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert sync statistics"
ON sync_statistics
FOR INSERT
WITH CHECK (true);

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to webhook configurations
DROP TRIGGER IF EXISTS update_webhook_configurations_updated_at ON webhook_configurations;
CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add deduplication results table
CREATE TABLE IF NOT EXISTS deduplication_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID,
  total_products INTEGER NOT NULL,
  duplicates_found INTEGER DEFAULT 0,
  unique_products INTEGER DEFAULT 0,
  merged_products INTEGER DEFAULT 0,
  deduplication_rate NUMERIC(5,2) DEFAULT 0,
  algorithm_used TEXT DEFAULT 'fuzzy_matching',
  execution_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  results_data JSONB DEFAULT '{}'
);

-- Enable RLS on deduplication results
ALTER TABLE deduplication_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for deduplication results
CREATE POLICY "Users can view their own deduplication results"
ON deduplication_results
FOR ALL
USING (auth.uid() = user_id);