-- Table pour les retours clients
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  return_number TEXT NOT NULL UNIQUE,
  
  -- Informations de retour
  reason TEXT NOT NULL,
  reason_details TEXT,
  requested_action TEXT NOT NULL CHECK (requested_action IN ('refund', 'exchange', 'store_credit')),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'received', 'inspecting', 'completed', 'refunded')),
  
  -- Items retournés
  items_returned JSONB NOT NULL DEFAULT '[]',
  total_refund_amount DECIMAL(10,2),
  
  -- Tracking retour
  return_tracking_number TEXT,
  return_carrier TEXT,
  return_label_url TEXT,
  
  -- Inspection & décision
  inspection_notes TEXT,
  inspection_photos TEXT[],
  refund_approved_amount DECIMAL(10,2),
  restocking_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Automation
  auto_processed BOOLEAN DEFAULT FALSE,
  ai_decision_confidence DECIMAL(3,2),
  ai_decision_reason TEXT,
  
  -- Client communication
  customer_notified_at TIMESTAMP WITH TIME ZONE,
  customer_confirmation_sent BOOLEAN DEFAULT FALSE,
  customer_confirmation_opened BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les règles d'automatisation des retours
CREATE TABLE IF NOT EXISTS public.return_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rule_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  -- Conditions de déclenchement
  trigger_conditions JSONB NOT NULL, -- {reason: [], order_value: {min, max}, customer_history: {}}
  
  -- Actions automatiques
  auto_approve BOOLEAN DEFAULT FALSE,
  auto_generate_label BOOLEAN DEFAULT FALSE,
  auto_refund BOOLEAN DEFAULT FALSE,
  auto_send_confirmation BOOLEAN DEFAULT TRUE,
  
  -- Règles de refund
  refund_type TEXT CHECK (refund_type IN ('full', 'partial', 'store_credit')),
  restocking_fee_percentage DECIMAL(5,2) DEFAULT 0,
  refund_method TEXT CHECK (refund_method IN ('original', 'store_credit', 'manual')),
  
  -- IA décision assistance
  require_manual_review BOOLEAN DEFAULT FALSE,
  ai_confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le suivi automatique des colis (amélioration)
CREATE TABLE IF NOT EXISTS public.tracking_auto_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  tracking_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  
  -- Status du tracking
  current_status TEXT,
  last_location TEXT,
  last_checkpoint_time TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Historique des événements
  tracking_events JSONB DEFAULT '[]',
  
  -- Synchronisation
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notifications client
  customer_notification_sent BOOLEAN DEFAULT FALSE,
  notification_events TEXT[] DEFAULT ARRAY['shipped', 'out_for_delivery', 'delivered'],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les confirmations client automatiques
CREATE TABLE IF NOT EXISTS public.customer_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
  
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('order_placed', 'order_shipped', 'order_delivered', 'return_received', 'return_approved', 'refund_processed')),
  
  -- Contenu de la confirmation
  email_subject TEXT,
  email_body TEXT,
  sms_body TEXT,
  
  -- Statut d'envoi
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Canaux utilisés
  channels_used TEXT[] DEFAULT ARRAY['email'],
  
  -- Template utilisé
  template_id TEXT,
  personalization_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_auto_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for returns
CREATE POLICY "Users can view their own returns"
  ON public.returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own returns"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own returns"
  ON public.returns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own returns"
  ON public.returns FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for return_automation_rules
CREATE POLICY "Users can manage their own return rules"
  ON public.return_automation_rules FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for tracking_auto_updates
CREATE POLICY "Users can manage their own tracking updates"
  ON public.tracking_auto_updates FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for customer_confirmations
CREATE POLICY "Users can manage their own confirmations"
  ON public.customer_confirmations FOR ALL
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_automation_rules_updated_at
  BEFORE UPDATE ON public.return_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_auto_updates_updated_at
  BEFORE UPDATE ON public.tracking_auto_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_returns_user_id ON public.returns(user_id);
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_created_at ON public.returns(created_at DESC);

CREATE INDEX idx_return_automation_rules_user_id ON public.return_automation_rules(user_id);
CREATE INDEX idx_return_automation_rules_active ON public.return_automation_rules(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_tracking_auto_updates_tracking_number ON public.tracking_auto_updates(tracking_number);
CREATE INDEX idx_tracking_auto_updates_order_id ON public.tracking_auto_updates(order_id);
CREATE INDEX idx_tracking_auto_updates_last_synced ON public.tracking_auto_updates(last_synced_at);

CREATE INDEX idx_customer_confirmations_order_id ON public.customer_confirmations(order_id);
CREATE INDEX idx_customer_confirmations_return_id ON public.customer_confirmations(return_id);
CREATE INDEX idx_customer_confirmations_type ON public.customer_confirmations(confirmation_type);
