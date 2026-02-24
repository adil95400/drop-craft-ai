/**
 * ChannelOverviewTab - Onglet Vue d'ensemble optimisé
 */
import { useState } from 'react'
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
    { key: 'products', label: t('overview.products'), desc: t('overview.productsDesc'), icon: BoxIcon, color: 'blue' },
    { key: 'orders', label: t('overview.orders'), desc: t('overview.ordersDesc'), icon: ShoppingCart, color: 'green' },
    { key: 'inventory', label: t('overview.inventory'), desc: t('overview.inventoryDesc'), icon: Package, color: 'purple' },
    { key: 'prices', label: t('overview.prices'), desc: t('overview.pricesDesc'), icon: DollarSign, color: 'orange' },
  ]

  const colorVariants = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  }

  const updateSetting = (key: keyof SyncSettings, value: boolean) => {
    onSyncSettingsChange({ ...syncSettings, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{t('overview.autoSync')}</p>
            <p className="text-sm text-muted-foreground">{t('overview.autoSyncDesc')}</p>
          </div>
        </div>
        <Switch 
          checked={syncSettings.autoRetry}
          onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
        />
      </div>

      {/* Data Types Grid */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('overview.dataTypes')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('overview.dataTypesDesc')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dataTypes.map((item, index) => (
              <motion.div 
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                  syncSettings[item.key as keyof SyncSettings]
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-card hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", colorVariants[item.color as keyof typeof colorVariants])}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch 
                  checked={syncSettings[item.key as keyof SyncSettings] as boolean}
                  onCheckedChange={(checked) => updateSetting(item.key as keyof SyncSettings, checked)}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/10">
                <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-lg">{t('overview.notifications')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{t('overview.success')}</p>
                <p className="text-xs text-muted-foreground">{t('overview.successDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.notifySuccess}
                onCheckedChange={(checked) => updateSetting('notifySuccess', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors">
              <div>
                <p className="font-medium text-sm">{t('overview.errors')}</p>
                <p className="text-xs text-muted-foreground">{t('overview.errorsDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.notifyError}
                onCheckedChange={(checked) => updateSetting('notifyError', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Management */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg">{t('overview.errorManagement')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
              <div>
                <p className="font-medium text-sm">{t('overview.autoRetry')}</p>
                <p className="text-xs text-muted-foreground">{t('overview.autoRetryDesc')}</p>
              </div>
              <Switch 
                checked={syncSettings.autoRetry}
                onCheckedChange={(checked) => updateSetting('autoRetry', checked)}
              />
            </div>
            <div className="p-4 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm">{t('overview.maxRetries', { count: retryCount[0] })}</p>
                <Badge variant="outline" className="text-xs">
                  {retryCount[0]} {retryCount[0] > 1 ? t('overview.retryUnitPlural') : t('overview.retryUnit')}
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

      {/* Activity & Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">{t('overview.recentActivity')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastEvent && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">{lastEvent.type}</span>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Live</Badge>
                </div>
              )}
              {[
                { action: t('overview.syncProducts'), time: t('overview.hoursAgo', { count: 2 }) },
                { action: t('overview.importOrders'), time: t('overview.hoursAgo', { count: 4 }) },
                { action: t('overview.stockUpdate'), time: t('overview.hoursAgo', { count: 6 }) },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{item.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">{t('overview.performance')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { label: t('overview.syncRate'), value: 98, color: 'bg-green-500' },
                { label: t('overview.publishedProducts'), value: 85, color: 'bg-blue-500' },
                { label: t('overview.syncedStock'), value: 100, color: 'bg-purple-500' },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
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
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-border/50">
        <Button 
          variant="outline" 
          onClick={onSync}
          disabled={isSyncing}
          className="gap-2 h-11 px-5 rounded-xl"
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          {t('overview.syncNow')}
        </Button>
        <Button 
          onClick={onSave} 
          className="gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          {t('overview.save')}
        </Button>
      </div>
    </div>
  )
}
