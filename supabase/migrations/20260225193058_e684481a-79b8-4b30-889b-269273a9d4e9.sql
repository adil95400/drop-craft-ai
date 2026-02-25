-- Table pour les paramètres de branding des factures
CREATE TABLE IF NOT EXISTS public.invoice_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  company_address TEXT DEFAULT '',
  company_email TEXT DEFAULT '',
  company_phone TEXT DEFAULT '',
  company_website TEXT DEFAULT '',
  tax_id TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#6366f1',
  footer_text TEXT DEFAULT 'Merci pour votre confiance !',
  payment_terms TEXT DEFAULT 'Paiement à 30 jours',
  bank_details TEXT DEFAULT '',
  currency TEXT DEFAULT 'EUR',
  invoice_prefix TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.invoice_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own branding" ON public.invoice_branding
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_invoice_branding_updated_at
  BEFORE UPDATE ON public.invoice_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to invoice_history if needed
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2);
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.invoice_history ADD COLUMN IF NOT EXISTS template_name TEXT;