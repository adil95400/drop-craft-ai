-- Create table for Shopify webhooks if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopify_webhooks') THEN
    CREATE TABLE public.shopify_webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
      webhook_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      address TEXT NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(integration_id, topic)
    );

    -- Enable RLS
    ALTER TABLE public.shopify_webhooks ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    CREATE POLICY "Users can view their own webhooks"
      ON public.shopify_webhooks
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own webhooks"
      ON public.shopify_webhooks
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own webhooks"
      ON public.shopify_webhooks
      FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own webhooks"
      ON public.shopify_webhooks
      FOR DELETE
      USING (auth.uid() = user_id);

    -- Create indexes
    CREATE INDEX idx_shopify_webhooks_integration_id ON public.shopify_webhooks(integration_id);
    CREATE INDEX idx_shopify_webhooks_topic ON public.shopify_webhooks(topic);
    CREATE INDEX idx_shopify_webhooks_user_id ON public.shopify_webhooks(user_id);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shopify_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and create trigger
DROP TRIGGER IF EXISTS update_shopify_webhooks_timestamp ON public.shopify_webhooks;
CREATE TRIGGER update_shopify_webhooks_timestamp
  BEFORE UPDATE ON public.shopify_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_webhooks_updated_at();