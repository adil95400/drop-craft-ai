-- Table pour les prédictions de stock
CREATE TABLE IF NOT EXISTS public.stock_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  store_id TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  predicted_stockout_date TIMESTAMP WITH TIME ZONE,
  predicted_days_until_stockout INTEGER,
  confidence_score INTEGER NOT NULL DEFAULT 70,
  daily_sale_velocity NUMERIC NOT NULL DEFAULT 0,
  trend_direction TEXT NOT NULL DEFAULT 'stable',
  recommendation TEXT,
  reorder_quantity INTEGER,
  reorder_urgency TEXT NOT NULL DEFAULT 'low',
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les suggestions de réassort
CREATE TABLE IF NOT EXISTS public.reorder_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  supplier_id TEXT,
  store_id TEXT,
  suggested_quantity INTEGER NOT NULL DEFAULT 0,
  suggested_reorder_point INTEGER,
  estimated_cost NUMERIC,
  priority_score INTEGER,
  reasoning JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  order_placed_at TIMESTAMP WITH TIME ZONE,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for stock_predictions
CREATE POLICY "Users can view their own stock predictions"
  ON public.stock_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock predictions"
  ON public.stock_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock predictions"
  ON public.stock_predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock predictions"
  ON public.stock_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for reorder_suggestions
CREATE POLICY "Users can view their own reorder suggestions"
  ON public.reorder_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reorder suggestions"
  ON public.reorder_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reorder suggestions"
  ON public.reorder_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reorder suggestions"
  ON public.reorder_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_stock_predictions_updated_at
  BEFORE UPDATE ON public.stock_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reorder_suggestions_updated_at
  BEFORE UPDATE ON public.reorder_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();