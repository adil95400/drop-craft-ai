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

    const { data, error } = await (supabase.from('integrations') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'marketplace')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map((item: any) => this.mapToMarketplaceConnection(item))
  }

  async getConnection(id: string): Promise<MarketplaceConnection | null> {
    const { data, error } = await (supabase.from('integrations') as any)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? this.mapToMarketplaceConnection(data) : null
  }
  
  private mapToMarketplaceConnection(item: any): MarketplaceConnection {
    return {
      id: item.id,
      user_id: item.user_id,
      platform: item.platform || 'unknown',
      shop_url: item.store_url || '',
      status: item.connection_status || 'disconnected',
      is_active: item.is_active || false,
      last_sync_at: item.last_sync_at,
      next_sync_at: null,
      total_products_synced: 0,
      total_orders_synced: 0,
      total_sync_count: 0,
      failed_sync_count: 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
      config: item.config
    }
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
    const { error } = await (supabase.from('integrations') as any)
      .update({ 
        is_active: false,
        connection_status: 'disconnected'
      })
      .eq('id', connectionId)

    if (error) throw error
  }

  async updateConnection(connectionId: string, updates: any): Promise<void> {
    const { error } = await (supabase.from('integrations') as any)
      .update(updates)
      .eq('id', connectionId)

    if (error) throw error
  }

  async getConnectionStats(connectionId: string) {
    const { data, error } = await (supabase.from('integrations') as any)
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error) throw error
    return {
      total_products_synced: 0,
      total_orders_synced: 0,
      total_sync_count: 0,
      failed_sync_count: 0
    }
  }

  async getAllStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await (supabase.from('integrations') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'marketplace')

    if (error) throw error

    const activeConnections = data?.filter((d: any) => d.is_active).length || 0

    return {
      activeConnections,
      totalProducts: 0,
      totalOrders: 0,
      totalSyncs: 0,
      failedSyncs: 0,
      successRate: '0'
    }
  }

  async testConnection(platform: string, credentials: Record<string, any>): Promise<{ success: boolean; message?: string; error?: string; details?: string }> {
    const { data, error } = await supabase.functions.invoke('test-marketplace-connection', {
      body: {
        platform,
        credentials
      }
    })

    if (error) throw error
    return data
  }
}

export const marketplaceService = new MarketplaceService()
