-- Fix Customer Personal Information Security Issue
-- The current policy is too permissive and could allow unauthorized access

-- First, drop the existing overly broad policy
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;

-- Create specific, restrictive policies for each operation
-- Users can only view their own customer data
CREATE POLICY "Users can view their own customers"
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only create customers assigned to themselves
CREATE POLICY "Users can create their own customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own customer data
CREATE POLICY "Users can update their own customers"
ON public.customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own customer data
CREATE POLICY "Users can delete their own customers"
ON public.customers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Add additional constraint to ensure user_id is never null for data integrity
-- This prevents orphaned customer records that could bypass RLS
ALTER TABLE public.customers 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Log this security fix
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'security_policy_update',
  'info',
  'Enhanced RLS policies for customers table to prevent unauthorized access to personal information',
  '{"table": "customers", "action": "policy_enhancement", "policies_added": 4}'
);