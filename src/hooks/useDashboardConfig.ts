import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export type WidgetType = 
  | 'sales' | 'revenue' | 'orders' | 'customers' | 'inventory' | 'alerts' 
  | 'chart' | 'kpi' | 'conversion' | 'topProducts'
  | 'traffic' | 'profit' | 'recentActivity' | 'goals' | 'marketing' | 'shipping' | 'comparison';

export interface DashboardWidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  position: number;
  size: WidgetSize;
  settings: {
    showChart?: boolean;
    showTrend?: boolean;
    chartType?: 'line' | 'bar' | 'area' | 'pie';
    color?: string;
    showSources?: boolean;
    showBreakdown?: boolean;
    showDetails?: boolean;
    showCampaigns?: boolean;
    showRecent?: boolean;
    maxItems?: number;
    showTimestamp?: boolean;
    comparisonType?: 'period' | 'year';
  };
}

interface DashboardState {
  widgets: DashboardWidgetConfig[];
  timeRange: TimeRange;
  customDateRange: { start: string; end: string } | null;
  isCustomizing: boolean;
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  
  // Actions
  setWidgets: (widgets: DashboardWidgetConfig[]) => void;
  toggleWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidgetConfig>) => void;
  addWidget: (widget: DashboardWidgetConfig) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  setTimeRange: (range: TimeRange) => void;
  setCustomDateRange: (range: { start: string; end: string } | null) => void;
  setIsCustomizing: (value: boolean) => void;
  setRefreshInterval: (seconds: number) => void;
  setAutoRefresh: (value: boolean) => void;
  resetToDefaults: () => void;
}

const defaultWidgets: DashboardWidgetConfig[] = [
  { id: 'revenue', type: 'revenue', title: 'Revenus', enabled: true, position: 0, size: 'lg', settings: { showChart: true, chartType: 'area', showTrend: true } },
  { id: 'orders', type: 'orders', title: 'Commandes', enabled: true, position: 1, size: 'md', settings: { showChart: true, chartType: 'bar', showTrend: true } },
  { id: 'customers', type: 'customers', title: 'Clients', enabled: true, position: 2, size: 'md', settings: { showChart: true, showTrend: true } },
  { id: 'conversion', type: 'conversion', title: 'Taux de conversion', enabled: true, position: 3, size: 'sm', settings: { showTrend: true } },
  { id: 'topProducts', type: 'topProducts', title: 'Top Produits', enabled: true, position: 4, size: 'lg', settings: { showChart: true, chartType: 'bar' } },
  { id: 'inventory', type: 'inventory', title: 'Inventaire', enabled: true, position: 5, size: 'md', settings: { showTrend: true } },
  { id: 'alerts', type: 'alerts', title: 'Alertes', enabled: true, position: 6, size: 'md', settings: {} },
  { id: 'traffic', type: 'traffic', title: 'Trafic', enabled: false, position: 7, size: 'lg', settings: { showChart: true, showSources: true } },
  { id: 'profit', type: 'profit', title: 'Marges & Profits', enabled: false, position: 8, size: 'md', settings: { showChart: true, showBreakdown: true } },
  { id: 'recentActivity', type: 'recentActivity', title: 'Activité récente', enabled: false, position: 9, size: 'md', settings: { maxItems: 6, showTimestamp: true } },
  { id: 'goals', type: 'goals', title: 'Objectifs', enabled: false, position: 10, size: 'md', settings: { showDetails: true } },
  { id: 'marketing', type: 'marketing', title: 'Marketing', enabled: false, position: 11, size: 'lg', settings: { showChart: true, showCampaigns: true } },
  { id: 'shipping', type: 'shipping', title: 'Expéditions', enabled: false, position: 12, size: 'md', settings: { showDetails: true, showRecent: true } },
  { id: 'comparison', type: 'comparison', title: 'Comparaison', enabled: false, position: 13, size: 'lg', settings: { showChart: true, comparisonType: 'period' } },
];

export const useDashboardConfig = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      timeRange: 'month',
      customDateRange: null,
      isCustomizing: false,
      refreshInterval: 30,
      autoRefresh: true,

      setWidgets: (widgets) => set({ widgets }),

      toggleWidget: (id) => set((state) => ({
        widgets: state.widgets.map((w) =>
          w.id === id ? { ...w, enabled: !w.enabled } : w
        ),
      })),

      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),

      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, widget],
      })),

      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter((w) => w.id !== id),
      })),

      reorderWidgets: (activeId, overId) => set((state) => {
        const oldIndex = state.widgets.findIndex((w) => w.id === activeId);
        const newIndex = state.widgets.findIndex((w) => w.id === overId);
        
        if (oldIndex === -1 || newIndex === -1) return state;
        
        const newWidgets = [...state.widgets];
        const [removed] = newWidgets.splice(oldIndex, 1);
        newWidgets.splice(newIndex, 0, removed);
        
        return {
          widgets: newWidgets.map((w, i) => ({ ...w, position: i })),
        };
      }),

      setTimeRange: (range) => set({ timeRange: range }),

      setCustomDateRange: (range) => set({ customDateRange: range }),

      setIsCustomizing: (value) => set({ isCustomizing: value }),

      setRefreshInterval: (seconds) => set({ refreshInterval: seconds }),

      setAutoRefresh: (value) => set({ autoRefresh: value }),

      resetToDefaults: () => set({
        widgets: defaultWidgets,
        timeRange: 'month',
        customDateRange: null,
        refreshInterval: 30,
        autoRefresh: true,
      }),
    }),
    {
      name: 'dashboard-config-v2',
    }
  )
);

// Helper to get date range based on TimeRange
export function getDateRange(timeRange: TimeRange, customRange?: { start: string; end: string } | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case 'today':
      return { start: today, end: now };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { start: weekAgo, end: now };
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { start: monthAgo, end: now };
    case 'quarter':
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return { start: quarterAgo, end: now };
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return { start: yearAgo, end: now };
    case 'custom':
      if (customRange) {
        return { start: new Date(customRange.start), end: new Date(customRange.end) };
      }
      return { start: today, end: now };
    default:
      return { start: today, end: now };
  }
}

export function getTimeRangeLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case 'today': return "Aujourd'hui";
    case 'week': return '7 derniers jours';
    case 'month': return '30 derniers jours';
    case 'quarter': return '3 derniers mois';
    case 'year': return '12 derniers mois';
    case 'custom': return 'Personnalisé';
    default: return '';
  }
}
