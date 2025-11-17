-- Add webhook_secret column to marketplace_integrations for Shopify webhook signature verification
ALTER TABLE marketplace_integrations 
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add index for faster lookups by shop_url
CREATE INDEX IF NOT EXISTS idx_marketplace_integrations_shop_url 
ON marketplace_integrations(shop_url) 
WHERE platform = 'shopify';

-- Add comment explaining the column
COMMENT ON COLUMN marketplace_integrations.webhook_secret IS 'Shopify webhook signing secret for HMAC-SHA256 signature verification. Each store has its own unique secret.';
