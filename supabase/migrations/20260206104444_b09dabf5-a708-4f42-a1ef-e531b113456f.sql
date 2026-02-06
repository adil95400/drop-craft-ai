
-- Fonctions pour le système de consommation

-- 1. Fonction pour logger la consommation et vérifier les alertes
CREATE OR REPLACE FUNCTION log_consumption_and_check_alerts(
    p_user_id UUID,
    p_quota_key TEXT,
    p_action_type TEXT,
    p_action_detail JSONB DEFAULT '{}',
    p_tokens_used INTEGER DEFAULT 0,
    p_cost_estimate DECIMAL DEFAULT 0,
    p_source TEXT DEFAULT 'web'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_usage INTEGER;
    v_limit_value INTEGER;
    v_percentage_remaining DECIMAL;
    v_alert_needed TEXT := NULL;
    v_result JSONB;
BEGIN
    -- Log the consumption
    INSERT INTO consumption_logs (user_id, quota_key, action_type, action_detail, tokens_used, cost_estimate, source)
    VALUES (p_user_id, p_quota_key, p_action_type, p_action_detail, p_tokens_used, p_cost_estimate, p_source);
    
    -- Get current quota status
    SELECT qu.current_usage, pl.limit_value
    INTO v_current_usage, v_limit_value
    FROM quota_usage qu
    JOIN profiles pr ON pr.id = qu.user_id
    JOIN plan_limits pl ON pl.plan_name = pr.subscription_plan AND pl.limit_key = p_quota_key
    WHERE qu.user_id = p_user_id AND qu.quota_key = p_quota_key;
    
    -- Default values if not found
    v_current_usage := COALESCE(v_current_usage, 0);
    v_limit_value := COALESCE(v_limit_value, 0);
    
    -- Check if alert is needed (only if not unlimited)
    IF v_limit_value > 0 THEN
        v_percentage_remaining := ((v_limit_value - v_current_usage)::DECIMAL / v_limit_value) * 100;
        
        -- Determine alert type
        IF v_current_usage >= v_limit_value THEN
            v_alert_needed := 'exhausted';
        ELSIF v_percentage_remaining <= 5 THEN
            v_alert_needed := 'warning_5';
        ELSIF v_percentage_remaining <= 10 THEN
            v_alert_needed := 'warning_10';
        END IF;
        
        -- Create alert if needed (unique per day)
        IF v_alert_needed IS NOT NULL THEN
            INSERT INTO consumption_alerts (
                user_id, quota_key, alert_type, threshold_percent,
                current_usage, limit_value, message, alert_date
            )
            VALUES (
                p_user_id, p_quota_key, v_alert_needed,
                CASE v_alert_needed 
                    WHEN 'exhausted' THEN 0 
                    WHEN 'warning_5' THEN 5 
                    ELSE 10 
                END,
                v_current_usage, v_limit_value,
                CASE v_alert_needed
                    WHEN 'exhausted' THEN 'Quota épuisé pour ' || p_quota_key
                    WHEN 'warning_5' THEN 'Attention: seulement 5% restant pour ' || p_quota_key
                    ELSE 'Alerte: 10% restant pour ' || p_quota_key
                END,
                CURRENT_DATE
            )
            ON CONFLICT (user_id, quota_key, alert_type, alert_date) DO NOTHING;
        END IF;
    END IF;
    
    v_result := jsonb_build_object(
        'logged', true,
        'current_usage', v_current_usage,
        'limit', v_limit_value,
        'percentage_remaining', COALESCE(v_percentage_remaining, 100),
        'alert_triggered', v_alert_needed
    );
    
    RETURN v_result;
END;
$$;

-- 2. Fonction pour récupérer les stats de consommation détaillées
CREATE OR REPLACE FUNCTION get_user_consumption_stats(
    p_user_id UUID,
    p_period TEXT DEFAULT 'month'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    v_start_date := CASE p_period
        WHEN 'day' THEN now() - INTERVAL '1 day'
        WHEN 'week' THEN now() - INTERVAL '7 days'
        ELSE now() - INTERVAL '30 days'
    END;
    
    SELECT jsonb_build_object(
        'period', p_period,
        'start_date', v_start_date,
        'end_date', now(),
        'by_quota_key', (
            SELECT COALESCE(jsonb_object_agg(quota_key, stats), '{}'::jsonb)
            FROM (
                SELECT 
                    quota_key,
                    jsonb_build_object(
                        'total_actions', COUNT(*),
                        'total_tokens', COALESCE(SUM(tokens_used), 0),
                        'total_cost', COALESCE(SUM(cost_estimate), 0)
                    ) as stats
                FROM consumption_logs
                WHERE user_id = p_user_id AND created_at >= v_start_date
                GROUP BY quota_key
            ) sub
        ),
        'by_source', (
            SELECT COALESCE(jsonb_object_agg(source, count), '{}'::jsonb)
            FROM (
                SELECT source, COUNT(*) as count
                FROM consumption_logs
                WHERE user_id = p_user_id AND created_at >= v_start_date
                GROUP BY source
            ) sub
        ),
        'by_day', (
            SELECT COALESCE(jsonb_agg(day_stats ORDER BY day), '[]'::jsonb)
            FROM (
                SELECT 
                    DATE(created_at) as day,
                    jsonb_build_object(
                        'date', DATE(created_at),
                        'actions', COUNT(*),
                        'tokens', COALESCE(SUM(tokens_used), 0),
                        'cost', COALESCE(SUM(cost_estimate), 0)
                    ) as day_stats
                FROM consumption_logs
                WHERE user_id = p_user_id AND created_at >= v_start_date
                GROUP BY DATE(created_at)
            ) sub
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 3. Fonction admin pour récupérer tous les utilisateurs avec leur consommation
CREATE OR REPLACE FUNCTION admin_get_all_users_consumption()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(user_data)
    INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'user_id', p.id,
            'email', p.email,
            'full_name', p.full_name,
            'company_name', p.company_name,
            'plan', COALESCE(p.subscription_plan, 'free'),
            'created_at', p.created_at,
            'last_login_at', p.last_login_at,
            'quotas', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'key', pl.limit_key,
                        'limit', pl.limit_value,
                        'current', COALESCE(qu.current_usage, 0),
                        'percentage', CASE 
                            WHEN pl.limit_value <= 0 THEN 0
                            ELSE ROUND((COALESCE(qu.current_usage, 0)::DECIMAL / pl.limit_value) * 100, 1)
                        END,
                        'status', CASE
                            WHEN pl.limit_value = -1 THEN 'unlimited'
                            WHEN COALESCE(qu.current_usage, 0) >= pl.limit_value THEN 'exhausted'
                            WHEN pl.limit_value > 0 AND (pl.limit_value - COALESCE(qu.current_usage, 0))::DECIMAL / pl.limit_value <= 0.1 THEN 'warning'
                            ELSE 'ok'
                        END
                    )
                ), '[]'::jsonb)
                FROM plan_limits pl
                LEFT JOIN quota_usage qu ON qu.user_id = p.id AND qu.quota_key = pl.limit_key
                WHERE pl.plan_name = COALESCE(p.subscription_plan, 'free')
            ),
            'unread_alerts', (
                SELECT COUNT(*) FROM consumption_alerts ca 
                WHERE ca.user_id = p.id AND ca.is_read = false
            ),
            'addons', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'quota_key', qa.quota_key,
                        'credits', qa.additional_credits,
                        'expires_at', qa.expires_at
                    )
                ), '[]'::jsonb)
                FROM quota_addons qa
                WHERE qa.user_id = p.id AND qa.is_active = true
            )
        ) as user_data
        FROM profiles p
        ORDER BY p.created_at DESC
    ) sub;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 4. Fonction pour obtenir les statistiques globales admin
