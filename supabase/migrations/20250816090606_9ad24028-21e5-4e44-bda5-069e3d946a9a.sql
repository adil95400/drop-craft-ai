-- Fix the remaining Security Definer functions by setting proper search paths
ALTER FUNCTION public.get_user_role(uuid) SET search_path TO 'public';
ALTER FUNCTION public.is_admin(uuid) SET search_path TO 'public';
ALTER FUNCTION public.log_admin_data_access(text, text, uuid) SET search_path TO 'public';