import { useParams, NavLink } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useStores } from '@/hooks/useStores'

export function StoreSettingsPage() {
  const { storeId } = useParams()
  const { stores, disconnectStore } = useStores()
  
  const store = stores.find(s => s.id === storeId)

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Boutique non trouvée</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusIcon = {
    connected: <CheckCircle className="h-4 w-4 text-success" />,
    disconnected: <XCircle className="h-4 w-4 text-destructive" />,
    syncing: <Settings className="h-4 w-4 text-warning animate-spin" />,
    error: <AlertTriangle className="h-4 w-4 text-destructive" />
  }

  const statusLabels = {
    connected: 'Connectée',
    disconnected: 'Déconnectée',
    syncing: 'Synchronisation...',
    error: 'Erreur'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <NavLink to={`/stores/${storeId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </NavLink>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paramètres - {store.name}</h1>
            <p className="text-muted-foreground">Gérez les paramètres de votre boutique</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la boutique</Label>
                  <Input id="name" defaultValue={store.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domaine</Label>
                  <Input id="domain" defaultValue={store.domain} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Description de votre boutique" />
              </div>
            </CardContent>
          </Card>

          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de synchronisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Synchronisation automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Synchroniser automatiquement toutes les heures
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Webhook temps réel</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir les mises à jour en temps réel via webhook
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Synchroniser les images</Label>
                  <p className="text-sm text-muted-foreground">
                    Inclure les images de produits lors de la synchronisation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api_key">Clé API</Label>
                <Input 
                  id="api_key" 
                  type="password" 
                  defaultValue="••••••••••••••••"
                  readOnly
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret">Secret API</Label>
                <Input 
                  id="secret" 
                  type="password" 
                  defaultValue="••••••••••••••••"
                  readOnly
                />
              </div>
              
              <Button variant="outline" size="sm">
                Régénérer les clés API
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Déconnecter la boutique</h4>
                <p className="text-sm text-muted-foreground">
                  Cette action supprimera toutes les données synchronisées et déconnectera votre boutique.
                  Cette action est irréversible.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => disconnectStore(store.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Déconnecter la boutique
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statut de la connexion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {statusIcon[store.status]}
                <span className="font-medium">{statusLabels[store.status]}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Dernière synchronisation: {store.last_sync ? new Date(store.last_sync).toLocaleDateString() : 'Jamais'}
              </p>
            </CardContent>
          </Card>

          {/* Platform Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">
                {store.platform}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Connecté depuis: {new Date(store.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Produits:</span>
                <span className="font-medium">{store.products_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commandes:</span>
                <span className="font-medium">{store.orders_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Synchronisation:</span>
                <span className="font-medium">{store.settings.auto_sync ? 'Auto' : 'Manuel'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                Tester la connexion
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Forcer la synchronisation
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Vider le cache
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}