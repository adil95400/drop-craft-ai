import { create } from 'zustand';

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live en ms
  hits: number;
  size: number; // Taille estimée en bytes
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
}

interface CacheStore {
  entries: Map<string, CacheEntry>;
  stats: CacheStats;
  maxSize: number; // Taille max en MB
  
  get: <T = any>(key: string) => T | null;
  set: <T = any>(key: string, data: T, ttl?: number) => void;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  cleanup: () => void;
  getStats: () => CacheStats;
  updateStats: () => void;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE_MB = 50; // 50 MB max

// Estimation de la taille d'un objet en bytes
const estimateSize = (obj: any): number => {
  const str = JSON.stringify(obj);
  return new Blob([str]).size;
};

export const useCacheStore = create<CacheStore>((set, get) => ({
  entries: new Map(),
  stats: {
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    missRate: 0,
    totalHits: 0,
    totalMisses: 0,
  },
  maxSize: MAX_CACHE_SIZE_MB * 1024 * 1024, // Convert to bytes
  
  get: <T = any>(key: string): T | null => {
    const state = get();
    const entry = state.entries.get(key);
    
    if (!entry) {
      set((s) => ({
        stats: {
          ...s.stats,
          totalMisses: s.stats.totalMisses + 1,
        },
      }));
      return null;
    }
    
    // Vérifier si l'entrée a expiré
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      state.delete(key);
      set((s) => ({
        stats: {
          ...s.stats,
          totalMisses: s.stats.totalMisses + 1,
        },
      }));
      return null;
    }
    
    // Incrémenter le compteur de hits
    entry.hits += 1;
    state.entries.set(key, entry);
    
    set((s) => ({
      entries: new Map(state.entries),
      stats: {
        ...s.stats,
        totalHits: s.stats.totalHits + 1,
      },
    }));
    
    return entry.data as T;
  },
  
  set: <T = any>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    const state = get();
    const size = estimateSize(data);
    const now = Date.now();
    
    // Vérifier la taille du cache
    let currentSize = state.stats.totalSize;
    
    // Si l'entrée existe déjà, soustraire son ancienne taille
    const existingEntry = state.entries.get(key);
    if (existingEntry) {
      currentSize -= existingEntry.size;
    }
    
    // Si on dépasse la limite, nettoyer les anciennes entrées
    if (currentSize + size > state.maxSize) {
      state.cleanup();
    }
    
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl,
      hits: 0,
      size,
    };
    
    state.entries.set(key, entry);
    
    set({
      entries: new Map(state.entries),
    });
    
    state.updateStats();
  },
  
  has: (key: string): boolean => {
    const state = get();
    const entry = state.entries.get(key);
    
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      state.delete(key);
      return false;
    }
    
    return true;
  },
  
  delete: (key: string) => {
    const state = get();
    state.entries.delete(key);
    
    set({
      entries: new Map(state.entries),
    });
    
    state.updateStats();
  },
  
  clear: () => {
    set({
      entries: new Map(),
      stats: {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        totalHits: 0,
        totalMisses: 0,
      },
    });
  },
  
  cleanup: () => {
    const state = get();
    const now = Date.now();
    
    // Supprimer les entrées expirées
    for (const [key, entry] of state.entries) {
      if (now - entry.timestamp > entry.ttl) {
        state.entries.delete(key);
      }
    }
    
    // Si toujours trop gros, supprimer les entrées les moins utilisées
    if (state.stats.totalSize > state.maxSize) {
      const sortedEntries = Array.from(state.entries.values())
        .sort((a, b) => a.hits - b.hits);
      
      let currentSize = state.stats.totalSize;
      for (const entry of sortedEntries) {
        if (currentSize <= state.maxSize * 0.8) break; // Libérer 20% d'espace
        
        state.entries.delete(entry.key);
        currentSize -= entry.size;
      }
    }
    
    set({
      entries: new Map(state.entries),
    });
    
    state.updateStats();
  },
  
  getStats: (): CacheStats => {
    return get().stats;
  },
  
  updateStats: () => {
    const state = get();
    const entries = Array.from(state.entries.values());
    
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = state.stats.totalHits;
    const totalMisses = state.stats.totalMisses;
    const total = totalHits + totalMisses;
    
    set({
      stats: {
        totalEntries: entries.length,
        totalSize,
        hitRate: total > 0 ? (totalHits / total) * 100 : 0,
        missRate: total > 0 ? (totalMisses / total) * 100 : 0,
        totalHits,
        totalMisses,
      },
    });
  },
}));

// Auto-cleanup toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useCacheStore.getState();
    store.cleanup();
  }, 5 * 60 * 1000);
}
