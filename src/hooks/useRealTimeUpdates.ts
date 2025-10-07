import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useOptimizedRealtime } from './useOptimizedRealtime'

interface UseRealTimeUpdatesProps {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onUpdate?: (payload: any) => void
  filter?: string
}

export function useRealTimeUpdates({
  table,
  event = '*',
  onUpdate,
  filter
}: UseRealTimeUpdatesProps) {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter
        } as any,
        (payload) => {
          console.log(`Real-time update on ${table}:`, payload)
          
          // Show notification for important updates
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nouveau élément ajouté",
              description: `Un nouvel élément a été ajouté à ${table}`,
            })
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Élément mis à jour",
              description: `Un élément de ${table} a été modifié`,
            })
          }
          
          onUpdate?.(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          console.log(`Connected to real-time updates for ${table}`)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.error(`Failed to connect to real-time updates for ${table}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [table, event, filter, onUpdate, toast])

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
    table: 'imported_products',
    onUpdate: (payload) => {
      if (payload.new) {
        onProductUpdate?.(payload.new)
      }
    }
  })
}