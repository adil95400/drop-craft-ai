-- Create missing shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT DEFAULT 'auto',
  status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shipments
CREATE POLICY "Users can manage shipments for their orders" 
ON public.shipments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = shipments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Fix order_items table column name if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
    ALTER TABLE order_items RENAME COLUMN quantity TO qty;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);