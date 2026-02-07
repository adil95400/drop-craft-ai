-- Create free_trial_subscriptions table
CREATE TABLE public.free_trial_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_plan TEXT NOT NULL DEFAULT 'pro',
  trial_days INTEGER NOT NULL DEFAULT 14,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  coupon_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.free_trial_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own trial
CREATE POLICY "Users can view own trial"
ON public.free_trial_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service_role can insert/update (via edge function)
CREATE POLICY "Service role can manage trials"
ON public.free_trial_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add subscription columns to profiles if missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'standard';
