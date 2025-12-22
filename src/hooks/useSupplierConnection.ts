import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface SupplierConnectionStatus {
  supplierId: string
  isConnected: boolean
  connectionStatus: 'active' | 'inactive' | 'error' | 'pending'
  lastSyncAt?: string
}

export function useSupplierConnection() {
  const [connectedSuppliers, setConnectedSuppliers] = useState<Map<string, SupplierConnectionStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const queryClient = useQueryClient()

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use premium_supplier_connections table instead
      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select('premium_supplier_id, connection_status, last_sync_at')
        .eq('user_id', user.id)
      
      if (error) throw error

      const connections = new Map<string, SupplierConnectionStatus>()
      data?.forEach(cred => {
        if (cred.premium_supplier_id) {
          connections.set(cred.premium_supplier_id, {
            supplierId: cred.premium_supplier_id,
            isConnected: cred.connection_status === 'active' || cred.connection_status === 'connected',
            connectionStatus: (cred.connection_status || 'inactive') as any,
            lastSyncAt: cred.last_sync_at || undefined
          })
        }
      })
      
      setConnectedSuppliers(connections)
    } catch (error) {
      console.error('Error loading connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('supplier_connections')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'premium_supplier_connections'
      }, () => {
        loadConnections()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const connectSupplier = async (supplierId: string, supplierName: string, apiKey?: string) => {
    setIsConnecting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Try to use the edge function first
      const { data, error } = await supabase.functions.invoke('supplier-connect-advanced', {
        body: { 
          supplier_id: supplierId,
          supplier_name: supplierName,
          api_key: apiKey,
          connection_method: apiKey ? 'api' : 'marketplace'
        }
      })

      if (error) {
        // Fallback to direct insert if edge function fails
        const { error: insertError } = await supabase
          .from('premium_supplier_connections')
          .insert({
            user_id: user.id,
            premium_supplier_id: supplierId,
            connection_status: 'connected',
            credentials_encrypted: apiKey || null,
            sync_enabled: true
          })
        
        if (insertError) throw insertError
      }

      // Update local state
      const newConnections = new Map(connectedSuppliers)
      newConnections.set(supplierId, {
        supplierId,
        isConnected: true,
        connectionStatus: 'active',
        lastSyncAt: new Date().toISOString()
      })
      setConnectedSuppliers(newConnections)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-suppliers'] })

      toast.success(`${supplierName} connecté avec succès`)
      return { success: true }
    } catch (error: any) {
      console.error('Error connecting supplier:', error)
      toast.error(error.message || 'Erreur de connexion')
      return { success: false, error }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectSupplier = async (supplierId: string) => {
    setIsDisconnecting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('premium_supplier_connections')
        .delete()
        .eq('premium_supplier_id', supplierId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const newConnections = new Map(connectedSuppliers)
      newConnections.delete(supplierId)
      setConnectedSuppliers(newConnections)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-suppliers'] })

      toast.success('Fournisseur déconnecté avec succès')
      return { success: true }
    } catch (error) {
      console.error('Error disconnecting supplier:', error)
      toast.error('Erreur lors de la déconnexion')
      return { success: false, error }
    } finally {
      setIsDisconnecting(false)
    }
  }

  const isSupplierConnected = (supplierId: string): boolean => {
    return connectedSuppliers.get(supplierId)?.isConnected || false
  }

  const getConnectionStatus = (supplierId: string): SupplierConnectionStatus | undefined => {
    return connectedSuppliers.get(supplierId)
  }

  const refreshConnections = () => {
    loadConnections()
  }

  return {
    connectedSuppliers: Array.from(connectedSuppliers.values()),
    isLoading,
    isConnecting,
    isDisconnecting,
    connectSupplier,
    disconnectSupplier,
    isSupplierConnected,
    getConnectionStatus,
    refreshConnections
  }
}
