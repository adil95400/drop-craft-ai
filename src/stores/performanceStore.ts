import { create } from 'zustand';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  bundleSize: number;
  apiLatency: number;
  renderTime: number;
  cacheHitRate: number;
  errorRate: number;
  activeConnections: number;
  requestsPerMinute: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: Date;
}

interface PerformanceStore {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  
  updateMetric: (metric: keyof PerformanceMetrics, value: number) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  addAlert: (alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => void;
  clearAlert: (id: string) => void;
  clearAllAlerts: () => void;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  reset: () => void;
}

const defaultMetrics: PerformanceMetrics = {
  fps: 60,
  memoryUsage: 0,
  bundleSize: 0,
  apiLatency: 0,
  renderTime: 0,
  cacheHitRate: 0,
  errorRate: 0,
  activeConnections: 0,
  requestsPerMinute: 0,
};

// Thresholds pour les alertes
const thresholds: Record<keyof PerformanceMetrics, { warning: number; critical: number }> = {
  fps: { warning: 30, critical: 15 },
  memoryUsage: { warning: 100, critical: 200 },
  bundleSize: { warning: 500, critical: 1000 },
  apiLatency: { warning: 1000, critical: 3000 },
  renderTime: { warning: 16, critical: 32 },
  cacheHitRate: { warning: 50, critical: 30 },
  errorRate: { warning: 1, critical: 5 },
  activeConnections: { warning: 10, critical: 20 },
  requestsPerMinute: { warning: 100, critical: 200 },
};

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  metrics: defaultMetrics,
  alerts: [],
  isMonitoring: false,
  
  updateMetric: (metric, value) => {
    set((state) => {
      const newMetrics = { ...state.metrics, [metric]: value };
      
      // Vérifier les seuils et créer des alertes si nécessaire
      const threshold = thresholds[metric];
      const alerts = [...state.alerts];
      
      if (value >= threshold.critical) {
        alerts.push({
          id: `${metric}-${Date.now()}`,
          type: 'critical',
          message: `${metric} critique: ${value}`,
          metric,
          value,
          threshold: threshold.critical,
          timestamp: new Date(),
        });
      } else if (value >= threshold.warning) {
        alerts.push({
          id: `${metric}-${Date.now()}`,
          type: 'warning',
          message: `${metric} élevé: ${value}`,
          metric,
          value,
          threshold: threshold.warning,
          timestamp: new Date(),
        });
      }
      
      // Garder seulement les 50 dernières alertes
      const recentAlerts = alerts.slice(-50);
      
      return { metrics: newMetrics, alerts: recentAlerts };
    });
  },
  
  updateMetrics: (metrics) => {
    set((state) => ({
      metrics: { ...state.metrics, ...metrics },
    }));
  },
  
  addAlert: (alert) => {
    set((state) => ({
      alerts: [
        ...state.alerts,
        {
          ...alert,
          id: `${alert.metric}-${Date.now()}`,
          timestamp: new Date(),
        },
      ].slice(-50), // Garder les 50 dernières
    }));
  },
  
  clearAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }));
  },
  
  clearAllAlerts: () => {
    set({ alerts: [] });
  },
  
  startMonitoring: () => {
    set({ isMonitoring: true });
  },
  
  stopMonitoring: () => {
    set({ isMonitoring: false });
  },
  
  reset: () => {
    set({ metrics: defaultMetrics, alerts: [], isMonitoring: false });
  },
}));
