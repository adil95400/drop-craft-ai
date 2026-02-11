import { useState, useEffect } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
    sync_customers: true,
    notification_email: true,
    webhook_enabled: true,
    inventory_tracking: true,
    price_sync: true,
    stock_alerts: true,
    low_stock_threshold: 10,
    sync_timeout: 300,
    error_retry_count: 3,
    batch_size: 100
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (store) {
      setSettings(store.settings)
    }
  }, [store])

  if (!store) {
    return (
      <ChannablePageWrapper
        title="Boutique non trouvée"
        description="La boutique demandée n'existe pas"
        heroImage="integrations"
        badge={{ label: 'Boutique', icon: Settings }}
      >
        <div className="text-center py-8">
          <Button onClick={() => navigate('/stores-channels')}>Retour aux boutiques</Button>
        </div>
      </ChannablePageWrapper>
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

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const handleDisconnectStore = async () => {
    setShowDisconnectConfirm(true)
  }

  const confirmDisconnect = async () => {
    await disconnectStore(store.id)
    navigate('/stores-channels')
    setShowDisconnectConfirm(false)
  }

  const webhookUrl = `${window.location.origin}/api/webhooks/stores/${store.id}`

  return (
    <ChannablePageWrapper
      title={`Paramètres de ${store.name}`}
      description="Configurez la synchronisation et les paramètres de votre boutique"
      heroImage="settings"
      badge={{ label: 'Paramètres', icon: Settings }}
      actions={
        <Button variant="ghost" size="sm" onClick={() => navigate('/stores-channels')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
      }
    >
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

          {/* Paramètres avancés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres avancés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notification-email">Notifications email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des emails lors des événements importants
                  </p>
                </div>
                <Switch
                  id="notification-email"
                  checked={settings.notification_email || false}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notification_email: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="webhook-enabled">Webhooks temps réel</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les mises à jour en temps réel via webhooks
                  </p>
                </div>
                <Switch
                  id="webhook-enabled"
                  checked={settings.webhook_enabled || false}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, webhook_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inventory-tracking">Suivi des stocks</Label>
                  <p className="text-sm text-muted-foreground">
                    Surveiller et alerter sur les niveaux de stock
                  </p>
                </div>
                <Switch
                  id="inventory-tracking"
                  checked={settings.inventory_tracking || false}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, inventory_tracking: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="price-sync">Synchronisation des prix</Label>
                  <p className="text-sm text-muted-foreground">
                    Garder les prix synchronisés automatiquement
                  </p>
                </div>
                <Switch
                  id="price-sync"
                  checked={settings.price_sync || false}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, price_sync: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="stock-alerts">Alertes de stock</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes quand le stock devient faible
                  </p>
                </div>
                <Switch
                  id="stock-alerts"
                  checked={settings.stock_alerts || false}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, stock_alerts: checked })
                  }
                />
              </div>

              {settings.stock_alerts && (
                <div>
                  <Label htmlFor="low-stock-threshold">Seuil de stock faible</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.low_stock_threshold || 10}
                    onChange={(e) => 
                      setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nombre d'unités restantes pour déclencher l'alerte
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sync-timeout">Timeout sync (secondes)</Label>
                  <Input
                    id="sync-timeout"
                    type="number"
                    min="60"
                    max="3600"
                    value={settings.sync_timeout || 300}
                    onChange={(e) => 
                      setSettings({ ...settings, sync_timeout: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="batch-size">Taille des lots</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.batch_size || 100}
                    onChange={(e) => 
                      setSettings({ ...settings, batch_size: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="error-retry-count">Tentatives en cas d'erreur</Label>
                <Select
                  value={String(settings.error_retry_count || 3)}
                  onValueChange={(value) =>
                    setSettings({ ...settings, error_retry_count: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tentative</SelectItem>
                    <SelectItem value="3">3 tentatives</SelectItem>
                    <SelectItem value="5">5 tentatives</SelectItem>
                    <SelectItem value="10">10 tentatives</SelectItem>
                  </SelectContent>
                </Select>
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
      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title="Déconnecter cette boutique ?"
        description="Cette action est irréversible. Toutes les données seront perdues."
        confirmText="Déconnecter"
        variant="destructive"
        onConfirm={confirmDisconnect}
      />
    </ChannablePageWrapper>
  )
}