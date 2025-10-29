import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface ExtensionSyncResult {
  success: boolean
  imported: number
  failed: number
  errors?: any[]
}

export function useExtensionSync() {
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const { toast } = useToast()

  const syncProducts = useCallback(async (products: any[], token: string): Promise<ExtensionSyncResult> => {
    setSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('extension-sync-realtime', {
        body: {
          action: 'import_products',
          products
        },
        headers: {
          'x-extension-token': token
        }
      })

      if (error) throw error

      toast({
        title: 'Synchronisation réussie',
        description: `${data.imported} produits importés avec succès`
      })

      return {
        success: true,
        imported: data.imported,
        failed: data.failed,
        errors: data.errors
      }
    } catch (error) {
      toast({
        title: 'Erreur de synchronisation',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive'
      })

      return {
        success: false,
        imported: 0,
        failed: products.length
      }
    } finally {
      setSyncing(false)
    }
  }, [toast])

  const getSyncStatus = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('extension-sync-realtime', {
        body: {
          action: 'sync_status'
        },
        headers: {
          'x-extension-token': token
        }
      })

      if (error) throw error
      
      setSyncStatus(data)
      return data
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return null
    }
  }, [])

  return {
    syncing,
    syncStatus,
    syncProducts,
    getSyncStatus
  }
}
