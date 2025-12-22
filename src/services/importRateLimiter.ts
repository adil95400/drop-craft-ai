import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface RateLimitResult {
  allowed: boolean
  current_count: number
  max_requests: number
  window_minutes: number
  reset_at: string
}

/**
 * Service de rate limiting pour les imports
 */
export const importRateLimiter = {
  /**
   * Vérifie si l'utilisateur peut effectuer un import
   */
  async checkLimit(
    actionType: string = 'import_start',
    maxRequests: number = 10,
    windowMinutes: number = 60
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Utilisateur non authentifié')
        return false
      }

      // Simulate rate limiting without RPC function
      // Count recent imports from activity_logs
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
      
      const { data: recentImports, error } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', actionType)
        .gte('created_at', windowStart)

      if (error) {
        console.error('[RateLimiter] Error checking limit:', error)
        return true
      }

      const currentCount = recentImports?.length || 0
      const allowed = currentCount < maxRequests

      if (!allowed) {
        const resetAt = new Date(Date.now() + windowMinutes * 60 * 1000)
        const minutesLeft = windowMinutes
        
        toast.error(
          `Limite d'imports atteinte`,
          {
            description: `Vous avez effectué ${currentCount}/${maxRequests} imports. Réessayez dans ${minutesLeft} minutes.`
          }
        )
      }

      return allowed

    } catch (error) {
      console.error('[RateLimiter] Unexpected error:', error)
      return true
    }
  },

  /**
   * Récupère le statut actuel du rate limit
   */
  async getStatus(actionType: string = 'import_start'): Promise<RateLimitResult | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const windowMinutes = 60
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
      
      const { data: recentImports, error } = await supabase
        .from('activity_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('action', actionType)
        .gte('created_at', windowStart)

      if (error) {
        console.error('[RateLimiter] Error getting status:', error)
        return null
      }

      const currentCount = recentImports?.length || 0

      return {
        allowed: currentCount < 10,
        current_count: currentCount,
        max_requests: 10,
        window_minutes: windowMinutes,
        reset_at: new Date(Date.now() + windowMinutes * 60 * 1000).toISOString()
      }
    } catch (error) {
      console.error('[RateLimiter] Unexpected error:', error)
      return null
    }
  }
}
