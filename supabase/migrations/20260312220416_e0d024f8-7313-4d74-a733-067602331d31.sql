
-- Packing slip templates for custom branding
CREATE TABLE public.packing_slip_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  logo_url TEXT,
  company_name TEXT,
  company_address TEXT,
  thank_you_message TEXT,
  footer_text TEXT,
  show_prices BOOLEAN DEFAULT true,
  show_barcode BOOLEAN DEFAULT false,
  show_return_label BOOLEAN DEFAULT false,
  brand_color TEXT DEFAULT '#000000',
  template_style TEXT DEFAULT 'classic',
  custom_css TEXT,
  insert_image_url TEXT,
  insert_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_slip_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own packing slip templates"
  ON public.packing_slip_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_packing_slip_templates_updated_at
  BEFORE UPDATE ON public.packing_slip_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Split order tracking
CREATE TABLE public.split_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_order_id UUID NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  tracking_number TEXT,
  carrier TEXT,
  supplier_order_id TEXT,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.split_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own split orders"
  ON public.split_orders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_split_orders_parent ON public.split_orders(parent_order_id);
CREATE INDEX idx_split_orders_status ON public.split_orders(user_id, status);

CREATE TRIGGER update_split_orders_updated_at
  BEFORE UPDATE ON public.split_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
