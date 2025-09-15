// Export central des composants Marketplace
export { MarketplaceHub } from './components/MarketplaceHub'

// Types
export interface Marketplace {
  id: string
  name: string
  logo: string
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync: string
  products: number
  orders: number
  revenue: number
  syncEnabled: boolean
  features: string[]
  connection: {
    apiKey?: string
    storeId?: string
    region?: string
  }
}

export interface SyncStats {
  totalProducts: number
  syncedProducts: number
  pendingSync: number
  errors: number
  lastUpdate: string
}