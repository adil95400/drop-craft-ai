/**
 * Hook unifié pour les connexions canaux
 * READS: Supabase direct (realtime)
 * MUTATIONS: FastAPI via useApiStores (jobs en arrière-plan)
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useApiStores } from '@/hooks/api/useApiStores'
import { shopOptiApi } from '@/services/api/ShopOptiApiClient'

export interface ChannelConnection {
  id: string
  platform_type: string
  platform_name: string
  shop_domain?: string
  connection_status: 'connected' | 'error' | 'connecting' | 'disconnected'
  last_sync_at?: string
  products_synced: number
  orders_synced: number
  created_at: string
  auto_sync_enabled: boolean
  source: 'integrations' | 'sales_channels'
}

export interface ChannelStats {
  totalConnected: number
  totalProducts: number
  totalOrders: number
  storesCount: number
  marketplacesCount: number
  autoSyncCount: number
  errorsCount: number
}

export function useChannelConnections() {
  const queryClient = useQueryClient()
  const apiStores = useApiStores()

  // Fetch real data from both tables (READ via Supabase)
  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ['channel-connections-unified'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      
      // Fetch from integrations table
      const { data: integrations, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (intError) console.error('Integrations error:', intError)

      // Fetch from sales_channels table
      const { data: salesChannels, error: scError } = await supabase
        .from('sales_channels')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (scError) console.error('Sales channels error:', scError)

      // Try to get real product counts from FastAPI
      let storeStats: Record<string, { products: number; orders: number }> = {}
      try {
        const res = await shopOptiApi.getStores()
        if (res.success && res.data) {
          const storesData = Array.isArray(res.data) ? res.data : res.data.stores || []
          storesData.forEach((s: any) => {
            storeStats[s.id] = {
              products: s.products_count || s.products_synced || 0,
              orders: s.orders_count || s.orders_synced || 0,
            }
          })
        }
      } catch {
        // Fallback: use local data
      }

      // Fetch order count from local database
      let orderCount = 0
      if (userId) {
        const ordersResult = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
        orderCount = ordersResult.count || 0
      }

      // Map integrations
      const mappedIntegrations: ChannelConnection[] = (integrations || []).map(d => {
        const fastApiStats = storeStats[d.id]
        const isConnected = d.connection_status === 'connected'
        
        return {
          id: d.id,
          platform_type: d.platform?.toLowerCase() || 'unknown',
          platform_name: d.platform_name || d.platform || 'Unknown',
          shop_domain: d.store_url,
          connection_status: (d.connection_status as any) || 'disconnected',
          last_sync_at: d.last_sync_at,
          products_synced: fastApiStats?.products ?? (isConnected ? ((d as any).store_config?.last_products_synced || 0) : 0),
          orders_synced: fastApiStats?.orders ?? (isConnected ? Math.floor(orderCount / Math.max((integrations || []).filter(i => i.connection_status === 'connected').length, 1)) : 0),
          created_at: d.created_at || new Date().toISOString(),
          auto_sync_enabled: d.auto_sync_enabled || false,
          source: 'integrations' as const
        }
      })

      // Map sales_channels
      const mappedSalesChannels: ChannelConnection[] = (salesChannels || []).map(d => {
        let autoSyncEnabled = false
        if (d.sync_config && typeof d.sync_config === 'object' && !Array.isArray(d.sync_config)) {
          const config = d.sync_config as { auto_sync?: boolean }
          autoSyncEnabled = Boolean(config.auto_sync)
        }
        const fastApiStats = storeStats[d.id]
        
        return {
          id: d.id,
          platform_type: d.channel_type?.toLowerCase() || 'unknown',
          platform_name: d.name || d.channel_type || 'Unknown',
          shop_domain: d.name,
          connection_status: mapSalesChannelStatus(d.status),
          last_sync_at: d.last_sync_at,
          products_synced: fastApiStats?.products ?? (d.products_synced || 0),
          orders_synced: fastApiStats?.orders ?? (d.orders_synced || 0),
          created_at: d.created_at,
          auto_sync_enabled: autoSyncEnabled,
          source: 'sales_channels' as const
        }
      })

      // Deduplicate by id
      const allConnections = [...mappedIntegrations, ...mappedSalesChannels]
      const uniqueById = new Map<string, ChannelConnection>()
      allConnections.forEach(conn => {
        const existing = uniqueById.get(conn.id)
        if (!existing || conn.products_synced > (existing.products_synced || 0)) {
          uniqueById.set(conn.id, conn)
        }
      })

      return Array.from(uniqueById.values())
    },
    staleTime: 30000
  })

  // Compute stats from connections
  const stats: ChannelStats = {
    totalConnected: connections.filter(c => c.connection_status === 'connected').length,
    totalProducts: connections.reduce((sum, c) => sum + (c.products_synced || 0), 0),
    totalOrders: connections.reduce((sum, c) => sum + (c.orders_synced || 0), 0),
    storesCount: connections.filter(c => isStore(c.platform_type)).length,
    marketplacesCount: connections.filter(c => isMarketplace(c.platform_type)).length,
    autoSyncCount: connections.filter(c => c.auto_sync_enabled).length,
    errorsCount: connections.filter(c => c.connection_status === 'error').length
  }

  // Export channels data (client-side, no mock)
  const exportChannels = (connectionIds: string[]) => {
    const channelsToExport = connectionIds.length > 0 
      ? connections.filter(c => connectionIds.includes(c.id))
      : connections

    const data = channelsToExport.map(c => ({
      id: c.id,
      plateforme: c.platform_name,
      domaine: c.shop_domain || '',
      statut: c.connection_status,
      produits_synchronises: c.products_synced,
      commandes_synchronisees: c.orders_synced,
      derniere_sync: c.last_sync_at || 'Jamais',
      auto_sync: c.auto_sync_enabled ? 'Oui' : 'Non',
      date_creation: c.created_at
    }))

    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `canaux-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    toast.success(`${channelsToExport.length} canal(aux) exporté(s)`)
  }

  return {
    connections,
    stats,
    isLoading,
    error,
    // ALL MUTATIONS via FastAPI (no more Supabase direct writes)
    syncMutation: apiStores.syncStores,
    deleteMutation: apiStores.deleteStores,
    toggleAutoSyncMutation: apiStores.toggleAutoSync,
    exportChannels,
    // Flags
    isSyncing: apiStores.isSyncing,
    isDeleting: apiStores.isDeleting,
  }
}

// Helper functions
function mapSalesChannelStatus(status: string | null): ChannelConnection['connection_status'] {
  switch (status) {
    case 'active': return 'connected'
    case 'error': return 'error'
    case 'syncing': return 'connecting'
    default: return 'disconnected'
  }
}

const STORE_PLATFORMS = ['shopify', 'woocommerce', 'prestashop', 'magento', 'wix', 'squarespace', 'bigcommerce']
const MARKETPLACE_PLATFORMS = ['amazon', 'ebay', 'etsy', 'google', 'facebook', 'tiktok', 'cdiscount', 'fnac', 'rakuten', 'zalando']

function isStore(platform: string): boolean {
  return STORE_PLATFORMS.includes(platform?.toLowerCase() || '')
}

function isMarketplace(platform: string): boolean {
  return MARKETPLACE_PLATFORMS.includes(platform?.toLowerCase() || '')
}
