/**
 * ChannelOverviewTab - Channable-style configuration overview
 * Clean, data-dense, functional settings
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Database, BoxIcon, ShoppingCart, Package, DollarSign,
  Bell, AlertTriangle, RefreshCw, Save, CheckCircle2, Zap,
  Activity, TrendingUp
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SyncSettings {
  products: boolean
  orders: boolean
  inventory: boolean
  prices: boolean
  notifySuccess: boolean
  notifyError: boolean
  autoRetry: boolean
}

interface ChannelOverviewTabProps {
  syncSettings: SyncSettings
  onSyncSettingsChange: (settings: SyncSettings) => void
  retryCount: number[]
  onRetryCountChange: (value: number[]) => void
  onSync: () => void
  onSave: () => void
  isSyncing: boolean
  lastEvent?: { type: string } | null
}

export function ChannelOverviewTab({
  syncSettings,
  onSyncSettingsChange,
  retryCount,
  onRetryCountChange,
  onSync,
  onSave,
  isSyncing,
  lastEvent
}: ChannelOverviewTabProps) {
  const { t } = useTranslation('channels')
  
  const dataTypes = [
    { key: 'products', label: t('overview.products'), desc: t('overview.productsDesc'), icon: BoxIcon, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { key: 'orders', label: t('overview.orders'), desc: t('overview.ordersDesc'), icon: ShoppingCart, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
    { key: 'inventory', label: t('overview.inventory'), desc: t('overview.inventoryDesc'), icon: Package, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10' },
    { key: 'prices', label: t('overview.prices'), desc: t('overview.pricesDesc'), icon: DollarSign, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
  ]

  const updateSetting = (key: keyof SyncSettings, value: boolean) => {
    onSyncSettingsChange({ ...syncSettings, [key]: value })
  }

  return (
    <div className="space-y-5">
      {/* Auto-sync toggle bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-primary/5 border border-primary/15">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">{t('overview.autoSync')}</p>
            <p className="text-xs text-muted-foreground">{t('overview.autoSyncDesc')}</p>
          </div>
        </div>
        <Switch 
          checked={syncSettings.autoRetry}
          onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
        />
      </div>

      {/* Data Types */}
      <Card className="shadow-none border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">{t('overview.dataTypes')}</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">{t('overview.dataTypesDesc')}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dataTypes.map((item) => (
              <div 
                key={item.key}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  syncSettings[item.key as keyof SyncSettings]
                    ? "border-primary/20 bg-primary/5"
                    : "border-border hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-md", item.color)}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-xs">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch 
                  checked={syncSettings[item.key as keyof SyncSettings] as boolean}
                  onCheckedChange={(checked) => updateSetting(item.key as keyof SyncSettings, checked)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column: Notifications + Error Management */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">{t('overview.notifications')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-xs">{t('overview.success')}</p>
                <p className="text-[11px] text-muted-foreground">{t('overview.successDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.notifySuccess}
                onCheckedChange={(checked) => updateSetting('notifySuccess', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-xs">{t('overview.errors')}</p>
                <p className="text-[11px] text-muted-foreground">{t('overview.errorsDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.notifyError}
                onCheckedChange={(checked) => updateSetting('notifyError', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-semibold">{t('overview.errorManagement')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium text-xs">{t('overview.autoRetry')}</p>
                <p className="text-[11px] text-muted-foreground">{t('overview.autoRetryDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.autoRetry}
                onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
              />
            </div>
            <div className="p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-xs">{t('overview.maxRetries', { count: retryCount[0] })}</p>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {retryCount[0]}x
                </Badge>
              </div>
              <Slider
                value={retryCount}
                onValueChange={onRetryCountChange}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity + Performance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold">{t('overview.recentActivity')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {lastEvent && (
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-medium">{lastEvent.type}</span>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-[10px] h-5">Live</Badge>
                </div>
              )}
              {[
                { action: t('overview.syncProducts'), time: t('overview.hoursAgo', { count: 2 }) },
                { action: t('overview.importOrders'), time: t('overview.hoursAgo', { count: 4 }) },
                { action: t('overview.stockUpdate'), time: t('overview.hoursAgo', { count: 6 }) },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs">{item.action}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <CardTitle className="text-sm font-semibold">{t('overview.performance')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {[
                { label: t('overview.syncRate'), value: 98, color: 'bg-emerald-500' },
                { label: t('overview.publishedProducts'), value: 85, color: 'bg-blue-500' },
                { label: t('overview.syncedStock'), value: 100, color: 'bg-purple-500' },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.value}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 justify-end pt-3 border-t border-border">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {t('overview.syncNow')}
        </Button>
        <Button 
          size="sm"
          onClick={onSave} 
          className="gap-2"
        >
          <Save className="h-3.5 w-3.5" />
          {t('overview.save')}
        </Button>
      </div>
    </div>
  )
}
