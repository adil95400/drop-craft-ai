-- Add plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'ultra_pro'));

-- Update existing profiles to have free plan
UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);

-- Create function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(plan, 'free') FROM public.profiles WHERE id = user_id_param;
$$;

-- Create function to check if user has minimum plan
CREATE OR REPLACE FUNCTION public.has_plan(user_id_param uuid, min_plan text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_plan text;
BEGIN
  SELECT COALESCE(plan, 'free') INTO user_plan FROM public.profiles WHERE id = user_id_param;
  
  -- Plan hierarchy: free < pro < ultra_pro
  IF min_plan = 'free' THEN
    RETURN true;
  ELSIF min_plan = 'pro' THEN
    RETURN user_plan IN ('pro', 'ultra_pro');
  ELSIF min_plan = 'ultra_pro' THEN
    RETURN user_plan = 'ultra_pro';
  ELSE
    RETURN false;
  END IF;
END;
$$;