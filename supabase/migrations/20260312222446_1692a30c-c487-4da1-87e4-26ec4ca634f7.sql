
-- Financial transactions table (expenses, revenues, refunds)
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'expense', -- expense, revenue, refund, tax, fee
  category TEXT NOT NULL DEFAULT 'other', -- advertising, shipping, supplier, platform_fee, subscription, tax, refund, other
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id TEXT,
  reference_type TEXT, -- order, campaign, supplier, manual
  is_recurring BOOLEAN DEFAULT false,
  recurrence_period TEXT, -- monthly, quarterly, yearly
  tags TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transactions" ON public.financial_transactions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Financial summaries (monthly/quarterly snapshots)
CREATE TABLE public.financial_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  total_taxes DECIMAL(12,2) DEFAULT 0,
  total_refunds DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  avg_order_value DECIMAL(12,2) DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own summaries" ON public.financial_summaries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tax configurations
CREATE TABLE public.tax_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  country TEXT,
  region TEXT,
  applies_to TEXT DEFAULT 'all', -- all, products, shipping, services
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tax configs" ON public.tax_configurations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
