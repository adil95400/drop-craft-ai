/**
 * Hook for Command Center real-time connection status
 * Provides live updates indicators for the dashboard
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { RealtimeChannel } from '@supabase/supabase-js'

interface CommandCenterMetrics {
  productsUpdated: number
  ordersCreated: number
  stockChanges: number
  lastUpdate: Date | null
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface UseCommandCenterRealtimeOptions {
  enabled?: boolean
  refreshInterval?: number
}

export function useCommandCenterRealtime(options: UseCommandCenterRealtimeOptions = {}) {
  const { enabled = true, refreshInterval = 30000 } = options
  const { user } = useAuth()
  
  const [metrics, setMetrics] = useState<CommandCenterMetrics>({
    productsUpdated: 0,
    ordersCreated: 0,
    stockChanges: 0,
    lastUpdate: null
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      productsUpdated: 0,
      ordersCreated: 0,
      stockChanges: 0,
      lastUpdate: new Date()
    })
  }, [])
  
  // Increment a specific metric
  const incrementMetric = useCallback((key: keyof Omit<CommandCenterMetrics, 'lastUpdate'>) => {
    setMetrics(prev => ({
      ...prev,
      [key]: prev[key] + 1,
      lastUpdate: new Date()
    }))
  }, [])
  
  // Setup realtime subscription
  useEffect(() => {
    if (!enabled || !user?.id) return
    
    setConnectionStatus('connecting')
    
    // Create a channel for user-specific updates
    const channel = supabase
      .channel(`cmd-center-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[CommandCenterRealtime] Product change:', payload.eventType)
          if (payload.eventType === 'UPDATE') {
            incrementMetric('productsUpdated')
            
            // Check for stock changes
            const oldStock = (payload.old as any)?.stock_quantity
            const newStock = (payload.new as any)?.stock_quantity
            if (oldStock !== undefined && newStock !== undefined && oldStock !== newStock) {
              incrementMetric('stockChanges')
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('[CommandCenterRealtime] New order created')
          incrementMetric('ordersCreated')
        }
      )
      .subscribe((status) => {
        console.log('[CommandCenterRealtime] Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionStatus('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionStatus('disconnected')
        }
      })
    
    channelRef.current = channel
    
    // Periodic refresh for connection health
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        lastUpdate: new Date()
      }))
    }, refreshInterval)
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [enabled, user?.id, refreshInterval, incrementMetric])
  
  return {
    metrics,
    isConnected,
    connectionStatus,
    resetMetrics
  }
}

// Lightweight hook for connection status indicator
export function useNetworkStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('offline')
  
  useEffect(() => {
    const handleOnline = () => setStatus('online')
    const handleOffline = () => setStatus('offline')
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial check
    setStatus(navigator.onLine ? 'online' : 'offline')
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return status
}
