import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  RefreshCw, 
  Package, 
  ShoppingCart, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Play,
  Settings,
  History,
  Zap,
  AlertCircle
} from 'lucide-react'
import { useShopifySync } from '@/hooks/useShopifySync'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatusBadge } from '@/components/ui/status-badge'

export function ShopifyCompleteSyncPanel() {
  const { user } = useAuth()
  const { configs, logs, isSyncing, triggerSync } = useShopifySync()
  
  const [syncOptions, setSyncOptions] = useState({
    syncProducts: true,
    syncOrders: true,
    syncCustomers: false,
    daysBack: 30
  })
  
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  // Fetch store integrations
  const { data: integrations, isLoading } = supabase
    ? { data: configs, isLoading: false }
    : { data: [], isLoading: false }

  const handleSync = async () => {
    if (!selectedIntegration && configs && configs.length > 0) {
      setSelectedIntegration(configs[0].id)
    }
    
    const integrationId = selectedIntegration || configs?.[0]?.id
    if (!integrationId) return

    triggerSync({
      configId: integrationId,
      ...syncOptions
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected': 
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': 
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'syncing':
      case 'running': 
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: 
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Chargement des intégrations..." />
  }

  return (
    <div className="space-y-6">
      {/* Quick Sync Panel */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Synchronisation Shopify</CardTitle>
                <CardDescription>
                  Synchronisez vos produits, commandes et clients
                </CardDescription>
              </div>
            </div>
            
            <Button 
              onClick={handleSync}
              disabled={isSyncing || !configs || configs.length === 0}
              className="gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Lancer la sync
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Options de synchronisation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-products"
                checked={syncOptions.syncProducts}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, syncProducts: !!checked }))
                }
              />
              <Label htmlFor="sync-products" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4 text-blue-500" />
                Produits
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-orders"
                checked={syncOptions.syncOrders}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, syncOrders: !!checked }))
                }
              />
              <Label htmlFor="sync-orders" className="flex items-center gap-2 cursor-pointer">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                Commandes
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sync-customers"
                checked={syncOptions.syncCustomers}
                onCheckedChange={(checked) => 
                  setSyncOptions(prev => ({ ...prev, syncCustomers: !!checked }))
                }
              />
              <Label htmlFor="sync-customers" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-purple-500" />
                Clients
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                Période:
              </Label>
              <Select 
                value={syncOptions.daysBack.toString()}
                onValueChange={(v) => setSyncOptions(prev => ({ ...prev, daysBack: parseInt(v) }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 jours</SelectItem>
                  <SelectItem value="30">30 jours</SelectItem>
                  <SelectItem value="90">90 jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intégrations disponibles */}
          {configs && configs.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Boutiques connectées</Label>
              <div className="grid gap-2">
                {configs.map((config) => (
                  <div 
                    key={config.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedIntegration === config.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedIntegration(config.id)}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(config.sync_status || 'idle')}
                      <div>
                        <p className="font-medium">{config.store_url || 'Boutique Shopify'}</p>
                        {config.last_sync_at && (
                          <p className="text-xs text-muted-foreground">
                            Dernière sync: {format(new Date(config.last_sync_at), 'Pp', { locale: getDateFnsLocale() })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <StatusBadge status={config.sync_status || 'idle'} category="sync" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!configs || configs.length === 0) && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Aucune boutique Shopify connectée</p>
                <p className="text-sm text-muted-foreground">
                  Connectez votre boutique Shopify dans les intégrations pour commencer.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des synchronisations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle className="text-lg">Historique des synchronisations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(new Date(log.started_at), 'Pp', { locale: getDateFnsLocale() })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.sync_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {log.products_synced > 0 && `${log.products_synced} produits`}
                        {log.orders_synced > 0 && ` • ${log.orders_synced} commandes`}
                        {log.customers_synced > 0 && ` • ${log.customers_synced} clients`}
                      </p>
                    </div>
                  </div>
                  
                  <StatusBadge status={log.status} category="sync" size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun historique de synchronisation
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
