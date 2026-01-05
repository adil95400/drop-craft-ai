-- Fix SECURITY DEFINER functions by adding SET search_path = 'public'
-- for functions that don't already have it

-- admin_get_all_users - add search_path protection
ALTER FUNCTION public.admin_get_all_users() SET search_path = 'public';

-- admin_update_user_plan - add search_path protection  
ALTER FUNCTION public.admin_update_user_plan(uuid, text) SET search_path = 'public';

-- anonymize_customer_data - add search_path protection
ALTER FUNCTION public.anonymize_customer_data(uuid) SET search_path = 'public';

-- export_user_data - add search_path protection
ALTER FUNCTION public.export_user_data() SET search_path = 'public';

-- generate_api_key - add search_path protection
ALTER FUNCTION public.generate_api_key(text, text[]) SET search_path = 'public';

-- generate_rma_number - add search_path protection  
ALTER FUNCTION public.generate_rma_number() SET search_path = 'public';

-- handle_new_user - add search_path protection
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';

-- is_token_revoked - add search_path protection
ALTER FUNCTION public.is_token_revoked(text) SET search_path = 'public';

-- unlock_stuck_import_jobs - add search_path protection
ALTER FUNCTION public.unlock_stuck_import_jobs() SET search_path = 'public';

-- validate_client_activity_log - add search_path protection (already has it in definition but ensure it's applied)
ALTER FUNCTION public.validate_client_activity_log() SET search_path = 'public';