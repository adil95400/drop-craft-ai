import React, { createContext, useContext, useEffect } from 'react'
import { useAutoSync } from '@/hooks/useAutoSync'
import { toast } from 'sonner'

interface GlobalSyncContextType {
  enableAutoSync: boolean
  isSyncing: boolean
  lastSyncTime: number
  manualSync: (modules?: string[]) => Promise<void>
  setAutoSync: (enabled: boolean) => void
}

const GlobalSyncContext = createContext<GlobalSyncContextType | undefined>(undefined)

export const useGlobalSync = () => {
  const context = useContext(GlobalSyncContext)
  if (context === undefined) {
    throw new Error('useGlobalSync must be used within a GlobalSyncProvider')
  }
  return context
}

interface GlobalSyncProviderProps {
  children: React.ReactNode
}

export const GlobalSyncProvider: React.FC<GlobalSyncProviderProps> = ({ children }) => {
  const { 
    enableAutoSync, 
    isSyncing, 
    lastSyncTime, 
    manualSync, 
    setAutoSync 
  } = useAutoSync()

  // Notification de synchronisation
  useEffect(() => {
    let syncStartTime: number

    if (isSyncing) {
      syncStartTime = Date.now()
    } else if (syncStartTime) {
      const duration = Date.now() - syncStartTime
      if (duration > 1000) { // Si la sync a duré plus d'1 seconde
        toast.success('Synchronisation terminée', {
          description: `Données mises à jour en ${Math.round(duration / 1000)}s`
        })
      }
    }
  }, [isSyncing])

  // Gestion des erreurs de réseau
  useEffect(() => {
    const handleOnline = () => {
      if (enableAutoSync) {
        toast.success('Connexion rétablie', {
          description: 'Synchronisation automatique reprise'
        })
        manualSync(['imports', 'products', 'catalog'])
      }
    }

    const handleOffline = () => {
      toast.warning('Connexion perdue', {
        description: 'Synchronisation automatique interrompue'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [enableAutoSync, manualSync])

  const contextValue: GlobalSyncContextType = {
    enableAutoSync,
    isSyncing,
    lastSyncTime,
    manualSync,
    setAutoSync
  }

  return (
    <GlobalSyncContext.Provider value={contextValue}>
      {children}
    </GlobalSyncContext.Provider>
  )
}