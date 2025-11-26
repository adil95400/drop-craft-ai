import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface SupplierConnectionStatus {
  supplierId: string
  isConnected: boolean
  connectionStatus: 'active' | 'inactive' | 'error'
  lastSyncAt?: string
}

export function useSupplierConnection() {
  const [connectedSuppliers, setConnectedSuppliers] = useState<Map<string, SupplierConnectionStatus>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const queryClient = useQueryClient()

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_credentials_vault')
        .select('supplier_id, connection_status, last_validation_at')
      
      if (error) throw error

      const connections = new Map<string, SupplierConnectionStatus>()
      data?.forEach(cred => {
        connections.set(cred.supplier_id, {
          supplierId: cred.supplier_id,
          isConnected: cred.connection_status === 'active',
          connectionStatus: cred.connection_status as any,
          lastSyncAt: cred.last_validation_at
        })
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
        table: 'supplier_credentials_vault'
      }, () => {
        loadConnections()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const disconnectSupplier = async (supplierId: string) => {
    setIsDisconnecting(true)
    try {
      const { error } = await supabase
        .from('supplier_credentials_vault')
        .delete()
        .eq('supplier_id', supplierId)

      if (error) throw error

      // Update local state
      const newConnections = new Map(connectedSuppliers)
      newConnections.delete(supplierId)
      setConnectedSuppliers(newConnections)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })

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
    isDisconnecting,
    disconnectSupplier,
    isSupplierConnected,
    getConnectionStatus,
    refreshConnections
  }
}
