import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSyncStore, syncManager } from '@/stores/syncStore'
import { importService } from '@/domains/commerce/services/importService'
import { logger } from '@/utils/logger'

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

  const syncImports = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['import'] })
      importService.clearCache()
      logger.debug('Import synchronization completed', { component: 'AutoSync' })
    } catch (error) {
      logger.error('Import sync error', error as Error, { component: 'AutoSync' })
      throw error
    }
  }, [queryClient])

  const syncProducts = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['import', 'products'] })
      logger.debug('Product synchronization completed', { component: 'AutoSync' })
    } catch (error) {
      logger.error('Product sync error', error as Error, { component: 'AutoSync' })
      throw error
    }
  }, [queryClient])

  const syncCatalog = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['catalog'] })
      logger.debug('Catalog synchronization completed', { component: 'AutoSync' })
    } catch (error) {
      logger.error('Catalog sync error', error as Error, { component: 'AutoSync' })
      throw error
    }
  }, [queryClient])

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
      logger.error('Manual sync error', error as Error, { component: 'AutoSync' })
      throw error
    } finally {
      modules.forEach(module => setSyncInProgress(module, false))
    }
  }, [syncImports, syncProducts, syncCatalog, setSyncInProgress, markSynced])

  useEffect(() => {
    if (enableAutoSync) {
      syncManager.startAutoSync('imports', syncImports, 30000)
      syncManager.startAutoSync('products', syncProducts, 60000)
      syncManager.startAutoSync('catalog', syncCatalog, 120000)
    } else {
      syncManager.stopAllAutoSync()
    }

    return () => {
      syncManager.stopAllAutoSync()
    }
  }, [enableAutoSync, syncImports, syncProducts, syncCatalog])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enableAutoSync) {
        const now = Date.now()
        const syncThreshold = 5 * 60 * 1000
        
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
    enableAutoSync,
    syncInProgress,
    lastSync,
    setAutoSync,
    manualSync,
    invalidateCache,
    isSyncing: Object.values(syncInProgress).some(Boolean),
    lastSyncTime: Math.max(...Object.values(lastSync).filter(Boolean), 0)
  }
}
