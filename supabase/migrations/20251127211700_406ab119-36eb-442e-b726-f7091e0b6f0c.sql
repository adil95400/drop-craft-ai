-- Module E: AI Store Builder Tables
CREATE TABLE IF NOT EXISTS public.store_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  theme_config JSONB DEFAULT '{}',
  navigation_structure JSONB DEFAULT '{}',
  seo_config JSONB DEFAULT '{}',
  color_scheme JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  preview_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generated_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.store_templates(id) ON DELETE SET NULL,
  store_name TEXT NOT NULL,
  store_url TEXT,
  generation_status TEXT DEFAULT 'pending',
  theme_data JSONB DEFAULT '{}',
  pages_created INTEGER DEFAULT 0,
  products_imported INTEGER DEFAULT 0,
  seo_score DECIMAL(3,2),
  ai_optimizations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Module G: Custom Invoices Tables
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_type TEXT DEFAULT 'standard',
  logo_url TEXT,
  company_info JSONB DEFAULT '{}',
  design_config JSONB DEFAULT '{}',
  legal_mentions TEXT,
  language TEXT DEFAULT 'fr',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.invoice_templates(id) ON DELETE SET NULL,
  order_id UUID,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.packaging_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  apply_to_orders BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}',
  language TEXT DEFAULT 'fr',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Module H: Print On Demand Tables
CREATE TABLE IF NOT EXISTS public.pod_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  supplier TEXT NOT NULL,
  base_cost DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  design_url TEXT,
  mockup_urls JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  status TEXT DEFAULT 'draft',
  shopify_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pod_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_product_id UUID REFERENCES public.pod_products(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  variant_selected JSONB,
  quantity INTEGER DEFAULT 1,
  production_status TEXT DEFAULT 'pending',
  supplier_order_id TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.pod_mockups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pod_product_id UUID REFERENCES public.pod_products(id) ON DELETE CASCADE,
  mockup_url TEXT NOT NULL,
  variant_name TEXT,
  view_angle TEXT,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.store_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pod_mockups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own store templates" ON public.store_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own generated stores" ON public.generated_stores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice templates" ON public.invoice_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own invoice history" ON public.invoice_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own packaging messages" ON public.packaging_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own POD products" ON public.pod_products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own POD orders" ON public.pod_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own POD mockups" ON public.pod_mockups FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_store_templates_updated_at BEFORE UPDATE ON public.store_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON public.invoice_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packaging_messages_updated_at BEFORE UPDATE ON public.packaging_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pod_products_updated_at BEFORE UPDATE ON public.pod_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();