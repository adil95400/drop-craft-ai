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

      const { data, error } = await supabase.rpc('check_import_rate_limit', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes
      })

      if (error) {
        console.error('[RateLimiter] Error checking limit:', error)
        // En cas d'erreur, on autorise par défaut (fail-open)
        return true
      }

      const result = data as unknown as RateLimitResult

      if (!result.allowed) {
        const resetDate = new Date(result.reset_at)
        const minutesLeft = Math.ceil((resetDate.getTime() - Date.now()) / 60000)
        
        toast.error(
          `Limite d'imports atteinte`,
          {
            description: `Vous avez effectué ${result.current_count}/${result.max_requests} imports. Réessayez dans ${minutesLeft} minutes.`
          }
        )
      }

      return result.allowed
    } catch (error) {
      console.error('[RateLimiter] Unexpected error:', error)
      // En cas d'erreur, on autorise par défaut
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

      // Vérifier sans incrémenter en passant max_requests à un nombre très élevé
      const { data, error } = await supabase.rpc('check_import_rate_limit', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_max_requests: 999999,
        p_window_minutes: 60
      })

      if (error) {
        console.error('[RateLimiter] Error getting status:', error)
        return null
      }

      return data as unknown as RateLimitResult
    } catch (error) {
      console.error('[RateLimiter] Unexpected error:', error)
      return null
    }
  }
}
