-- CORRECTION FINALE - Remplacer la derniere vue security definer par une fonction securisee

-- Supprimer la vue customers_secure qui pose probleme
DROP VIEW IF EXISTS public.customers_secure;

-- Creer une fonction securisee pour remplacer la vue
CREATE OR REPLACE FUNCTION public.get_customers_secure()
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  status text,
  total_spent numeric,
  total_orders integer,
  address jsonb,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    -- Masquer completement l'email et le telephone
    'hidden@protected.com' AS email,
    '+33****protected' AS phone,
    c.status,
    c.total_spent,
    c.total_orders,
    -- Masquer l'adresse complete
    jsonb_build_object('protected', true) AS address,
    c.user_id,
    c.created_at,
    c.updated_at
  FROM customers c
  WHERE auth.uid() = c.user_id AND auth.uid() IS NOT NULL;
$$;

-- Accorder l'acces a la fonction securisee
GRANT EXECUTE ON FUNCTION public.get_customers_secure() TO authenticated;