CREATE OR REPLACE FUNCTION admin_get_consumption_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'users_by_plan', (
            SELECT COALESCE(jsonb_object_agg(plan, count), '{}'::jsonb)
            FROM (
                SELECT COALESCE(subscription_plan, 'free') as plan, COUNT(*) as count
                FROM profiles
                GROUP BY subscription_plan
            ) sub
        ),
        'users_at_limit', (
            SELECT COUNT(DISTINCT user_id) 
            FROM consumption_alerts 
            WHERE alert_type = 'exhausted' 
            AND created_at >= now() - INTERVAL '24 hours'
        ),
        'users_near_limit', (
            SELECT COUNT(DISTINCT user_id) 
            FROM consumption_alerts 
            WHERE alert_type IN ('warning_5', 'warning_10') 
            AND created_at >= now() - INTERVAL '24 hours'
        ),
        'total_consumption_today', (
            SELECT jsonb_build_object(
                'actions', COUNT(*),
                'tokens', COALESCE(SUM(tokens_used), 0),
                'cost', COALESCE(SUM(cost_estimate), 0)
            )
            FROM consumption_logs
            WHERE created_at >= CURRENT_DATE
        ),
        'consumption_by_quota', (
            SELECT COALESCE(jsonb_object_agg(quota_key, stats), '{}'::jsonb)
            FROM (
                SELECT quota_key, jsonb_build_object(
                    'today', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
                    'week', COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days'),
                    'month', COUNT(*)
                ) as stats
                FROM consumption_logs
                WHERE created_at >= now() - INTERVAL '30 days'
                GROUP BY quota_key
            ) sub
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;
