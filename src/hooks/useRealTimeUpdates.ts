import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOptimizedRealtime } from './useOptimizedRealtime'

interface UseRealTimeUpdatesProps {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onUpdate?: (payload: any) => void
  filter?: string
  showNotifications?: boolean // Opt-in for notifications
}

export function useRealTimeUpdates({
  table,
  event = '*',
  onUpdate,
  filter,
  showNotifications = false // Disabled by default to prevent spam
}: UseRealTimeUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter
        } as any,
        (payload) => {
          console.debug(`Real-time update on ${table}:`, payload.eventType)
          onUpdate?.(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.warn(`Failed to connect to real-time updates for ${table}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [table, event, filter, onUpdate, showNotifications])

  return { isConnected }
}

// Hook for import jobs real-time updates (optimized)
export function useImportJobUpdates(onJobUpdate?: (job: any) => void) {
  return useOptimizedRealtime({
    table: 'import_jobs',
    onUpdate: (payload) => {
      if (payload.new) {
        onJobUpdate?.(payload.new)
      }
    }
  })
}

// Hook for sync activity real-time updates (optimized)
export function useSyncActivityUpdates(onSyncUpdate?: (activity: any) => void) {
  return useOptimizedRealtime({
    table: 'activity_logs',
    filter: 'action.like.sync_%',
    onUpdate: (payload) => {
      if (payload.new) {
        onSyncUpdate?.(payload.new)
      }
    }
  })
}

// Hook for order updates (optimized)
export function useOrderUpdates(onOrderUpdate?: (order: any) => void) {
  return useOptimizedRealtime({
    table: 'orders',
    onUpdate: (payload) => {
      if (payload.new) {
        onOrderUpdate?.(payload.new)
      }
    }
  })
}

// Hook for product updates (optimized)
export function useProductUpdates(onProductUpdate?: (product: any) => void) {
  return useOptimizedRealtime({
    table: 'products',
    onUpdate: (payload) => {
      if (payload.new) {
        onProductUpdate?.(payload.new)
      }
    }
  })
}
