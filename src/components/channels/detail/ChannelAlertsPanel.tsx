/**
 * ChannelAlertsPanel - Channable-style alerts
 * Compact, actionable alert cards
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, AlertTriangle, TrendingDown, Package, ShoppingCart, 
  CheckCircle2, X, Settings2, BellRing
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: 'stock_low' | 'price_change' | 'new_order' | 'sync_error'
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  timestamp: Date
  read: boolean
}

interface AlertSettings {
  stockLow: boolean
  priceChange: boolean
  newOrders: boolean
  syncErrors: boolean
  stockThreshold: number
}

interface ChannelAlertsPanelProps {
  alerts?: Alert[]
  onDismiss?: (id: string) => void
  onDismissAll?: () => void
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'stock_low',
    title: 'Stock faible',
    message: '12 produits ont un stock inférieur à 5 unités',
    severity: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false
  },
  {
    id: '2',
    type: 'new_order',
    title: 'Nouvelle commande',
    message: 'Commande #1847 reçue - €89.99',
    severity: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false
  },
  {
    id: '3',
    type: 'price_change',
    title: 'Variation de prix',
    message: '3 produits ont des prix différents',
    severity: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    read: true
  }
]

export function ChannelAlertsPanel({ 
  alerts = mockAlerts,
  onDismiss,
  onDismissAll
}: ChannelAlertsPanelProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [localAlerts, setLocalAlerts] = useState(alerts)
  const [settings, setSettings] = useState<AlertSettings>({
    stockLow: true,
    priceChange: true,
    newOrders: true,
    syncErrors: true,
    stockThreshold: 5
  })

  const unreadCount = localAlerts.filter(a => !a.read).length

  const handleDismiss = (id: string) => {
    setLocalAlerts(prev => prev.filter(a => a.id !== id))
    onDismiss?.(id)
  }

  const handleDismissAll = () => {
    setLocalAlerts([])
    onDismissAll?.()
  }

  const alertIcons: Record<string, typeof Bell> = {
    stock_low: Package,
    price_change: TrendingDown,
    new_order: ShoppingCart,
    sync_error: AlertTriangle,
  }

  const severityStyles: Record<string, string> = {
    critical: 'border-destructive/30 bg-destructive/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}j`
  }

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <BellRing className="h-4 w-4 text-amber-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Alertes</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est OK'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {localAlerts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleDismissAll} className="text-[11px] h-7 px-2">
                Effacer
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="h-7 w-7">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                <p className="text-[11px] font-semibold mb-2">Paramètres</p>
                {[
                  { key: 'stockLow', label: 'Stock faible', icon: Package },
                  { key: 'priceChange', label: 'Variations prix', icon: TrendingDown },
                  { key: 'newOrders', label: 'Commandes', icon: ShoppingCart },
                  { key: 'syncErrors', label: 'Erreurs sync', icon: AlertTriangle },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof AlertSettings] as boolean}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="pt-0">
        <AnimatePresence mode="popLayout">
          {localAlerts.length > 0 ? (
            <div className="space-y-1.5">
              {localAlerts.map((alert) => {
                const Icon = alertIcons[alert.type] || Bell
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border",
                      severityStyles[alert.severity],
                      !alert.read && "ring-1 ring-primary/20"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-xs">{alert.title}</p>
                        {!alert.read && (
                          <Badge className="h-4 text-[9px] px-1.5 bg-primary text-primary-foreground">New</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatTime(alert.timestamp)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium">Tout est en ordre</p>
              <p className="text-[11px] text-muted-foreground">Aucune alerte</p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
