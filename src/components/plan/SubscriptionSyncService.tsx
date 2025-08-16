import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useStripeSubscription } from '@/hooks/useStripeSubscription'

export const SubscriptionSyncService = () => {
  const { user } = useAuth()
  const { checkSubscription } = useStripeSubscription()

  useEffect(() => {
    // Sync subscription on app load if user is authenticated
    if (user) {
      checkSubscription()
    }
  }, [user, checkSubscription])

  // This component doesn't render anything, it's just for syncing
  return null
}

export default SubscriptionSyncService