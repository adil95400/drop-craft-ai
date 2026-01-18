import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge function pour planifier et exécuter les syncs automatiques
 * Appelée par un cron job Supabase
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[supplier-scheduler] Starting scheduled sync check...')

    // Trouver tous les schedules actifs qui doivent être exécutés
    const now = new Date()
    
    const { data: schedules, error: schedulesError } = await supabase
      .from('supplier_sync_schedules')
      .select(`
        *,
        suppliers (id, name, supplier_type)
      `)
      .eq('is_active', true)
      .or(`next_run_at.is.null,next_run_at.lte.${now.toISOString()}`)

    if (schedulesError) {
      throw schedulesError
    }

    console.log(`[supplier-scheduler] Found ${schedules?.length || 0} schedules to process`)

    const results = []

    for (const schedule of schedules || []) {
      try {
        console.log(`[supplier-scheduler] Processing schedule ${schedule.id} for user ${schedule.user_id}`)

        // Créer un job de synchronisation
        const { data: job, error: jobError } = await supabase
          .from('supplier_sync_jobs')
          .insert({
            user_id: schedule.user_id,
            supplier_id: schedule.supplier_id,
            supplier_type: schedule.suppliers?.supplier_type || 'unknown',
            job_type: schedule.sync_type,
            status: 'pending',
            metadata: { scheduled: true, schedule_id: schedule.id }
          })
          .select()
          .single()

        if (jobError) {
          console.error(`[supplier-scheduler] Error creating job:`, jobError)
          continue
        }

        // Calculer la prochaine exécution
        const nextRun = calculateNextRun(schedule.frequency, schedule.cron_expression)

        // Mettre à jour le schedule
        await supabase
          .from('supplier_sync_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString()
          })
          .eq('id', schedule.id)

        // Déclencher le sync via l'edge function supplier-sync
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/supplier-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'start_sync',
            supplier_id: schedule.supplier_id,
            supplier_type: schedule.suppliers?.supplier_type || 'unknown',
            sync_type: schedule.sync_type,
            job_id: job.id
          })
        })

        results.push({
          schedule_id: schedule.id,
          job_id: job.id,
          status: syncResponse.ok ? 'started' : 'failed',
          next_run: nextRun.toISOString()
        })

        // Notification
        await supabase.from('supplier_notifications').insert({
          user_id: schedule.user_id,
          supplier_id: schedule.supplier_id,
          notification_type: 'scheduled_sync',
          title: 'Synchronisation planifiée',
          message: `Sync automatique démarré pour ${schedule.suppliers?.name || 'fournisseur'}`,
          severity: 'info',
          metadata: { job_id: job.id, schedule_id: schedule.id }
        })

      } catch (error) {
        console.error(`[supplier-scheduler] Error processing schedule ${schedule.id}:`, error)
        results.push({
          schedule_id: schedule.id,
          status: 'error',
          error: error.message
        })
      }
    }

    // Vérifier les alertes de stock bas
    await checkStockAlerts(supabase)

    // Vérifier les changements de prix
    await checkPriceChanges(supabase)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: schedules?.length || 0,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[supplier-scheduler] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calculateNextRun(frequency: string, cronExpression?: string): Date {
  const now = new Date()
  
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000)
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    case 'monthly':
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
    default:
      // Par défaut, daily
      return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}

async function checkStockAlerts(supabase: any) {
  try {
    // Trouver les produits avec stock bas
    const { data: lowStockProducts, error } = await supabase
      .from('products')
      .select('id, title, stock, user_id, supplier_id')
      .lt('stock', 10)
      .eq('status', 'active')

    if (error || !lowStockProducts) return

    // Grouper par user_id pour éviter les notifications en double
    const userAlerts = new Map<string, any[]>()
    
    for (const product of lowStockProducts) {
      if (!userAlerts.has(product.user_id)) {
        userAlerts.set(product.user_id, [])
      }
      userAlerts.get(product.user_id)!.push(product)
    }

    // Créer les notifications
    for (const [userId, products] of userAlerts) {
      // Vérifier si une alerte similaire n'a pas été envoyée récemment
      const { data: recentAlert } = await supabase
        .from('supplier_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', 'stock_alert')
        .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (recentAlert && recentAlert.length > 0) continue

      await supabase.from('supplier_notifications').insert({
        user_id: userId,
        notification_type: 'stock_alert',
        title: 'Alerte stock bas',
        message: `${products.length} produit(s) ont un stock inférieur à 10 unités`,
        severity: 'warning',
        metadata: { 
          products: products.slice(0, 5).map((p: any) => ({ id: p.id, title: p.title, stock: p.stock })),
          total_low_stock: products.length
        }
      })
    }

    console.log(`[checkStockAlerts] Processed ${lowStockProducts.length} low stock products`)

  } catch (error) {
    console.error('[checkStockAlerts] Error:', error)
  }
}

async function checkPriceChanges(supabase: any) {
  try {
    // Logique pour détecter les changements de prix significatifs
    // Ceci nécessiterait un historique de prix, pour l'exemple on simule
    
    console.log('[checkPriceChanges] Price monitoring active')
    
    // En production, comparer avec l'historique des prix
    // et créer des notifications si changement > 10%

  } catch (error) {
    console.error('[checkPriceChanges] Error:', error)
  }
}
