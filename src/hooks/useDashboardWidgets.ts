import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardWidget {
  id: string;
  title: string;
  enabled: boolean;
  position: number;
}

interface DashboardWidgetsState {
  widgets: DashboardWidget[];
  toggleWidget: (id: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
}

// 6 widgets essentiels par défaut (réduit pour éviter surcharge cognitive)
const defaultWidgets: DashboardWidget[] = [
  { id: 'revenue', title: 'Revenus', enabled: true, position: 0 },
  { id: 'orders', title: 'Commandes', enabled: true, position: 1 },
  { id: 'products', title: 'Produits', enabled: true, position: 2 },
  { id: 'inventory', title: 'Inventaire', enabled: true, position: 3 },
  { id: 'alerts', title: 'Alertes', enabled: true, position: 4 },
  { id: 'activity', title: 'Activité', enabled: true, position: 5 },
  // Widgets additionnels désactivés par défaut (pour simplifier l'onboarding)
  { id: 'sales', title: 'Ventes', enabled: false, position: 6 },
  { id: 'customers', title: 'Clients', enabled: false, position: 7 },
  { id: 'ads', title: 'Publicités', enabled: false, position: 8 },
];

export const useDashboardWidgets = create<DashboardWidgetsState>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),
      reorderWidgets: (widgets) => set({ widgets }),
    }),
    {
      name: 'dashboard-widgets',
    }
  )
);
