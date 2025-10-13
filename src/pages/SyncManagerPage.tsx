import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Helmet } from 'react-helmet-async'
import { 
  RefreshCw, CheckCircle, AlertCircle, Clock,
  Activity, Zap, Settings, TrendingUp,
  Database, Package, ShoppingCart, Users
} from 'lucide-react'

interface SyncSource {
  id: string
  name: string
  type: 'products' | 'orders' | 'inventory' | 'customers'
  platform: string
  status: 'active' | 'paused' | 'error'
  lastSync: string
  nextSync: string
  autoSync: boolean
  syncFrequency: string
  recordsSynced: number
}

export default function SyncManagerPage() {
  const { toast } = useToast()
  const [sources, setSources] = useState<SyncSource[]>([
    {
      id: '1',
      name: 'Shopify Store',
      type: 'products',
      platform: 'Shopify',
      status: 'active',
      lastSync: 'Il y a 15 min',
      nextSync: 'Dans 45 min',
      autoSync: true,
      syncFrequency: 'Toutes les heures',
      recordsSynced: 1250
    },
    {
      id: '2',
      name: 'WooCommerce Orders',
      type: 'orders',
      platform: 'WooCommerce',
      status: 'active',
      lastSync: 'Il y a 5 min',
      nextSync: 'Dans 25 min',
      autoSync: true,
      syncFrequency: 'Toutes les 30 min',
      recordsSynced: 342
    },
    {
      id: '3',
      name: 'AliExpress Inventory',
      type: 'inventory',
      platform: 'AliExpress',
      status: 'error',
      lastSync: 'Il y a 2h',
      nextSync: 'Pause',
      autoSync: false,
      syncFrequency: 'Manuel',
      recordsSynced: 0
    },
    {
      id: '4',
      name: 'Amazon Customers',
      type: 'customers',
      platform: 'Amazon',
      status: 'paused',
      lastSync: 'Il y a 1j',
      nextSync: 'Pause',
      autoSync: false,
      syncFrequency: 'Quotidien',
      recordsSynced: 89
    }
  ])

  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (sourceId: string) => {
    setSyncing(sourceId)
    
    setTimeout(() => {
      setSyncing(null)
      setSources(prev => prev.map(source => 
        source.id === sourceId 
          ? { ...source, lastSync: 'À l\'instant', status: 'active' as const }
          : source
      ))
      toast({
        title: "Synchronisation réussie",
        description: "Les données ont été synchronisées avec succès"
      })
    }, 2000)
  }

  const handleToggleAutoSync = (sourceId: string, enabled: boolean) => {
    setSources(prev => prev.map(source =>
      source.id === sourceId
        ? { ...source, autoSync: enabled, status: enabled ? 'active' as const : 'paused' as const }
        : source
    ))
    
    toast({
      title: enabled ? "Sync auto activée" : "Sync auto désactivée",
      description: `La synchronisation automatique a été ${enabled ? 'activée' : 'désactivée'}`
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'products': return <Package className="h-5 w-5" />
      case 'orders': return <ShoppingCart className="h-5 w-5" />
      case 'inventory': return <Database className="h-5 w-5" />
      case 'customers': return <Users className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="gap-1"><CheckCircle className="h-3 w-3" />Actif</Badge>
      case 'paused':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />En pause</Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Erreur</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    totalSyncs: sources.length,
    activeSyncs: sources.filter(s => s.status === 'active').length,
    totalRecords: sources.reduce((acc, s) => acc + s.recordsSynced, 0),
    errorSyncs: sources.filter(s => s.status === 'error').length
  }

  return (
    <>
      <Helmet>
        <title>Sync Manager - Drop Craft AI</title>
        <meta name="description" content="Gérez vos synchronisations bidirectionnelles automatiques" />
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Sync Manager</h1>
            <p className="text-muted-foreground">
              Synchronisation bidirectionnelle automatique de vos données
            </p>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Syncs</p>
                  <p className="text-2xl font-bold">{stats.totalSyncs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold">{stats.activeSyncs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enregistrements</p>
                  <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erreurs</p>
                  <p className="text-2xl font-bold">{stats.errorSyncs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Sources List */}
        <Card>
          <CardHeader>
            <CardTitle>Sources de synchronisation</CardTitle>
            <CardDescription>
              Gérez vos connexions et planifications de synchronisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map((source) => (
                <Card key={source.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-muted">
                            {getTypeIcon(source.type)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{source.name}</h3>
                              {getStatusBadge(source.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {source.platform}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{source.type}</span>
                              <span>•</span>
                              <span>{source.syncFrequency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(source.id)}
                            disabled={syncing === source.id}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncing === source.id ? 'animate-spin' : ''}`} />
                            {syncing === source.id ? 'Sync...' : 'Sync'}
                          </Button>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Dernière sync</p>
                          <p className="text-sm font-medium">{source.lastSync}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Prochaine sync</p>
                          <p className="text-sm font-medium">{source.nextSync}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Enregistrements</p>
                          <p className="text-sm font-medium">{source.recordsSynced.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Auto Sync Toggle */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label htmlFor={`auto-sync-${source.id}`} className="text-sm font-medium cursor-pointer">
                              Synchronisation automatique
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Synchroniser automatiquement selon la fréquence définie
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={`auto-sync-${source.id}`}
                          checked={source.autoSync}
                          onCheckedChange={(checked) => handleToggleAutoSync(source.id, checked)}
                        />
                      </div>

                      {/* Error Message */}
                      {source.status === 'error' && (
                        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                Erreur de synchronisation
                              </p>
                              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                La connexion API a échoué. Vérifiez vos identifiants.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Historique des synchronisations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { source: 'Shopify Store', action: 'Products synced', count: 45, time: 'Il y a 15 min', status: 'success' },
                { source: 'WooCommerce Orders', action: 'Orders synced', count: 12, time: 'Il y a 20 min', status: 'success' },
                { source: 'AliExpress Inventory', action: 'Sync failed', count: 0, time: 'Il y a 2h', status: 'error' },
                { source: 'Amazon Customers', action: 'Customers synced', count: 8, time: 'Il y a 1j', status: 'success' }
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {activity.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{activity.source}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{activity.count > 0 ? `${activity.count} items` : 'Failed'}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
