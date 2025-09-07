-- Create sample data for testing (Phase 1 completion)
-- Insert sample customers
INSERT INTO customers (user_id, name, email, phone, status, total_spent, total_orders, address) VALUES
(auth.uid(), 'Jean Dupont', 'jean.dupont@email.com', '+33 1 23 45 67 89', 'active', 2500.00, 5, '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}'),
(auth.uid(), 'Marie Martin', 'marie.martin@email.com', '+33 1 98 76 54 32', 'active', 1800.00, 3, '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}'),
(auth.uid(), 'Pierre Durant', 'pierre.durant@email.com', '+33 1 11 22 33 44', 'inactive', 950.00, 2, '{"street": "789 Boulevard Saint-Germain", "city": "Marseille", "postal_code": "13001", "country": "France"}');

-- Insert sample orders
INSERT INTO orders (user_id, customer_id, order_number, status, total_amount, currency, order_date, delivery_date, shipping_address, billing_address, items) VALUES
(auth.uid(), (SELECT id FROM customers WHERE email = 'jean.dupont@email.com' AND user_id = auth.uid() LIMIT 1), 'ORD-2024-001', 'delivered', 450.00, 'EUR', '2024-01-15', '2024-01-18', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '[{"product_name": "Chaise de bureau", "quantity": 2, "price": 225.00}]'),
(auth.uid(), (SELECT id FROM customers WHERE email = 'marie.martin@email.com' AND user_id = auth.uid() LIMIT 1), 'ORD-2024-002', 'processing', 320.00, 'EUR', '2024-01-20', NULL, '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}', '{"street": "456 Avenue des Champs", "city": "Lyon", "postal_code": "69001", "country": "France"}', '[{"product_name": "Table basse", "quantity": 1, "price": 320.00}]'),
(auth.uid(), (SELECT id FROM customers WHERE email = 'jean.dupont@email.com' AND user_id = auth.uid() LIMIT 1), 'ORD-2024-003', 'shipped', 180.00, 'EUR', '2024-01-25', '2024-01-28', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '{"street": "123 Rue de la Paix", "city": "Paris", "postal_code": "75001", "country": "France"}', '[{"product_name": "Lampe de bureau", "quantity": 3, "price": 60.00}]');

-- Insert sample suppliers
INSERT INTO suppliers (user_id, name, website, country, status, rating, contact_email, contact_phone, product_count) VALUES
(auth.uid(), 'Mobilier Pro', 'https://mobilier-pro.fr', 'France', 'active', 4.5, 'contact@mobilier-pro.fr', '+33 1 55 66 77 88', 150),
(auth.uid(), 'Design Furniture Ltd', 'https://designfurniture.co.uk', 'United Kingdom', 'active', 4.2, 'sales@designfurniture.co.uk', '+44 20 1234 5678', 89),
(auth.uid(), 'Casa Moderna', 'https://casamoderna.it', 'Italy', 'active', 4.7, 'info@casamoderna.it', '+39 02 1234 5678', 203);

-- Phase 2: Create automation tables
CREATE TABLE IF NOT EXISTS automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('order_status', 'customer_behavior', 'inventory_level', 'price_change', 'scheduled')),
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trigger_id UUID NOT NULL REFERENCES automation_triggers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'update_inventory', 'create_order', 'update_customer', 'price_adjustment', 'notification')),
  action_config JSONB NOT NULL DEFAULT '{}',
  execution_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trigger_id UUID NOT NULL REFERENCES automation_triggers(id),
  action_id UUID NOT NULL REFERENCES automation_actions(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on automation tables
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their automation triggers" ON automation_triggers
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their automation actions" ON automation_actions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their automation executions" ON automation_executions
FOR ALL USING (auth.uid() = user_id);

-- Create automation processing function
CREATE OR REPLACE FUNCTION process_automation_trigger(
  trigger_id UUID,
  context_data JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trigger_record automation_triggers%ROWTYPE;
  action_record automation_actions%ROWTYPE;
  execution_id UUID;
  result JSONB := '{"success": true, "actions_executed": 0}';
  actions_count INTEGER := 0;
BEGIN
  -- Get trigger details
  SELECT * INTO trigger_record
  FROM automation_triggers
  WHERE id = trigger_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN '{"success": false, "error": "Trigger not found or inactive"}';
  END IF;
  
  -- Process all actions for this trigger
  FOR action_record IN
    SELECT * FROM automation_actions
    WHERE trigger_id = trigger_record.id AND is_active = true
    ORDER BY execution_order ASC
  LOOP
    -- Create execution record
    INSERT INTO automation_executions (user_id, trigger_id, action_id, input_data, status)
    VALUES (trigger_record.user_id, trigger_id, action_record.id, context_data, 'running')
    RETURNING id INTO execution_id;
    
    -- Here would be actual action execution logic
    -- For now, just mark as completed
    UPDATE automation_executions
    SET status = 'completed',
        completed_at = now(),
        execution_time_ms = 50,
        output_data = jsonb_build_object('action_type', action_record.action_type, 'simulated', true)
    WHERE id = execution_id;
    
    actions_count := actions_count + 1;
  END LOOP;
  
  result := jsonb_set(result, '{actions_executed}', to_jsonb(actions_count));
  RETURN result;
END;
$$;

-- Create sample automation rules
INSERT INTO automation_triggers (user_id, name, description, trigger_type, conditions) VALUES
(auth.uid(), 'Commande livrée', 'Déclenché quand une commande est marquée comme livrée', 'order_status', '{"status": "delivered"}'),
(auth.uid(), 'Client inactif', 'Déclenché pour les clients sans commande depuis 30 jours', 'customer_behavior', '{"days_inactive": 30}'),
(auth.uid(), 'Stock faible', 'Déclenché quand le stock d''un produit est bas', 'inventory_level', '{"threshold": 10}');

-- Create corresponding automation actions
INSERT INTO automation_actions (user_id, trigger_id, action_type, action_config, execution_order) VALUES
(auth.uid(), (SELECT id FROM automation_triggers WHERE name = 'Commande livrée' AND user_id = auth.uid()), 'send_email', '{"template": "delivery_confirmation", "recipient": "customer"}', 1),
(auth.uid(), (SELECT id FROM automation_triggers WHERE name = 'Client inactif' AND user_id = auth.uid()), 'send_email', '{"template": "reactivation_campaign", "discount": 10}', 1),
(auth.uid(), (SELECT id FROM automation_triggers WHERE name = 'Stock faible' AND user_id = auth.uid()), 'notification', '{"type": "low_stock_alert", "urgency": "medium"}', 1);