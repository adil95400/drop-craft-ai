
import { useEffect } from 'react'

export const SubscriptionSyncService = () => {
  // Component disabled to prevent infinite loops
  // Subscription sync is now handled directly in AuthContext
  
  useEffect(() => {
    console.log('SubscriptionSyncService: Component loaded but disabled')
  }, [])

  return null
}

export default SubscriptionSyncService
