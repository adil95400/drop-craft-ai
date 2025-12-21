import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAdvancedSync, ProductVariant } from '@/hooks/useAdvancedSync'
import { useRealIntegrations } from '@/hooks/useRealIntegrations'
import { Loader2, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export const AdvancedSyncInterface = () => {
  const { 
    integrations, 
    connectedIntegrations 
  } = useRealIntegrations()
  
  const {
    createProductWithVariants,
    updateInventoryLevels,
    syncProductVariants,
    manageSyncSchedule,
    triggerCronSync,
    productVariants,
    syncSchedules,
    syncLogs,
    isCreatingProduct,
    isUpdatingInventory,
    isSyncingVariants,
    isManagingSchedule,
    isTriggeringSync
  } = useAdvancedSync()

  const [selectedIntegration, setSelectedIntegration] = useState('')
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    tags: []
  })
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [newSchedule, setNewSchedule] = useState({
    integration_id: '',
    sync_type: 'inventory' as 'inventory' | 'prices' | 'products' | 'orders',
    frequency_minutes: 30,
    is_active: true
  })

  const addVariant = () => {
    setVariants([...variants, {
      variant_sku: '',
      name: '',
      options: { size: '', color: '' },
      price: 0,
      stock_quantity: 0
    }])
  }

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants]
    if (field.startsWith('options.')) {
      const optionKey = field.split('.')[1]
      updated[index].options[optionKey] = value
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setVariants(updated)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleCreateProduct = () => {
    if (!selectedIntegration || !productData.name || variants.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    const integration = connectedIntegrations.find(i => i.id === selectedIntegration)
    if (!integration) return

    const platform = integration.platform_name.toLowerCase() as 'shopify' | 'woocommerce'

    createProductWithVariants({
      integration_id: selectedIntegration,
      product_data: productData,
      variants_data: variants,
      platform
    })
  }

  const handleCreateSchedule = () => {
    if (!newSchedule.integration_id || !newSchedule.sync_type) {
      toast.error('Veuillez sélectionner une intégration et un type de synchronisation')
      return
    }

    manageSyncSchedule({
      action: 'create',
      schedule_data: newSchedule
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Synchronisation Avancée</h2>
          <p className="text-muted-foreground">
            Gestion complète des variantes et synchronisation automatique
          </p>
        </div>
        <Button 
          onClick={() => triggerCronSync()}
          disabled={isTriggeringSync}
          className="gap-2"
        >
          {isTriggeringSync ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync Maintenant
        </Button>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Produits & Variantes</TabsTrigger>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="schedules">Planification</TabsTrigger>
          <TabsTrigger value="logs">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer Produit avec Variantes</CardTitle>
              <CardDescription>
                Créez des produits variables avec gestion complète des tailles, couleurs et stocks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intégration cible</Label>
                  <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une intégration" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedIntegrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.platform_name} - {integration.shop_domain || integration.platform_url}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nom du produit</Label>
                  <Input 
                    value={productData.name}
                    onChange={(e) => setProductData({...productData, name: e.target.value})}
                    placeholder="Nom du produit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={productData.description}
                  onChange={(e) => setProductData({...productData, description: e.target.value})}
                  placeholder="Description du produit"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Variantes du produit</h3>
                <Button onClick={addVariant} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter Variante
                </Button>
              </div>

              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>SKU Variante</Label>
                        <Input 
                          value={variant.variant_sku}
                          onChange={(e) => updateVariant(index, 'variant_sku', e.target.value)}
                          placeholder="SKU-VAR-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select 
                          value={variant.options.size || ''} 
                          onValueChange={(value) => updateVariant(index, 'options.size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Taille" />
                          </SelectTrigger>
                          <SelectContent>
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <Select 
                          value={variant.options.color || ''} 
                          onValueChange={(value) => updateVariant(index, 'options.color', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Couleur" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune'].map(color => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prix (€)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock</Label>
                        <Input 
                          type="number"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={handleCreateProduct}
                disabled={isCreatingProduct}
                className="w-full gap-2"
              >
                {isCreatingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Créer Produit avec Variantes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion d'Inventaire</CardTitle>
              <CardDescription>
                Mise à jour des niveaux de stock en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                La gestion d'inventaire se fait automatiquement via les webhooks et la synchronisation planifiée.
                Consultez l'onglet "Historique" pour voir les dernières mises à jour.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planification des Synchronisations</CardTitle>
              <CardDescription>
                Configurez des synchronisations automatiques toutes les X minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Intégration</Label>
                  <Select 
                    value={newSchedule.integration_id} 
                    onValueChange={(value) => setNewSchedule({...newSchedule, integration_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Intégration" />
                    </SelectTrigger>
                    <SelectContent>
                      {connectedIntegrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.platform_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type de sync</Label>
                  <Select 
                    value={newSchedule.sync_type} 
                    onValueChange={(value: any) => setNewSchedule({...newSchedule, sync_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inventory">Inventaire</SelectItem>
                      <SelectItem value="prices">Prix</SelectItem>
                      <SelectItem value="products">Produits</SelectItem>
                      <SelectItem value="orders">Commandes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fréquence (min)</Label>
                  <Input 
                    type="number"
                    value={newSchedule.frequency_minutes}
                    onChange={(e) => setNewSchedule({...newSchedule, frequency_minutes: parseInt(e.target.value) || 30})}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCreateSchedule}
                    disabled={isManagingSchedule}
                    className="gap-2"
                  >
                    {isManagingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Créer
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Planifications actives</h3>
                {syncSchedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                            {schedule.sync_type}
                          </Badge>
                          <span className="text-sm">
                            Toutes les {schedule.frequency_minutes} min
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Dernière exécution: {schedule.last_run_at 
                            ? new Date(schedule.last_run_at).toLocaleString('fr-FR')
                            : 'Jamais'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={schedule.is_active}
                          onCheckedChange={(checked) => manageSyncSchedule({
                            action: 'update',
                            schedule_id: schedule.id,
                            schedule_data: { is_active: checked }
                          })}
                        />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => manageSyncSchedule({
                            action: 'delete',
                            schedule_id: schedule.id
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de Synchronisation</CardTitle>
              <CardDescription>
                Suivez toutes les synchronisations et leurs résultats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncLogs.map((log: any) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            log.status === 'success' ? 'default' : 
                            log.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {log.sync_type}
                          </Badge>
                          <span className="text-sm">
                            {log.integrations?.platform_name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.started_at).toLocaleString('fr-FR')} - 
                          Traités: {log.records_processed}, Réussis: {log.records_succeeded}, Échecs: {log.records_failed}
                        </p>
                        {log.error_message && (
                          <p className="text-sm text-destructive">{log.error_message}</p>
                        )}
                      </div>
                      <Badge variant={
                        log.status === 'success' ? 'default' : 
                        log.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {log.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}