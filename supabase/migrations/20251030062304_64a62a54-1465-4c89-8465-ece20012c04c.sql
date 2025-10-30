-- Schedule price and stock monitoring (every 30 minutes)
SELECT cron.schedule(
  'price-stock-monitoring',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
      url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/price-stock-cron',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
      body:='{"trigger": "cron", "type": "monitoring"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule auto order fulfillment processor (every hour)
SELECT cron.schedule(
  'auto-order-fulfillment',
  '0 * * * *',
  $$
  SELECT net.http_post(
      url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/auto-order-fulfillment',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
      body:='{"trigger": "cron", "action": "process_pending"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule stock alerts monitoring (every 15 minutes)
SELECT cron.schedule(
  'stock-alerts-check',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
      url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/stock-monitor',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
      body:='{"trigger": "cron", "action": "check_stock"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule integration sync (every 2 hours)
SELECT cron.schedule(
  'integration-sync',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
      url:='https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/cron-sync',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI"}'::jsonb,
      body:='{"trigger": "cron", "sync_type": "all_integrations"}'::jsonb
  ) AS request_id;
  $$
);