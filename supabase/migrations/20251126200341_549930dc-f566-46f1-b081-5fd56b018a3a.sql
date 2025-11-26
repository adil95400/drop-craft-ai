-- Create supplier_credentials_vault table with all required columns
CREATE TABLE IF NOT EXISTS public.supplier_credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL,
  credentials_encrypted JSONB NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending',
  connection_settings JSONB DEFAULT '{}',
  last_test_at TIMESTAMPTZ,
  test_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.supplier_credentials_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own supplier credentials"
  ON public.supplier_credentials_vault
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own supplier credentials"
  ON public.supplier_credentials_vault
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier credentials"
  ON public.supplier_credentials_vault
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own supplier credentials"
  ON public.supplier_credentials_vault
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_supplier_credentials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_supplier_credentials_vault_timestamp
  BEFORE UPDATE ON public.supplier_credentials_vault
  FOR EACH ROW
  EXECUTE FUNCTION public.update_supplier_credentials_timestamp();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_supplier_credentials_user_id ON public.supplier_credentials_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_credentials_supplier_id ON public.supplier_credentials_vault(supplier_id);