import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system' | 'auto';
  language: 'fr' | 'en';
  sidebarCollapsed: boolean;
  defaultView: 'grid' | 'list' | 'table';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  autoSave: boolean;
  defaultPageSize: number;
  autoThemeSchedule: {
    lightModeStart: string; // Format: "HH:mm"
    darkModeStart: string;  // Format: "HH:mm"
  };
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
  setAutoThemeSchedule: (schedule: UserPreferences['autoThemeSchedule']) => void;
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
  autoThemeSchedule: {
    lightModeStart: '07:00',
    darkModeStart: '19:00',
  },
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
      setAutoThemeSchedule: (schedule) => set({ autoThemeSchedule: schedule }),
      reset: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences-storage',
      version: 1,
    }
  )
);
