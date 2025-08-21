import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncStore, syncManager } from '@/stores/syncStore'
import { importService } from '@/domains/commerce/services/importService'

export const useAutoSync = () => {
  const queryClient = useQueryClient()
  const { 
    enableAutoSync, 
    syncInProgress, 
    lastSync,
    markSynced,
    setSyncInProgress,
    setAutoSync,
    invalidateCache
  } = useSyncStore()

  // Fonction de synchronisation des imports
  const syncImports = useCallback(async () => {
    try {
      // Invalider et refetch les données d'import
      await queryClient.invalidateQueries({ queryKey: ['import'] })
      
      // Nettoyer le cache du service
      importService.clearCache()
      
      console.log('Import synchronization completed')
    } catch (error) {
      console.error('Import sync error:', error)
      throw error
    }
  }, [queryClient])

  // Fonction de synchronisation des produits
  const syncProducts = useCallback(async () => {
    try {
      // Invalider et refetch les données de produits
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['import', 'products'] })
      
      console.log('Product synchronization completed')
    } catch (error) {
      console.error('Product sync error:', error)
      throw error
    }
  }, [queryClient])

  // Fonction de synchronisation du catalogue
  const syncCatalog = useCallback(async () => {
    try {
      // Invalider et refetch les données du catalogue
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
      
      console.log('Catalog synchronization completed')
    } catch (error) {
      console.error('Catalog sync error:', error)
      throw error
    }
  }, [queryClient])

  // Synchronisation manuelle
  const manualSync = useCallback(async (modules: string[] = ['imports', 'products', 'catalog']) => {
    const syncPromises: Promise<void>[] = []
    
    modules.forEach(module => {
      setSyncInProgress(module, true)
      
      switch (module) {
        case 'imports':
          syncPromises.push(syncImports())
          break
        case 'products':
          syncPromises.push(syncProducts())
          break
        case 'catalog':
          syncPromises.push(syncCatalog())
          break
      }
    })

    try {
      await Promise.all(syncPromises)
      modules.forEach(module => markSynced(module))
    } catch (error) {
      console.error('Manual sync error:', error)
      throw error
    } finally {
      modules.forEach(module => setSyncInProgress(module, false))
    }
  }, [syncImports, syncProducts, syncCatalog, setSyncInProgress, markSynced])

  // Démarrer la synchronisation automatique
  useEffect(() => {
    if (enableAutoSync) {
      // Synchronisation des imports toutes les 30 secondes
      syncManager.startAutoSync('imports', syncImports, 30000)
      
      // Synchronisation des produits toutes les minutes
      syncManager.startAutoSync('products', syncProducts, 60000)
      
      // Synchronisation du catalogue toutes les 2 minutes
      syncManager.startAutoSync('catalog', syncCatalog, 120000)
    } else {
      // Arrêter toutes les synchronisations automatiques
      syncManager.stopAllAutoSync()
    }

    return () => {
      syncManager.stopAllAutoSync()
    }
  }, [enableAutoSync, syncImports, syncProducts, syncCatalog])

  // Synchronisation lors des changements d'onglets
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enableAutoSync) {
        // Synchroniser quand l'utilisateur revient sur l'onglet
        const now = Date.now()
        const syncThreshold = 5 * 60 * 1000 // 5 minutes
        
        Object.entries(lastSync).forEach(([module, timestamp]) => {
          if (now - timestamp > syncThreshold) {
            manualSync([module])
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enableAutoSync, lastSync, manualSync])

  return {
    // États
    enableAutoSync,
    syncInProgress,
    lastSync,
    
    // Actions
    setAutoSync,
    manualSync,
    invalidateCache,
    
    // Status
    isSyncing: Object.values(syncInProgress).some(Boolean),
    lastSyncTime: Math.max(...Object.values(lastSync).filter(Boolean), 0)
  }
}