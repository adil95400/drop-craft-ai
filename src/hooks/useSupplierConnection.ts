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

      const { data, error } = await supabase
        .from('supplier_credentials_vault')
        .select('supplier_id, connection_status, last_validation_at')
        .eq('user_id', user.id)
      
      if (error) throw error

      const connections = new Map<string, SupplierConnectionStatus>()
      data?.forEach(cred => {
        connections.set(cred.supplier_id, {
          supplierId: cred.supplier_id,
          isConnected: cred.connection_status === 'active' || cred.connection_status === 'connected',
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
          .from('supplier_credentials_vault')
          .insert({
            user_id: user.id,
            supplier_id: supplierId,
            connection_type: 'api',
            connection_status: 'active',
            api_key_encrypted: apiKey || null,
            last_validated_at: new Date().toISOString()
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
        .from('supplier_credentials_vault')
        .delete()
        .eq('supplier_id', supplierId)
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
