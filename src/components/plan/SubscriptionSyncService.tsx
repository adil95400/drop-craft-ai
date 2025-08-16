import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export const SubscriptionSyncService = () => {
  const { user, refreshSubscription } = useAuth()

  useEffect(() => {
    // Sync subscription on app load si utilisateur authentifié (avec délai pour éviter conflicts)
    if (user) {
      const timer = setTimeout(() => {
        refreshSubscription()
      }, 5000) // Délai de 5 secondes pour laisser l'auth se stabiliser
      
      return () => clearTimeout(timer)
    }
  }, [user, refreshSubscription])

  // This component doesn't render anything, it's just for syncing
  return null
}

export default SubscriptionSyncService