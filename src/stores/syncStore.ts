import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface SyncState {
  // États de synchronisation
  lastSync: Record<string, number>
  syncInProgress: Record<string, boolean>
  pendingUpdates: Record<string, any[]>
  
  // Actions de synchronisation
  markSynced: (module: string) => void
  setSyncInProgress: (module: string, inProgress: boolean) => void
  addPendingUpdate: (module: string, update: any) => void
  clearPendingUpdates: (module: string) => void
  
  // Gestion de cache
  invalidateCache: (modules?: string[]) => void
  
  // Synchronisation automatique
  enableAutoSync: boolean
  setAutoSync: (enabled: boolean) => void
}

export const useSyncStore = create<SyncState>()(
  subscribeWithSelector((set, get) => ({
    // États initiaux
    lastSync: {},
    syncInProgress: {},
    pendingUpdates: {},
    enableAutoSync: true,
    
    // Actions
    markSynced: (module: string) => {
      set((state) => ({
        lastSync: {
          ...state.lastSync,
          [module]: Date.now()
        },
        syncInProgress: {
          ...state.syncInProgress,
          [module]: false
        }
      }))
    },
    
    setSyncInProgress: (module: string, inProgress: boolean) => {
      set((state) => ({
        syncInProgress: {
          ...state.syncInProgress,
          [module]: inProgress
        }
      }))
    },
    
    addPendingUpdate: (module: string, update: any) => {
      set((state) => ({
        pendingUpdates: {
          ...state.pendingUpdates,
          [module]: [...(state.pendingUpdates[module] || []), update]
        }
      }))
    },
    
    clearPendingUpdates: (module: string) => {
      set((state) => ({
        pendingUpdates: {
          ...state.pendingUpdates,
          [module]: []
        }
      }))
    },
    
    invalidateCache: (modules?: string[]) => {
      const timestamp = Date.now()
      set((state) => {
        if (modules) {
          const newLastSync = { ...state.lastSync }
          modules.forEach(module => {
            newLastSync[module] = timestamp
          })
          return { lastSync: newLastSync }
        } else {
          return { lastSync: {} }
        }
      })
    },
    
    setAutoSync: (enabled: boolean) => {
      set({ enableAutoSync: enabled })
    }
  }))
)

// Module de synchronisation automatique
export class SyncManager {
  private static instance: SyncManager
  private intervals: Record<string, NodeJS.Timeout> = {}
  
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }
  
  startAutoSync(module: string, syncFn: () => Promise<void>, intervalMs: number = 30000) {
    // Arrêter l'ancienne synchronisation si elle existe
    this.stopAutoSync(module)
    
    // Démarrer la nouvelle synchronisation
    this.intervals[module] = setInterval(async () => {
      const { enableAutoSync, syncInProgress } = useSyncStore.getState()
      
      if (enableAutoSync && !syncInProgress[module]) {
        try {
          useSyncStore.getState().setSyncInProgress(module, true)
          await syncFn()
          useSyncStore.getState().markSynced(module)
        } catch (error) {
          console.error(`Auto-sync error for ${module}:`, error)
        } finally {
          useSyncStore.getState().setSyncInProgress(module, false)
        }
      }
    }, intervalMs)
  }
  
  stopAutoSync(module: string) {
    if (this.intervals[module]) {
      clearInterval(this.intervals[module])
      delete this.intervals[module]
    }
  }
  
  stopAllAutoSync() {
    Object.keys(this.intervals).forEach(module => {
      this.stopAutoSync(module)
    })
  }
}

export const syncManager = SyncManager.getInstance()