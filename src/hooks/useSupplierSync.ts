import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function useSupplierSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const queryClient = useQueryClient()

  const syncSupplier = async (supplierId: string) => {
    setIsSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('supplier-sync-products', {
        body: { supplierId }
      })

      if (error) throw error

      toast.success(`Synchronisation réussie: ${data.productsImported || 0} produits importés`)
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      
      return { success: true, data }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Erreur de synchronisation')
      return { success: false, error }
    } finally {
      setIsSyncing(false)
    }
  }

  const syncAllSuppliers = async () => {
    setIsSyncing(true)
    try {
      const { data: credentials } = await supabase
        .from('supplier_credentials_vault')
        .select('supplier_id')
        .eq('connection_status', 'active')

      if (!credentials || credentials.length === 0) {
        toast.info('Aucun fournisseur actif à synchroniser')
        return { success: true, count: 0 }
      }

      const results = await Promise.allSettled(
        credentials.map(({ supplier_id }) => 
          supabase.functions.invoke('supplier-sync-products', {
            body: { supplierId: supplier_id }
          })
        )
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      toast.success(`${successCount}/${credentials.length} fournisseurs synchronisés`)
      
      queryClient.invalidateQueries({ queryKey: ['supplier-products'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })

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
    isSyncing
  }
}
