
-- Sprint 3: Tighten overly permissive public INSERT policies

-- 1. contact_messages: Keep public INSERT but add field-length validation trigger
-- (public INSERT is intentional for contact forms, but we add spam protection)
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages with validation"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  -- Basic validation: required fields must be non-empty and reasonable length
  length(name) > 0 AND length(name) <= 200
  AND length(email) > 2 AND length(email) <= 320
  AND length(message) > 10 AND length(message) <= 5000
  AND status = 'new'
);

-- 2. webhook_delivery_logs: Restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "Service can insert delivery logs" ON public.webhook_delivery_logs;
CREATE POLICY "Authenticated users insert own delivery logs"
ON public.webhook_delivery_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also ensure service_role policies remain for backend operations
-- (these are acceptable since service_role is only used server-side)
