
-- Drop the existing policy and create proper separate policies
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;

-- Create granular RLS policies for customers table
CREATE POLICY "Users can view own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" 
ON public.customers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow admins to access all customers for management purposes
CREATE POLICY "Admins can view all customers" 
ON public.customers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can manage all customers" 
ON public.customers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);
