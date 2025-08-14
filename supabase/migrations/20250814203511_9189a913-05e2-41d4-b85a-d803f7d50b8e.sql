-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Add security function for supplier access validation
CREATE OR REPLACE FUNCTION public.is_supplier_owner(_supplier_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.suppliers 
    WHERE id = _supplier_id AND user_id = _user_id
  );
$function$;

-- Enhanced RLS policies for suppliers table with stricter access controls
DROP POLICY IF EXISTS "Users can view only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert only their own suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete only their own suppliers" ON public.suppliers;

-- More restrictive policies
CREATE POLICY "suppliers_select_policy" ON public.suppliers
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
    AND status = 'active'
  );

CREATE POLICY "suppliers_insert_policy" ON public.suppliers
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
    AND encrypted_credentials IS NULL -- Don't allow direct insertion of credentials
  );

CREATE POLICY "suppliers_update_policy" ON public.suppliers
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "suppliers_delete_policy" ON public.suppliers
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Add additional security constraints
ALTER TABLE public.suppliers 
ADD CONSTRAINT suppliers_user_id_not_null 
CHECK (user_id IS NOT NULL);

-- Add credential rotation tracking
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS credentials_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;