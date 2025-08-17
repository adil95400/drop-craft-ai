-- Add admin role and admin_mode columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role TEXT CHECK (role IN ('admin','user')) NOT NULL DEFAULT 'user',
ADD COLUMN admin_mode TEXT DEFAULT NULL;

-- Create index for better performance on role queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Create admin bypass policies for critical tables
CREATE POLICY "admin_bypass_select_profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "admin_bypass_update_profiles" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "admin_bypass_select_customers" ON public.customers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "admin_bypass_select_orders" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "admin_bypass_select_products" ON public.products
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Function to get effective plan
CREATE OR REPLACE FUNCTION public.get_effective_plan(
  user_role TEXT,
  user_plan plan_type,
  user_admin_mode TEXT DEFAULT NULL
) RETURNS plan_type AS $$
BEGIN
  -- If not admin or no admin_mode, return normal plan
  IF user_role != 'admin' OR user_admin_mode IS NULL THEN
    RETURN user_plan;
  END IF;
  
  -- If bypass mode, return ultra_pro
  IF user_admin_mode = 'bypass' THEN
    RETURN 'ultra_pro'::plan_type;
  END IF;
  
  -- If preview mode, extract the plan from the mode string
  IF user_admin_mode LIKE 'preview:%' THEN
    CASE split_part(user_admin_mode, ':', 2)
      WHEN 'standard' THEN RETURN 'standard'::plan_type;
      WHEN 'pro' THEN RETURN 'pro'::plan_type;
      WHEN 'ultra_pro' THEN RETURN 'ultra_pro'::plan_type;
      ELSE RETURN user_plan;
    END CASE;
  END IF;
  
  -- Default fallback
  RETURN user_plan;
END;
$$ LANGUAGE plpgsql STABLE;