import { supabase } from '@/integrations/supabase/client'
import { fromTable } from '@/integrations/supabase/typedClient'

export interface TikTokShopProduct {
  product_id: string
  title: string
  description: string
  price: number
  currency: string
  images: string[]
  sku: string
  stock: number
  category_id?: string
}

export interface TikTokPublishOptions {
  auto_sync_inventory?: boolean
  auto_sync_price?: boolean
  promote_in_live?: boolean
  enable_discount?: boolean
}

export class TikTokShopService {
  private static instance: TikTokShopService

  private constructor() {}

  static getInstance(): TikTokShopService {
    if (!TikTokShopService.instance) {
      TikTokShopService.instance = new TikTokShopService()
    }
    return TikTokShopService.instance
  }

  async publishProduct(
    integrationId: string,
    productId: string,
    options: TikTokPublishOptions = {}
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'publish_product',
          integration_id: integrationId,
          product_id: productId,
          options,
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('TikTok Shop publish error:', error)
      throw new Error(`Failed to publish to TikTok Shop: ${error.message}`)
    }
  }

  async publishBulkProducts(
    integrationId: string,
    productIds: string[],
    options: TikTokPublishOptions = {}
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'publish_bulk',
          integration_id: integrationId,
          product_ids: productIds,
          options,
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('TikTok Shop bulk publish error:', error)
      throw new Error(`Failed to publish products: ${error.message}`)
    }
  }

  async syncProducts(integrationId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'sync_products',
          integration_id: integrationId,
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('TikTok Shop sync products error:', error)
      throw new Error(`Failed to sync products: ${error.message}`)
    }
  }

  async syncOrders(integrationId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'sync_orders',
          integration_id: integrationId,
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('TikTok Shop sync orders error:', error)
      throw new Error(`Failed to sync orders: ${error.message}`)
    }
  }

  async updateInventory(integrationId: string, productId: string, quantity: number) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'update_inventory',
          integration_id: integrationId,
          product_id: productId,
          quantity,
        },
      })

      if (error) throw error
      return data
    } catch (error: any) {
      console.error('TikTok Shop inventory update error:', error)
      throw new Error(`Failed to update inventory: ${error.message}`)
    }
  }

  async getCategories(integrationId: string) {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
        body: {
          action: 'get_categories',
          integration_id: integrationId,
        },
      })

      if (error) throw error
      return data.categories || []
    } catch (error: any) {
      console.error('TikTok Shop categories error:', error)
      throw new Error(`Failed to get categories: ${error.message}`)
    }
  }

  async getIntegrationStats(integrationId: string) {
    try {
      const { data: published } = await fromTable('published_products')
        .select('*')
        .eq('marketplace_id', integrationId)
        .eq('platform', 'tiktok_shop')

      const { data: orders } = await fromTable('orders')
        .select('*')
        .eq('platform', 'tiktok_shop')
        .gte('order_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0

      return {
        total_products: published?.length || 0,
        active_products: published?.filter(p => p.status === 'active').length || 0,
        total_orders: orders?.length || 0,
        total_revenue: totalRevenue,
        avg_order_value: avgOrderValue,
      }
    } catch (error: any) {
      console.error('TikTok Shop stats error:', error)
      return {
        total_products: 0,
        active_products: 0,
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
      }
    }
  }
}

export const tiktokShopService = TikTokShopService.getInstance()
