
-- Satisfaction surveys
CREATE TABLE public.satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID,
  survey_type TEXT NOT NULL DEFAULT 'post_purchase',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  sentiment TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own surveys" ON public.satisfaction_surveys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_surveys_user ON public.satisfaction_surveys(user_id);
CREATE INDEX idx_surveys_status ON public.satisfaction_surveys(status);
CREATE INDEX idx_surveys_customer ON public.satisfaction_surveys(customer_id);
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.satisfaction_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Review reminders
CREATE TABLE public.review_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  sent_at TIMESTAMPTZ,
  review_received BOOLEAN NOT NULL DEFAULT false,
  review_rating INTEGER,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  max_reminders INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders" ON public.review_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reminders_user ON public.review_reminders(user_id);
CREATE INDEX idx_reminders_scheduled ON public.review_reminders(scheduled_at) WHERE status = 'scheduled';
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.review_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Refund requests
CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  reason TEXT NOT NULL,
  reason_category TEXT DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'pending',
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own refunds" ON public.refund_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_refunds_user ON public.refund_requests(user_id);
CREATE INDEX idx_refunds_status ON public.refund_requests(status);
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
