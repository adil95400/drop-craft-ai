-- Corriger la fonction admin_update_user_plan pour utiliser le bon type plan_type
CREATE OR REPLACE FUNCTION public.admin_update_user_plan(target_user_id uuid, new_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  current_user_role TEXT;
BEGIN
  -- Vérifier si l'utilisateur actuel est admin via une requête directe
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Vérifier que le nouveau plan est valide
  IF new_plan NOT IN ('standard', 'pro', 'ultra_pro') THEN
    RAISE EXCEPTION 'Invalid plan: must be standard, pro, or ultra_pro';
  END IF;

  -- Mettre à jour le plan de l'utilisateur cible avec cast explicite vers plan_type
  UPDATE public.profiles 
  SET 
    plan = new_plan::plan_type,
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Vérifier si la mise à jour a réussi
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Retourner le résultat
  SELECT json_build_object(
    'success', true,
    'message', 'Plan updated successfully',
    'user_id', target_user_id,
    'new_plan', new_plan
  ) INTO result;

  RETURN result;
END;
$$;