import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

export const SubscriptionSyncService = () => {
  const { user } = useAuth()
  const { checkSubscription } = useStripeSubscription()

  useEffect(() => {
    // Sync subscription on app load si utilisateur authentifié (avec délai pour éviter conflicts)
    if (user) {
      const timer = setTimeout(() => {
        checkSubscription()
      }, 5000) // Délai de 5 secondes pour laisser l'auth se stabiliser
      
      return () => clearTimeout(timer)
    }
  }, [user, checkSubscription])

  // This component doesn't render anything, it's just for syncing
  return null
}

export default SubscriptionSyncService