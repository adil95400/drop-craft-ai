-- Table disputes pour gestion des litiges
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_id UUID REFERENCES public.returns(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Identifiant
  dispute_number TEXT NOT NULL,
  
  -- Statut et type
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'closed')),
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('refund', 'product_quality', 'delivery', 'fraud', 'chargeback', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Détails
  title TEXT NOT NULL,
  description TEXT,
  customer_complaint TEXT,
  internal_notes TEXT,
  
  -- Résolution
  resolution_type TEXT CHECK (resolution_type IN ('full_refund', 'partial_refund', 'replacement', 'store_credit', 'rejected', 'other')),
  resolution_amount NUMERIC(10,2),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Pièces jointes et preuves
  evidence JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  -- Timeline actions
  timeline JSONB DEFAULT '[]',
  
  -- Montants
  disputed_amount NUMERIC(10,2),
  
  -- Dates
  due_date TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les disputes
CREATE INDEX IF NOT EXISTS idx_disputes_user_id ON public.disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_return_id ON public.disputes(return_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON public.disputes(priority);
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_number ON public.disputes(dispute_number);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own disputes" ON public.disputes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own disputes" ON public.disputes
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour générer numéro de litige
CREATE OR REPLACE FUNCTION public.generate_dispute_number()
RETURNS TEXT AS $$
DECLARE
  dispute_num TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.disputes;
  dispute_num := 'DSP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN dispute_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table pour les règles d'automatisation des retours
CREATE TABLE IF NOT EXISTS public.return_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Conditions de déclenchement
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  -- Ex: { "reason_category": ["defective", "damaged_shipping"], "amount_max": 100, "customer_order_count": 5 }
  
  -- Actions automatiques
  auto_actions JSONB NOT NULL DEFAULT '{}',
  -- Ex: { "auto_approve": true, "generate_label": true, "send_notification": true, "create_supplier_return": true }
  
  -- Configuration remboursement
  refund_config JSONB DEFAULT '{}',
  -- Ex: { "method": "original_payment", "percentage": 100, "deduct_shipping": false }
  
  -- Priorité et activation
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les règles
CREATE INDEX IF NOT EXISTS idx_return_automation_rules_user_id ON public.return_automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_return_automation_rules_active ON public.return_automation_rules(is_active);

-- Enable RLS
ALTER TABLE public.return_automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their return automation rules" ON public.return_automation_rules
  FOR ALL USING (auth.uid() = user_id);

-- Table pour les étiquettes de retour
CREATE TABLE IF NOT EXISTS public.return_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_id UUID REFERENCES public.returns(id) ON DELETE CASCADE,
  
  -- Info transporteur
  carrier_code TEXT NOT NULL,
  carrier_name TEXT,
  
  -- Tracking
  tracking_number TEXT,
  label_url TEXT,
  label_format TEXT DEFAULT 'pdf',
  
  -- Adresse
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  
  -- Colis
  weight_kg NUMERIC(10,2),
  dimensions JSONB,
  
  -- Coût
  shipping_cost NUMERIC(10,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Statut
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'printed', 'in_transit', 'delivered', 'failed')),
  
  -- Dates
  expires_at TIMESTAMP WITH TIME ZONE,
  printed_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les étiquettes
CREATE INDEX IF NOT EXISTS idx_return_labels_user_id ON public.return_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_return_labels_return_id ON public.return_labels(return_id);
CREATE INDEX IF NOT EXISTS idx_return_labels_tracking ON public.return_labels(tracking_number);

-- Enable RLS
ALTER TABLE public.return_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their return labels" ON public.return_labels
  FOR ALL USING (auth.uid() = user_id);

-- Trigger pour mise à jour timestamp
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_automation_rules_updated_at
  BEFORE UPDATE ON public.return_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_labels_updated_at
  BEFORE UPDATE ON public.return_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter colonnes à returns pour supplier return
ALTER TABLE public.returns 
ADD COLUMN IF NOT EXISTS supplier_return_id TEXT,
ADD COLUMN IF NOT EXISTS supplier_return_status TEXT,
ADD COLUMN IF NOT EXISTS supplier_refund_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS label_id UUID REFERENCES public.return_labels(id),
ADD COLUMN IF NOT EXISTS automation_rule_id UUID REFERENCES public.return_automation_rules(id),
ADD COLUMN IF NOT EXISTS dispute_id UUID REFERENCES public.disputes(id);