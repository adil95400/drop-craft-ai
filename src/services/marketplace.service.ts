import { supabase } from '@/integrations/supabase/client'

export interface MarketplaceConnection {
  id: string
  user_id: string
  platform: string
  shop_url: string
  status: string
  is_active: boolean
  last_sync_at: string | null
  next_sync_at: string | null
  total_products_synced: number
  total_orders_synced: number
  total_sync_count: number
  failed_sync_count: number
  created_at: string
  updated_at: string
  credentials?: Record<string, any>
  config?: any
  api_key?: string
  api_secret?: string
  access_token?: string
}

export interface ConnectMarketplaceData {
  platform: string
  credentials: Record<string, any>
  shop_url?: string
  sync_settings?: Record<string, any>
}

export interface SyncResult {
  success: boolean
  products_synced?: number
  orders_synced?: number
  error?: string
}

class MarketplaceService {
  async getConnections(): Promise<MarketplaceConnection[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MarketplaceConnection[]
  }

  async getConnection(id: string): Promise<MarketplaceConnection | null> {
    const { data, error } = await supabase
      .from('marketplace_integrations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as MarketplaceConnection
  }

  async connectMarketplace(connectionData: ConnectMarketplaceData): Promise<MarketplaceConnection> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.functions.invoke('marketplace-connect', {
      body: {
        platform: connectionData.platform,
        credentials: connectionData.credentials,
        shop_url: connectionData.shop_url,
        sync_settings: connectionData.sync_settings
      }
    })

    if (error) throw error
    return data.integration
  }

  async syncMarketplace(connectionId: string, syncType: 'products' | 'orders' | 'full' = 'full'): Promise<SyncResult> {
    const { data, error } = await supabase.functions.invoke('marketplace-sync', {
      body: {
        integration_id: connectionId,
        sync_type: syncType
      }
    })

    if (error) throw error
    return data
  }

  async disconnectMarketplace(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_integrations')
      .update({ 
        is_active: false,
        status: 'disconnected'
      })
      .eq('id', connectionId)

    if (error) throw error
  }

  async updateConnection(connectionId: string, updates: any): Promise<void> {
    const { error } = await supabase
      .from('marketplace_integrations')
      .update(updates)
      .eq('id', connectionId)

    if (error) throw error
  }

  async getConnectionStats(connectionId: string) {
    const { data, error } = await supabase
      .from('marketplace_integrations')
      .select('total_products_synced, total_orders_synced, total_sync_count, failed_sync_count')
      .eq('id', connectionId)
      .single()

    if (error) throw error
    return data
  }

  async getAllStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('marketplace_integrations')
      .select('total_products_synced, total_orders_synced, total_sync_count, failed_sync_count, is_active')
      .eq('user_id', user.id)

    if (error) throw error

    const activeConnections = data?.filter(d => d.is_active).length || 0
    const totalProducts = data?.reduce((sum, d) => sum + (d.total_products_synced || 0), 0) || 0
    const totalOrders = data?.reduce((sum, d) => sum + (d.total_orders_synced || 0), 0) || 0
    const totalSyncs = data?.reduce((sum, d) => sum + (d.total_sync_count || 0), 0) || 0
    const failedSyncs = data?.reduce((sum, d) => sum + (d.failed_sync_count || 0), 0) || 0

    return {
      activeConnections,
      totalProducts,
      totalOrders,
      totalSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? ((totalSyncs - failedSyncs) / totalSyncs * 100).toFixed(1) : '0'
    }
  }
}

export const marketplaceService = new MarketplaceService()
