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

const defaultWidgets: DashboardWidget[] = [
  { id: 'sales', title: 'Ventes', enabled: true, position: 0 },
  { id: 'customers', title: 'Clients', enabled: true, position: 1 },
  { id: 'inventory', title: 'Inventaire', enabled: true, position: 2 },
  { id: 'ads', title: 'Publicités', enabled: true, position: 3 },
  { id: 'revenue', title: 'Revenus', enabled: true, position: 4 },
  { id: 'alerts', title: 'Alertes', enabled: true, position: 5 },
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
