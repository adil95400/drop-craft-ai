import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non autorisé')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) throw new Error('Non autorisé')

    const { action, configId, configs, productIds } = await req.json()

    // Get or update configs
    if (action === 'get_configs') {
      const { data } = await supabase
        .from('ai_auto_action_configs')
        .select('*')
        .eq('user_id', user.id)
        .order('action_type')

      return new Response(JSON.stringify({ success: true, configs: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'save_configs') {
      for (const cfg of (configs || [])) {
        const { data: existing } = await supabase
          .from('ai_auto_action_configs')
          .select('id')
          .eq('user_id', user.id)
          .eq('action_type', cfg.action_type)
          .single()

        if (existing) {
          await supabase.from('ai_auto_action_configs')
            .update({
              is_enabled: cfg.is_enabled,
              threshold_score: cfg.threshold_score,
              scope: cfg.scope,
              max_daily_actions: cfg.max_daily_actions,
              config: cfg.config || {},
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('ai_auto_action_configs').insert({
            user_id: user.id,
            action_type: cfg.action_type,
            is_enabled: cfg.is_enabled,
            threshold_score: cfg.threshold_score,
            scope: cfg.scope,
            max_daily_actions: cfg.max_daily_actions,
            config: cfg.config || {},
          })
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'run_auto_actions') {
      // Get enabled configs
      const { data: enabledConfigs } = await supabase
        .from('ai_auto_action_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true)

      if (!enabledConfigs?.length) {
        return new Response(JSON.stringify({ success: true, message: 'Aucune action auto activée', applied: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch products to optimize
      let query = supabase.from('products').select('id, title, description, price, cost_price, seo_title, seo_description, tags, status, category, brand, bullet_points')
        .eq('user_id', user.id)

      if (productIds?.length) {
        query = query.in('id', productIds)
      }

      const scopeFilter = enabledConfigs[0]?.scope
      if (scopeFilter === 'draft') query = query.eq('status', 'draft')
      else if (scopeFilter === 'active') query = query.eq('status', 'active')

      const { data: products } = await query.limit(50)

      let totalApplied = 0
      const logs: any[] = []

      for (const config of enabledConfigs) {
        if (config.actions_today >= config.max_daily_actions) continue

        let actionsApplied = 0

        for (const product of (products || [])) {
          if (actionsApplied >= (config.max_daily_actions - config.actions_today)) break

          const result = await applyAutoAction(supabase, user.id, product, config)
          if (result) {
            logs.push(result)
            actionsApplied++
            totalApplied++
          }
        }

        // Update daily counter
        await supabase.from('ai_auto_action_configs')
          .update({ actions_today: (config.actions_today || 0) + actionsApplied, last_run_at: new Date().toISOString() })
          .eq('id', config.id)
      }

      // Insert logs
      if (logs.length > 0) {
        await supabase.from('ai_auto_action_logs').insert(logs)
      }

      return new Response(JSON.stringify({ success: true, applied: totalApplied, logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_logs') {
      const { data } = await supabase
        .from('ai_auto_action_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      return new Response(JSON.stringify({ success: true, logs: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'revert') {
      const { data: log } = await supabase
        .from('ai_auto_action_logs')
        .select('*')
        .eq('id', configId)
        .eq('user_id', user.id)
        .single()

      if (!log || !log.old_value || !log.field_name || !log.product_id) {
        throw new Error('Impossible de réverser cette action')
      }

      await supabase.from('products')
        .update({ [log.field_name]: log.old_value })
        .eq('id', log.product_id)
        .eq('user_id', user.id)

      await supabase.from('ai_auto_action_logs')
        .update({ status: 'reverted', reverted_at: new Date().toISOString() })
        .eq('id', log.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Action inconnue')
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function applyAutoAction(supabase: any, userId: string, product: any, config: any) {
  const actionType = config.action_type
  let oldValue: string | null = null
  let newValue: string | null = null
  let fieldName: string | null = null
  let confidence = 85

  switch (actionType) {
    case 'optimize_title': {
      if (!product.title || product.title.length >= 40) return null
      fieldName = 'title'
      oldValue = product.title
      // Simple optimization: add brand + category
      const parts = [product.brand, product.title, product.category].filter(Boolean)
      newValue = parts.join(' - ').substring(0, 150)
      if (newValue === oldValue) return null
      confidence = 80
      break
    }
    case 'optimize_description': {
      if (product.description && product.description.length >= 150) return null
      fieldName = 'description'
      oldValue = product.description || ''
      // Enrich short descriptions
      newValue = `${product.title || 'Produit'}. ${product.description || ''} Découvrez ce produit de qualité${product.brand ? ` de la marque ${product.brand}` : ''}${product.category ? ` dans la catégorie ${product.category}` : ''}.`.substring(0, 500)
      confidence = 75
      break
    }
    case 'generate_tags': {
      if (product.tags && Array.isArray(product.tags) && product.tags.length >= 3) return null
      fieldName = 'tags'
      oldValue = JSON.stringify(product.tags || [])
      const autoTags = [product.category, product.brand, ...(product.tags || [])].filter(Boolean)
      newValue = JSON.stringify([...new Set(autoTags)].slice(0, 10))
      if (newValue === oldValue) return null
      confidence = 85
      break
    }
    case 'fix_seo': {
      if (product.seo_title && product.seo_description) return null
      if (!product.seo_title) {
        fieldName = 'seo_title'
        oldValue = ''
        newValue = (product.title || 'Produit').substring(0, 60)
        confidence = 90
      } else {
        fieldName = 'seo_description'
        oldValue = ''
        newValue = (product.description || product.title || '').substring(0, 155)
        confidence = 85
      }
      break
    }
    default:
      return null
  }

  if (!fieldName || !newValue || newValue === oldValue) return null
  if (confidence < config.threshold_score) return null

  // Apply the change
  const updateData: Record<string, any> = {}
  if (fieldName === 'tags') {
    updateData[fieldName] = JSON.parse(newValue)
  } else {
    updateData[fieldName] = newValue
  }

  await supabase.from('products')
    .update(updateData)
    .eq('id', product.id)
    .eq('user_id', userId)

  return {
    user_id: userId,
    config_id: config.id,
    product_id: product.id,
    action_type: actionType,
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
    confidence_score: confidence,
    status: 'applied',
  }
}
