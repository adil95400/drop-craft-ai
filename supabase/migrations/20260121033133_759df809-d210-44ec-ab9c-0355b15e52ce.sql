-- Add unique constraint for user_id + platform combination
ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_user_platform_unique UNIQUE (user_id, platform);