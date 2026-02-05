// Export central des composants Monitoring
export { BusinessMetrics } from './components/BusinessMetrics'
export { MonitoringDashboard } from './components/MonitoringDashboard'
export { AlertHistoryPanel } from './components/AlertHistoryPanel'

// Types
export interface BusinessMetric {
  id: string
  name: string
  value: number
  previousValue: number
  target?: number
  unit: string
  format: 'currency' | 'number' | 'percentage'
  trend: 'up' | 'down' | 'stable'
  category: 'revenue' | 'traffic' | 'conversion' | 'operations'
  status: 'healthy' | 'warning' | 'critical'
  description: string
}

export interface SystemHealth {
  uptime: number
  responseTime: number
  errorRate: number
  throughput: number
  status: 'healthy' | 'degraded' | 'down'
}

export interface Alert {
  id: string
  type: 'business' | 'system' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}