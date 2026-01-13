/**
 * Alertes intelligentes style Channable
 * Design moderne avec cards Channable
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChannableCard } from '@/components/channable'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { 
  Bell, 
  AlertTriangle, 
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  ChevronRight
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

const severityConfig = {
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    text: 'text-destructive',
    badge: 'bg-destructive text-destructive-foreground'
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    text: 'text-warning',
    badge: 'bg-warning text-warning-foreground'
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/30',
    text: 'text-success',
    badge: 'bg-success text-success-foreground'
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-info/30',
    text: 'text-info',
    badge: 'bg-info text-info-foreground'
  }
}

const typeConfig = {
  stock: { icon: Package, label: 'Stock' },
  orders: { icon: ShoppingCart, label: 'Commandes' },
  revenue: { icon: DollarSign, label: 'Revenus' },
  sync: { icon: Clock, label: 'Sync' },
  ai: { icon: Sparkles, label: 'IA' }
}

export function SmartAlertsChannable() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch real-time data for alerts
  const { data: stockData } = useQuery({
    queryKey: ['low-stock-alerts-channable'],
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
    queryKey: ['pending-orders-alerts-channable'],
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
    queryKey: ['revenue-alerts-channable'],
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

    // AI insight (simulated)
    if (Math.random() > 0.7) {
      newAlerts.push({
        id: `ai-${Date.now()}`,
        type: 'ai',
        severity: 'info',
        title: 'Suggestion IA',
        message: 'Optimisez vos prix sur 12 produits pour augmenter vos marges de 15%',
        timestamp: new Date(),
        read: false,
        actionable: true,
        action: {
          label: 'Appliquer',
          onClick: () => toast.success('Optimisation lancée')
        }
      })
    }

    setAlerts(prev => {
      const merged = newAlerts.map(newAlert => {
        const existing = prev.find(p => p.id === newAlert.id)
        return existing ? { ...newAlert, read: existing.read } : newAlert
      })
      return merged
    })
  }, [stockData, ordersData, revenueData])

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, read: true } : a
    ))
  }

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const dismissAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.read).length
  const displayedAlerts = isExpanded ? alerts : alerts.slice(0, 3)

  if (alerts.length === 0) {
    return (
      <ChannableCard
        title="Alertes Intelligentes"
        description="Tout fonctionne normalement"
        icon={Bell}
        status="connected"
      >
        <div className="py-4 text-center text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="text-sm">Aucune alerte active</p>
        </div>
      </ChannableCard>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Critical Alert Indicator */}
      {criticalCount > 0 && (
        <motion.div 
          className="absolute -top-1 -left-1 -right-1 h-1 bg-destructive rounded-full"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Alertes Intelligentes
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">Notifications en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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

        {/* Alerts List */}
        <div className="p-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {displayedAlerts.map((alert, index) => {
                const config = severityConfig[alert.severity]
                const typeInfo = typeConfig[alert.type]
                const Icon = typeInfo.icon

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative p-4 rounded-lg border transition-all cursor-pointer group",
                      config.bg,
                      config.border,
                      alert.read && "opacity-60",
                      "hover:shadow-md"
                    )}
                    onClick={() => markAsRead(alert.id)}
                  >
                    {/* Dismiss Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissAlert(alert.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{alert.title}</span>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {alert.actionable && alert.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs group-hover:bg-primary group-hover:text-primary-foreground"
                              onClick={(e) => {
                                e.stopPropagation()
                                alert.action?.onClick()
                              }}
                            >
                              {alert.action.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>

          {/* Show More Button */}
          {alerts.length > 3 && (
            <Button
              variant="ghost"
              className="w-full mt-3 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Voir moins' : `Voir ${alerts.length - 3} alertes de plus`}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
