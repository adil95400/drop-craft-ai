/**
 * ChannelAlertsPanel - Alertes intelligentes temps réel
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
    title: 'Variation de prix détectée',
    message: '3 produits ont des prix différents sur Shopify',
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

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'stock_low': return Package
      case 'price_change': return TrendingDown
      case 'new_order': return ShoppingCart
      case 'sync_error': return AlertTriangle
      default: return Bell
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
      default: return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400'
    }
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `Il y a ${minutes}min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-yellow-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 relative">
              <BellRing className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Alertes intelligentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle alerte'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {localAlerts.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismissAll}
                className="text-xs"
              >
                Tout effacer
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-xl"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3">
                <p className="text-sm font-medium mb-3">Paramètres des alertes</p>
                {[
                  { key: 'stockLow', label: 'Stock faible', icon: Package },
                  { key: 'priceChange', label: 'Variations de prix', icon: TrendingDown },
                  { key: 'newOrders', label: 'Nouvelles commandes', icon: ShoppingCart },
                  { key: 'syncErrors', label: 'Erreurs de sync', icon: AlertTriangle },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
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
            <div className="space-y-2">
              {localAlerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${getSeverityColor(alert.severity)} ${!alert.read ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <div className="p-2 rounded-lg bg-background/50">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{alert.title}</p>
                        {!alert.read && (
                          <Badge className="h-5 text-[10px] bg-primary text-primary-foreground">Nouveau</Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-80 mt-0.5">{alert.message}</p>
                      <p className="text-xs opacity-60 mt-1">{formatTime(alert.timestamp)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Tout est en ordre !</p>
              <p className="text-xs text-muted-foreground mt-1">Aucune alerte à traiter</p>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
