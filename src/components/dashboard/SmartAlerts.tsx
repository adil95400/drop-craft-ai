/**
 * Alertes intelligentes temps réel
 * Notifications basées sur les seuils et l'IA
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Bell, 
  AlertTriangle, 
  TrendingDown,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  Settings,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SmartAlert {
  id: string
  type: 'stock' | 'revenue' | 'orders' | 'sync' | 'ai'
  severity: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  value?: number | string
  threshold?: number
  timestamp: Date
  read: boolean
  actionable: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export function SmartAlerts() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Fetch real-time data for alerts
  const { data: stockData } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data, count } = await supabase
        .from('supplier_products')
        .select('id, name, stock_quantity', { count: 'exact' })
        .lt('stock_quantity', 10)
        .limit(5)
      return { items: data || [], count: count || 0 }
    },
    refetchInterval: 60000
  })

  const { data: ordersData } = useQuery({
    queryKey: ['pending-orders-alerts'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      return count || 0
    },
    refetchInterval: 30000
  })

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-alerts'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today)
      const total = (data || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
      return total
    },
    refetchInterval: 60000
  })

  // Generate alerts based on data
  useEffect(() => {
    const newAlerts: SmartAlert[] = []

    // Low stock alerts
    if (stockData && stockData.count > 0) {
      newAlerts.push({
        id: 'stock-low',
        type: 'stock',
        severity: stockData.count > 10 ? 'critical' : 'warning',
        title: 'Stock faible détecté',
        message: `${stockData.count} produits ont un stock inférieur à 10 unités`,
        value: stockData.count,
        threshold: 10,
        timestamp: new Date(),
        read: false,
        actionable: true,
        action: {
          label: 'Gérer le stock',
          onClick: () => window.location.href = '/products'
        }
      })
    }

    // Pending orders alerts
    if (ordersData && ordersData > 5) {
      newAlerts.push({
        id: 'orders-pending',
        type: 'orders',
        severity: ordersData > 20 ? 'critical' : 'warning',
        title: 'Commandes en attente',
        message: `${ordersData} commandes attendent d'être traitées`,
        value: ordersData,
        timestamp: new Date(),
        read: false,
        actionable: true,
        action: {
          label: 'Voir les commandes',
          onClick: () => window.location.href = '/orders'
        }
      })
    }

    // Revenue milestone
    if (revenueData && revenueData > 1000) {
      newAlerts.push({
        id: 'revenue-milestone',
        type: 'revenue',
        severity: 'success',
        title: 'Objectif atteint !',
        message: `Vous avez dépassé ${revenueData.toFixed(0)}€ de CA aujourd'hui`,
        value: revenueData,
        timestamp: new Date(),
        read: false,
        actionable: false
      })
    }

    // AI insight - only show if we have real data patterns
    if (ordersData && ordersData > 5) {
      newAlerts.push({
        id: `ai-insight`,
        type: 'ai',
        severity: 'info',
        title: 'Suggestion IA',
        message: `Basé sur vos ${ordersData} commandes, optimisez vos prix pour augmenter vos marges`,
        timestamp: new Date(),
        read: false,
        actionable: true,
        action: {
          label: 'Voir les suggestions',
          onClick: () => toast.success('Ouverture des optimisations')
        }
      })
    }

    setAlerts(prev => {
      // Merge with existing, keeping read status
      const merged = newAlerts.map(newAlert => {
        const existing = prev.find(p => p.id === newAlert.id)
        return existing ? { ...newAlert, read: existing.read } : newAlert
      })
      return merged
    })
  }, [stockData, ordersData, revenueData])

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'stock': return Package
      case 'orders': return ShoppingCart
      case 'revenue': return DollarSign
      case 'sync': return Clock
      case 'ai': return Sparkles
      default: return Bell
    }
  }

  const getSeverityColor = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/50 text-red-700'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700'
      case 'success': return 'bg-green-500/10 border-green-500/50 text-green-700'
      default: return 'bg-blue-500/10 border-blue-500/50 text-blue-700'
    }
  }

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, read: true } : a
    ))
  }

  const dismissAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.read).length

  return (
    <Card className="relative overflow-hidden">
      {/* Critical Alert Indicator */}
      {criticalCount > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5" />
            Alertes Intelligentes
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissAll}
              disabled={unreadCount === 0}
            >
              Tout lire
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Aucune alerte active</p>
            <p className="text-xs">Tout fonctionne normalement</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      getSeverityColor(alert.severity),
                      alert.read && "opacity-60"
                    )}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.title}</span>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs opacity-80 mb-2">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs opacity-60">
                            {alert.timestamp.toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {alert.actionable && alert.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                alert.action?.onClick()
                              }}
                            >
                              {alert.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
