import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Trash2, RefreshCw, Settings, Shield, Zap } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useToast } from '@/hooks/use-toast'

export function StoreSettingsPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const { stores, updateStoreSettings, disconnectStore } = useStores()
  const { toast } = useToast()
  
  const store = stores.find(s => s.id === storeId)
  const [settings, setSettings] = useState(store?.settings || {
    auto_sync: true,
    sync_frequency: 'hourly' as 'hourly' | 'daily' | 'weekly',
    sync_products: true,
    sync_orders: true,
    sync_customers: true
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (store) {
      setSettings(store.settings)
    }
  }, [store])

  if (!store) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Boutique non trouvée</h1>
          <Button onClick={() => navigate('/dashboard/stores')}>
            Retour aux boutiques
          </Button>
        </div>
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateStoreSettings(store.id, settings)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnectStore = async () => {
    if (confirm('Êtes-vous sûr de vouloir déconnecter cette boutique ? Cette action est irréversible.')) {
      await disconnectStore(store.id)
      navigate('/dashboard/stores')
    }
  }

  const webhookUrl = `${window.location.origin}/api/webhooks/stores/${store.id}`

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard/stores')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Paramètres de {store.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{store.platform}</Badge>
            <Badge className={`${
              store.status === 'connected' ? 'bg-success text-success-foreground' :
              store.status === 'syncing' ? 'bg-warning text-warning-foreground' :
              'bg-destructive text-destructive-foreground'
            }`}>
              {store.status === 'connected' ? 'Connectée' :
               store.status === 'syncing' ? 'Synchronisation...' :
               store.status === 'error' ? 'Erreur' : 'Déconnectée'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Synchronisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">Synchronisation automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Synchronise automatiquement les données selon la fréquence définie
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={settings.auto_sync}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_sync: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sync-frequency">Fréquence de synchronisation</Label>
                <Select
                  value={settings.sync_frequency}
                  onValueChange={(value: 'hourly' | 'daily' | 'weekly') =>
                    setSettings({ ...settings, sync_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Données à synchroniser</Label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync-products">Produits</Label>
                    <p className="text-sm text-muted-foreground">
                      Synchronise les produits, prix et stock
                    </p>
                  </div>
                  <Switch
                    id="sync-products"
                    checked={settings.sync_products}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, sync_products: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync-orders">Commandes</Label>
                    <p className="text-sm text-muted-foreground">
                      Synchronise les commandes et leur statut
                    </p>
                  </div>
                  <Switch
                    id="sync-orders"
                    checked={settings.sync_orders}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, sync_orders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sync-customers">Clients</Label>
                    <p className="text-sm text-muted-foreground">
                      Synchronise les informations clients
                    </p>
                  </div>
                  <Switch
                    id="sync-customers"
                    checked={settings.sync_customers}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, sync_customers: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Webhooks (Temps réel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configurez cette URL dans votre boutique {store.platform} pour recevoir les mises à jour en temps réel.
              </p>
              
              <div>
                <Label htmlFor="webhook-url">URL de webhook</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl)
                      toast({
                        title: "Copié",
                        description: "URL copiée dans le presse-papier"
                      })
                    }}
                  >
                    Copier
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Événements supportés :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Création/modification de produits</li>
                  <li>• Nouvelles commandes</li>
                  <li>• Changements de stock</li>
                  <li>• Déconnexion de l'app</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Info & Actions */}
        <div className="space-y-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Nom</Label>
                <p className="text-sm font-medium">{store.name}</p>
              </div>
              <div>
                <Label>Domaine</Label>
                <p className="text-sm font-medium">{store.domain}</p>
              </div>
              <div>
                <Label>Plateforme</Label>
                <p className="text-sm font-medium">{store.platform}</p>
              </div>
              <div>
                <Label>Dernière sync</Label>
                <p className="text-sm font-medium">
                  {store.last_sync ? new Date(store.last_sync).toLocaleString('fr-FR') : 'Jamais'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                onClick={handleDisconnectStore}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}