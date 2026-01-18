/**
 * Hook unifié pour les connexions canaux
 * Fusionne integrations + sales_channels et récupère les vraies statistiques
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

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

  // Fetch real data from both tables
  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ['channel-connections-unified'],
    queryFn: async () => {
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

      // Map integrations
      const mappedIntegrations: ChannelConnection[] = (integrations || []).map(d => ({
        id: d.id,
        platform_type: d.platform?.toLowerCase() || 'unknown',
        platform_name: d.platform_name || d.platform || 'Unknown',
        shop_domain: d.store_url,
        connection_status: (d.connection_status as any) || 'disconnected',
        last_sync_at: d.last_sync_at,
        products_synced: 0,
        orders_synced: 0,
        created_at: d.created_at || new Date().toISOString(),
        auto_sync_enabled: d.auto_sync_enabled || false,
        source: 'integrations' as const
      }))

      // Map sales_channels
      const mappedSalesChannels: ChannelConnection[] = (salesChannels || []).map(d => {
        // Parse sync_config safely
        const syncConfig = typeof d.sync_config === 'object' && d.sync_config !== null 
          ? d.sync_config as Record<string, unknown>
          : {}
        
        return {
          id: d.id,
          platform_type: d.channel_type?.toLowerCase() || 'unknown',
          platform_name: d.name || d.channel_type || 'Unknown',
          shop_domain: d.name,
          connection_status: mapSalesChannelStatus(d.status),
          last_sync_at: d.last_sync_at,
          products_synced: d.products_synced || 0,
          orders_synced: d.orders_synced || 0,
          created_at: d.created_at,
          auto_sync_enabled: Boolean(syncConfig.auto_sync),
          source: 'sales_channels' as const
        }
      })

      // Deduplicate by platform (prefer sales_channels if has more data)
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

  // Fetch real stats from database
  const { data: realStats } = useQuery({
    queryKey: ['channel-real-stats'],
    queryFn: async () => {
      const [productsResult, ordersResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
      ])

      return {
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0
      }
    },
    staleTime: 60000
  })

  // Calculate stats
  const stats: ChannelStats = {
    totalConnected: connections.filter(c => c.connection_status === 'connected').length,
    totalProducts: realStats?.totalProducts || 0,
    totalOrders: realStats?.totalOrders || 0,
    storesCount: connections.filter(c => isStore(c.platform_type)).length,
    marketplacesCount: connections.filter(c => isMarketplace(c.platform_type)).length,
    autoSyncCount: connections.filter(c => c.auto_sync_enabled).length,
    errorsCount: connections.filter(c => c.connection_status === 'error').length
  }

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (connectionIds: string[]) => {
      const connection = connections.find(c => connectionIds.includes(c.id))
      if (!connection) return

      if (connection.source === 'integrations') {
        await supabase.from('integrations').update({ 
          connection_status: 'connecting',
          last_sync_at: new Date().toISOString()
        }).eq('id', connection.id)

        // Simulate sync completion
        await new Promise(resolve => setTimeout(resolve, 2000))

        await supabase.from('integrations').update({ 
          connection_status: 'connected'
        }).eq('id', connection.id)
      } else {
        await supabase.from('sales_channels').update({ 
          status: 'syncing',
          last_sync_at: new Date().toISOString()
        }).eq('id', connection.id)

        await new Promise(resolve => setTimeout(resolve, 2000))

        await supabase.from('sales_channels').update({ 
          status: 'active'
        }).eq('id', connection.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-connections-unified'] })
      queryClient.invalidateQueries({ queryKey: ['channel-activity'] })
      toast.success('Synchronisation terminée')
    },
    onError: (error) => {
      toast.error(`Erreur de synchronisation: ${error.message}`)
    }
  })

  return {
    connections,
    stats,
    isLoading,
    error,
    syncMutation
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
