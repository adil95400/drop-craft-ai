-- Fix security vulnerability in notifications table
-- Issue: Anyone can insert notifications with any user_id

-- First, make user_id NOT NULL since notifications should always have a user
ALTER TABLE public.notifications 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the insecure policy that allows anyone to insert notifications
DROP POLICY IF EXISTS "insert_notifications" ON public.notifications;

-- Create a secure policy that only allows:
-- 1. System processes (using service role) to insert notifications
-- 2. Admin users to insert notifications for any user
-- 3. Regular users to insert notifications only for themselves (if needed)
CREATE POLICY "secure_insert_notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- Allow service role (system processes) to insert any notification
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Allow admin users to insert notifications for any user
  (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  OR
  -- Allow authenticated users to create notifications only for themselves
  (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
);

-- Update the select policy to be more explicit about user access
DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;

CREATE POLICY "secure_select_notifications" 
ON public.notifications 
FOR SELECT 
USING (
  -- Users can view their own notifications
  user_id = auth.uid()
  OR
  -- Admin users can view all notifications
  (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Update the update policy to be more explicit
DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;

CREATE POLICY "secure_update_notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  -- Users can update their own notifications
  user_id = auth.uid()
  OR
  -- Admin users can update any notification
  (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  -- Ensure user_id cannot be changed to another user (except by admins)
  user_id = auth.uid()
  OR
  (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Update the delete policy to be more explicit
DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;

CREATE POLICY "secure_delete_notifications" 
ON public.notifications 
FOR DELETE 
USING (
  -- Users can delete their own notifications
  user_id = auth.uid()
  OR
  -- Admin users can delete any notification
  (
    auth.uid() IS NOT NULL 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);