/**
 * Hook pour gérer les webhooks en temps réel des canaux
 * Écoute les événements Supabase Realtime pour les mises à jour
 */

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { RealtimeChannel } from '@supabase/supabase-js'

interface WebhookEvent {
  id: string
  type: 'product_created' | 'product_updated' | 'product_deleted' | 
        'order_created' | 'order_updated' | 'inventory_updated' | 
        'sync_started' | 'sync_completed' | 'sync_error'
  channel_id: string
  platform: string
  data: Record<string, any>
  created_at: string
}

interface UseChannelWebhooksOptions {
  channelId?: string
  onProductChange?: (event: WebhookEvent) => void
  onOrderChange?: (event: WebhookEvent) => void
  onInventoryChange?: (event: WebhookEvent) => void
  onSyncChange?: (event: WebhookEvent) => void
  enableNotifications?: boolean
}

export function useChannelWebhooks({
  channelId,
  onProductChange,
  onOrderChange,
  onInventoryChange,
  onSyncChange,
  enableNotifications = true,
}: UseChannelWebhooksOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebhookEvent | null>(null)
  const [eventCount, setEventCount] = useState(0)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Handle incoming webhook events
  const handleWebhookEvent = useCallback((event: WebhookEvent) => {
    setLastEvent(event)
    setEventCount(prev => prev + 1)

    // Route to appropriate handler
    if (event.type.startsWith('product_')) {
      onProductChange?.(event)
      queryClient.invalidateQueries({ queryKey: ['channel-products', event.channel_id] })
      queryClient.invalidateQueries({ queryKey: ['channel-product-count', event.channel_id] })
    } else if (event.type.startsWith('order_')) {
      onOrderChange?.(event)
      queryClient.invalidateQueries({ queryKey: ['channel-orders', event.channel_id] })
    } else if (event.type === 'inventory_updated') {
      onInventoryChange?.(event)
      queryClient.invalidateQueries({ queryKey: ['channel-products', event.channel_id] })
    } else if (event.type.startsWith('sync_')) {
      onSyncChange?.(event)
      queryClient.invalidateQueries({ queryKey: ['channel', event.channel_id] })
    }

    // Show notification
    if (enableNotifications) {
      const notifications: Record<string, { title: string; description: string }> = {
        product_created: { 
          title: 'Nouveau produit', 
          description: `${event.data.title || 'Un produit'} a été ajouté` 
        },
        product_updated: { 
          title: 'Produit mis à jour', 
          description: `${event.data.title || 'Un produit'} a été modifié` 
        },
        product_deleted: { 
          title: 'Produit supprimé', 
          description: `${event.data.title || 'Un produit'} a été supprimé` 
        },
        order_created: { 
          title: 'Nouvelle commande', 
          description: `Commande #${event.data.order_number || event.data.id}` 
        },
        order_updated: { 
          title: 'Commande mise à jour', 
          description: `Commande #${event.data.order_number || event.data.id}` 
        },
        inventory_updated: { 
          title: 'Stock mis à jour', 
          description: `${event.data.products_updated || 0} produit(s) affecté(s)` 
        },
        sync_started: { 
          title: 'Synchronisation démarrée', 
          description: `${event.platform} en cours de sync...` 
        },
        sync_completed: { 
          title: 'Synchronisation terminée', 
          description: `${event.data.products_synced || 0} produits synchronisés` 
        },
        sync_error: { 
          title: 'Erreur de synchronisation', 
          description: event.data.error || 'Une erreur est survenue' 
        },
      }

      const notification = notifications[event.type]
      if (notification) {
        toast({
          title: notification.title,
          description: notification.description,
          variant: event.type === 'sync_error' ? 'destructive' : 'default',
        })
      }
    }
  }, [onProductChange, onOrderChange, onInventoryChange, onSyncChange, queryClient, toast, enableNotifications])

  // Subscribe to realtime updates
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      // Subscribe to integrations table changes
      channel = supabase
        .channel('channel-webhooks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'integrations',
            filter: channelId ? `id=eq.${channelId}` : undefined,
          },
          (payload) => {
            const eventType = payload.eventType === 'INSERT' ? 'sync_started' 
              : payload.eventType === 'UPDATE' 
                ? (payload.new as any).connection_status === 'connected' ? 'sync_completed' : 'sync_started'
                : 'sync_error'
            
            handleWebhookEvent({
              id: `event-${Date.now()}`,
              type: eventType as WebhookEvent['type'],
              channel_id: (payload.new as any)?.id || channelId || '',
              platform: (payload.new as any)?.platform_name || 'Unknown',
              data: payload.new as Record<string, any>,
              created_at: new Date().toISOString(),
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopify_products',
            filter: channelId ? `store_integration_id=eq.${channelId}` : undefined,
          },
          (payload) => {
            const eventType = payload.eventType === 'INSERT' ? 'product_created'
              : payload.eventType === 'UPDATE' ? 'product_updated'
              : 'product_deleted'
            
            handleWebhookEvent({
              id: `event-${Date.now()}`,
              type: eventType as WebhookEvent['type'],
              channel_id: (payload.new as any)?.store_integration_id || channelId || '',
              platform: 'Shopify',
              data: (payload.new || payload.old) as Record<string, any>,
              created_at: new Date().toISOString(),
            })
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [channelId, handleWebhookEvent])

  // Manual event trigger for testing
  const triggerTestEvent = useCallback((type: WebhookEvent['type']) => {
    handleWebhookEvent({
      id: `test-${Date.now()}`,
      type,
      channel_id: channelId || 'test',
      platform: 'Test',
      data: { title: 'Test Product', order_number: '1234' },
      created_at: new Date().toISOString(),
    })
  }, [channelId, handleWebhookEvent])

  return {
    isConnected,
    lastEvent,
    eventCount,
    triggerTestEvent,
  }
}
