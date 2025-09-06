import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  pageSize: number;
  language: 'fr' | 'en' | 'es';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    widgets: string[];
  };
}

interface UserPreferencesStore extends UserPreferences {
  updateTheme: (theme: UserPreferences['theme']) => void;
  toggleSidebar: () => void;
  updatePageSize: (size: number) => void;
  updateLanguage: (language: UserPreferences['language']) => void;
  updateNotifications: (notifications: Partial<UserPreferences['notifications']>) => void;
  updateDashboard: (dashboard: Partial<UserPreferences['dashboard']>) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  pageSize: 20,
  language: 'fr',
  notifications: {
    email: true,
    push: true,
    desktop: false,
  },
  dashboard: {
    layout: 'grid',
    widgets: ['orders', 'revenue', 'products', 'analytics'],
  },
};

export const useUserPreferences = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,

      updateTheme: (theme) => set({ theme }),
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      updatePageSize: (pageSize) => set({ pageSize }),
      
      updateLanguage: (language) => set({ language }),
      
      updateNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications }
      })),
      
      updateDashboard: (dashboard) => set((state) => ({
        dashboard: { ...state.dashboard, ...dashboard }
      })),
      
      resetToDefaults: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences',
      version: 1,
    }
  )
);

// Performance store for tracking metrics
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  lastUpdated: string;
}

interface PerformanceStore {
  metrics: PerformanceMetrics | null;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  clearMetrics: () => void;
}

export const usePerformanceStore = create<PerformanceStore>((set) => ({
  metrics: null,
  
  updateMetrics: (newMetrics) => set((state) => ({
    metrics: {
      ...state.metrics,
      ...newMetrics,
      lastUpdated: new Date().toISOString(),
    } as PerformanceMetrics
  })),
  
  clearMetrics: () => set({ metrics: null }),
}));

// Cache store for API responses
interface CacheStore {
  cache: Record<string, { data: any; timestamp: number; ttl: number }>;
  set: (key: string, data: any, ttl?: number) => void;
  get: (key: string) => any | null;
  clear: (key?: string) => void;
  cleanup: () => void;
}

export const useCacheStore = create<CacheStore>((set, get) => ({
  cache: {},
  
  set: (key, data, ttl = 5 * 60 * 1000) => { // Default 5 minutes
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          data,
          timestamp: Date.now(),
          ttl,
        },
      },
    }));
  },
  
  get: (key) => {
    const item = get().cache[key];
    if (!item) return null;
    
    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      get().clear(key);
      return null;
    }
    
    return item.data;
  },
  
  clear: (key) => {
    if (key) {
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
    } else {
      set({ cache: {} });
    }
  },
  
  cleanup: () => {
    const now = Date.now();
    set((state) => {
      const newCache = Object.entries(state.cache).reduce((acc, [key, item]) => {
        const cacheItem = item as { data: any; timestamp: number; ttl: number };
        if (now - cacheItem.timestamp <= cacheItem.ttl) {
          acc[key] = cacheItem;
        }
        return acc;
      }, {} as typeof state.cache);
      
      return { cache: newCache };
    });
  },
}));

// Auto cleanup cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().cleanup();
  }, 10 * 60 * 1000);
}