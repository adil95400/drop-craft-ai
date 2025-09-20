import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Settings, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface SyncRule {
  id: string
  name: string
  source: 'platform' | 'supplier'
  target: 'platform' | 'supplier'
  sync_type: 'stock' | 'price' | 'both'
  frequency: 'realtime' | '5min' | '15min' | '1hour' | '6hour' | '24hour'
  is_active: boolean
  last_sync: string | null
  next_sync: string | null
  success_rate: number
  conflict_resolution: 'platform_wins' | 'supplier_wins' | 'highest_wins' | 'manual'
}

interface SyncActivity {
  id: string
  rule_name: string
  sync_type: 'stock' | 'price'
  direction: 'platform_to_supplier' | 'supplier_to_platform'
  status: 'success' | 'failed' | 'conflict'
  processed_items: number
  failed_items: number
  created_at: string
  details: any
}

export function BiDirectionalSync() {
  const { toast } = useToast()
  const [syncRules, setSyncRules] = useState<SyncRule[]>([])
  const [syncActivity, setSyncActivity] = useState<SyncActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<SyncRule | null>(null)
  const [globalSyncEnabled, setGlobalSyncEnabled] = useState(true)

  useEffect(() => {
    loadSyncData()
  }, [])

  const loadSyncData = async () => {
    setIsLoading(true)
    try {
      // Load sync rules (simulated data for demo)
      const mockRules: SyncRule[] = [
        {
          id: '1',
          name: 'Shopify ↔ Stock Central',
          source: 'platform',
          target: 'supplier',
          sync_type: 'both',
          frequency: '15min',
          is_active: true,
          last_sync: new Date(Date.now() - 300000).toISOString(),
          next_sync: new Date(Date.now() + 600000).toISOString(),
          success_rate: 98.5,
          conflict_resolution: 'platform_wins'
        },
        {
          id: '2',
          name: 'BigBuy → Catalogue',
          source: 'supplier',
          target: 'platform',
          sync_type: 'price',
          frequency: '1hour',
          is_active: true,
          last_sync: new Date(Date.now() - 1800000).toISOString(),
          next_sync: new Date(Date.now() + 1800000).toISOString(),
          success_rate: 94.2,
          conflict_resolution: 'supplier_wins'
        },
        {
          id: '3',
          name: 'WooCommerce Stock Sync',
          source: 'platform',
          target: 'supplier',
          sync_type: 'stock',
          frequency: '5min',
          is_active: false,
          last_sync: new Date(Date.now() - 7200000).toISOString(),
          next_sync: null,
          success_rate: 89.7,
          conflict_resolution: 'manual'
        }
      ]

      const mockActivity: SyncActivity[] = [
        {
          id: '1',
          rule_name: 'Shopify ↔ Stock Central',
          sync_type: 'stock',
          direction: 'platform_to_supplier',
          status: 'success',
          processed_items: 142,
          failed_items: 0,
          created_at: new Date(Date.now() - 300000).toISOString(),
          details: { updated_products: 142, conflicts_resolved: 0 }
        },
        {
          id: '2',
          rule_name: 'BigBuy → Catalogue',
          sync_type: 'price',
          direction: 'supplier_to_platform',
          status: 'success',
          processed_items: 89,
          failed_items: 2,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          details: { price_updates: 87, errors: ['SKU not found: ABC123', 'Invalid price format: XYZ789'] }
        },
        {
          id: '3',
          rule_name: 'Shopify ↔ Stock Central',
          sync_type: 'stock',
          direction: 'platform_to_supplier',
          status: 'conflict',
          processed_items: 156,
          failed_items: 12,
          created_at: new Date(Date.now() - 900000).toISOString(),
          details: { conflicts: 12, resolved_automatically: 8, require_manual_review: 4 }
        }
      ]

      setSyncRules(mockRules)
      setSyncActivity(mockActivity)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de synchronisation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setSyncRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: enabled, next_sync: enabled ? new Date(Date.now() + 900000).toISOString() : null }
          : rule
      ))

      toast({
        title: enabled ? "Règle activée" : "Règle désactivée",
        description: `La synchronisation a été ${enabled ? 'activée' : 'désactivée'}`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle",
        variant: "destructive"
      })
    }
  }

  const triggerManualSync = async (ruleId: string) => {
    try {
      const rule = syncRules.find(r => r.id === ruleId)
      if (!rule) return

      toast({
        title: "Synchronisation lancée",
        description: `Synchronisation manuelle en cours pour ${rule.name}`
      })

      // Simulate sync process
      setTimeout(() => {
        setSyncRules(prev => prev.map(r => 
          r.id === ruleId 
            ? { ...r, last_sync: new Date().toISOString(), next_sync: new Date(Date.now() + 900000).toISOString() }
            : r
        ))

        // Add new activity
        const newActivity: SyncActivity = {
          id: Date.now().toString(),
          rule_name: rule.name,
          sync_type: rule.sync_type === 'both' ? 'stock' : rule.sync_type,
          direction: rule.source === 'platform' ? 'platform_to_supplier' : 'supplier_to_platform',
          status: 'success',
          processed_items: Math.floor(Math.random() * 200) + 50,
          failed_items: Math.floor(Math.random() * 5),
          created_at: new Date().toISOString(),
          details: { manual_trigger: true }
        }

        setSyncActivity(prev => [newActivity, ...prev.slice(0, 9)]) // Keep last 10 activities

        toast({
          title: "Synchronisation terminée",
          description: `${newActivity.processed_items} éléments synchronisés`
        })
      }, 3000)

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer la synchronisation",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'conflict': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'platform_to_supplier': return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'supplier_to_platform': return <TrendingDown className="w-4 h-4 text-green-600" />
      default: return <ArrowUpDown className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  const formatTimeUntil = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Maintenant'
    if (diffInMinutes < 60) return `Dans ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Dans ${Math.floor(diffInMinutes / 60)}h`
    return `Dans ${Math.floor(diffInMinutes / 1440)}j`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles globaux */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Synchronisation Bidirectionnelle
              </CardTitle>
              <CardDescription>
                Synchronisation automatique des stocks et prix entre vos plateformes
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="global-sync">Sync globale</Label>
                <Switch
                  id="global-sync"
                  checked={globalSyncEnabled}
                  onCheckedChange={setGlobalSyncEnabled}
                />
              </div>
              <Button onClick={loadSyncData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {syncRules.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Règles actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {syncActivity.filter(a => a.status === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">Syncs réussies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {syncActivity.filter(a => a.status === 'conflict').length}
            </div>
            <p className="text-xs text-muted-foreground">Conflits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(syncRules.reduce((acc, rule) => acc + rule.success_rate, 0) / syncRules.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Taux de succès</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Règles de synchronisation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Règles de Synchronisation</CardTitle>
            <CardDescription>
              Gérez vos règles de synchronisation automatique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncRules.map((rule) => (
                <div key={rule.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{rule.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {rule.sync_type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rule.frequency}
                        </Badge>
                        <Badge 
                          variant={rule.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dernière sync:</span>
                      <span>{rule.last_sync ? formatTimeAgo(rule.last_sync) : 'Jamais'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prochaine sync:</span>
                      <span>{formatTimeUntil(rule.next_sync)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taux de succès:</span>
                      <span className="text-green-600">{rule.success_rate}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerManualSync(rule.id)}
                      disabled={!rule.is_active}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync manuelle
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité Récente</CardTitle>
            <CardDescription>
              Historique des synchronisations récentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {syncActivity.map((activity) => (
                  <div key={activity.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(activity.status)}
                        {getDirectionIcon(activity.direction)}
                        <span className="font-medium text-sm">{activity.rule_name}</span>
                      </div>
                      <Badge 
                        variant={activity.status === 'success' ? 'default' : 
                               activity.status === 'failed' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Éléments traités:</span>
                        <span>{activity.processed_items}</span>
                      </div>
                      {activity.failed_items > 0 && (
                        <div className="flex justify-between">
                          <span>Échecs:</span>
                          <span className="text-red-600">{activity.failed_items}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Heure:</span>
                        <span>{formatTimeAgo(activity.created_at)}</span>
                      </div>
                    </div>

                    {activity.status === 'conflict' && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                        <p className="text-yellow-800">
                          {activity.details.require_manual_review} conflits nécessitent une révision manuelle
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}