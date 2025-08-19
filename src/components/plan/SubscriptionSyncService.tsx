import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export const SubscriptionSyncService = () => {
  const { user, refreshSubscription } = useAuth()

  useEffect(() => {
    // Sync subscription only once when user becomes available
    if (user) {
      const timer = setTimeout(() => {
        refreshSubscription()
      }, 2000) // Reduced delay
      
      return () => clearTimeout(timer)
    }
  }, [user]) // Remove refreshSubscription from dependencies to prevent infinite loop

  // This component doesn't render anything, it's just for syncing
  return null
}

export default SubscriptionSyncService