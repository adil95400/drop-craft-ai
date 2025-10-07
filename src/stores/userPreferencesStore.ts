import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  sidebarCollapsed: boolean;
  defaultView: 'grid' | 'list' | 'table';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  autoSave: boolean;
  defaultPageSize: number;
}

interface UserPreferencesStore extends UserPreferences {
  setTheme: (theme: UserPreferences['theme']) => void;
  setLanguage: (language: UserPreferences['language']) => void;
  toggleSidebar: () => void;
  setDefaultView: (view: UserPreferences['defaultView']) => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleCompactMode: () => void;
  toggleAutoSave: () => void;
  setDefaultPageSize: (size: number) => void;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'fr',
  sidebarCollapsed: false,
  defaultView: 'grid',
  notificationsEnabled: true,
  soundEnabled: false,
  compactMode: false,
  autoSave: true,
  defaultPageSize: 50,
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setDefaultView: (view) => set({ defaultView: view }),
      toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleCompactMode: () => set((state) => ({ compactMode: !state.compactMode })),
      toggleAutoSave: () => set((state) => ({ autoSave: !state.autoSave })),
      setDefaultPageSize: (size) => set({ defaultPageSize: size }),
      reset: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences-storage',
      version: 1,
    }
  )
);
