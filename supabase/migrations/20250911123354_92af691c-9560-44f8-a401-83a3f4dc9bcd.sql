-- Enable real-time for store_integrations table
ALTER TABLE public.store_integrations REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_integrations;