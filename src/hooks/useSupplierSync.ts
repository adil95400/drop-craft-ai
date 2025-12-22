import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function useSupplierSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{
    supplierId: string
    status: 'idle' | 'syncing' | 'success' | 'error'
    productsImported: number
  } | null>(null)
  const queryClient = useQueryClient()

  const syncSupplier = async (supplierId: string) => {
    setIsSyncing(true)
    setSyncProgress({ supplierId, status: 'syncing', productsImported: 0 })
    
    try {
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: { supplierId, limit: 1000 }
      })

      if (error) throw error

      const productsImported = data?.syncStats?.imported || 0
      
      setSyncProgress({ supplierId, status: 'success', productsImported })
      toast.success(`Synchronisation réussie: ${productsImported} produits importés`)
      
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      
      return { success: true, data }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncProgress({ supplierId, status: 'error', productsImported: 0 })
      toast.error('Erreur de synchronisation')
      return { success: false, error }
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncProgress(null), 3000)
    }
  }

  const syncAllSuppliers = async () => {
    setIsSyncing(true)
    try {
      // Use premium_supplier_connections instead
      const { data: connections } = await supabase
        .from('premium_supplier_connections')
        .select('premium_supplier_id')
        .eq('connection_status', 'connected')

      if (!connections || connections.length === 0) {
        toast.info('Aucun fournisseur actif à synchroniser')
        return { success: true, count: 0 }
      }

      const results = await Promise.allSettled(
        connections.map(({ premium_supplier_id }) => 
          supabase.functions.invoke('supplier-sync-products', {
            body: { supplierId: premium_supplier_id, limit: 1000 }
          })
        )
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      toast.success(`${successCount}/${connections.length} fournisseurs synchronisés`)
      
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })

      return { success: true, count: successCount }
    } catch (error) {
      console.error('Sync all error:', error)
      toast.error('Erreur lors de la synchronisation globale')
      return { success: false, error }
    } finally {
      setIsSyncing(false)
    }
  }

  return {
    syncSupplier,
    syncAllSuppliers,
    isSyncing,
    syncProgress
  }
}
