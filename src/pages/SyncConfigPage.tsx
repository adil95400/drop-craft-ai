import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  Clock, 
  Filter, 
  Package, 
  ShoppingCart, 
  BarChart3,
  Tag,
  DollarSign,
  Boxes,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSyncConfig, type SyncConfiguration, type SyncConfigFilters } from '@/hooks/useSyncConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

export default function SyncConfigPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const connectorId = searchParams.get('connector');
  
  const { configs, getConfig, saveConfig, isSaving } = useSyncConfig();
  const existingConfig = connectorId ? getConfig(connectorId) : null;

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'manual'>('daily');
  const [syncTypes, setSyncTypes] = useState<string[]>(['products']);
  const [filters, setFilters] = useState<SyncConfigFilters>({});
  const [selectedIntegration, setSelectedIntegration] = useState(connectorId || '');
  const [syncDirection, setSyncDirection] = useState<'import' | 'export' | 'bidirectional'>('import');

  const { data: integrations } = useQuery({
    queryKey: ['store-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingConfig) {
      setEnabled(existingConfig.is_active);
      setFrequency(existingConfig.sync_frequency);
      setSyncTypes(existingConfig.sync_entities);
      setFilters(existingConfig.filters || {});
      setSelectedIntegration(existingConfig.connector_id);
      setSyncDirection(existingConfig.sync_direction as any);
    }
  }, [existingConfig]);

  const handleSyncTypeToggle = (type: string) => {
    setSyncTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleFilterChange = (key: keyof SyncConfigFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (!selectedIntegration) {
      toast.error('Veuillez sélectionner une intégration');
      return;
    }

    const config: Partial<SyncConfiguration> = {
      id: existingConfig?.id,
      connector_id: selectedIntegration,
      sync_direction: syncDirection,
      sync_frequency: frequency,
      sync_entities: syncTypes,
      is_active: enabled,
      filters: filters,
      auto_resolve_conflicts: false,
      conflict_resolution_rules: {},
      field_mappings: {},
    };

    saveConfig(config);
  };

  return (
    <>
      <Helmet>
        <title>Configuration de Synchronisation - ShopOpti</title>
        <meta name="description" content="Configurez les paramètres avancés de synchronisation" />
      </Helmet>

      <ChannablePageWrapper
        title="Configuration de Synchronisation"
        description="Personnalisez les paramètres de synchronisation automatique"
        heroImage="settings"
        badge={{ label: 'Sync', icon: Settings }}
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        }
      >
        {/* Sélection de l'intégration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Intégration
            </CardTitle>
            <CardDescription>
              Sélectionnez l'intégration à configurer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une intégration" />
              </SelectTrigger>
              <SelectContent>
                {integrations?.map((integration) => (
                  <SelectItem key={integration.id} value={integration.id}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{integration.platform}</span>
                      {integration.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Configuration générale */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Paramètres Généraux
            </CardTitle>
            <CardDescription>
              Activez et configurez la fréquence de synchronisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Synchronisation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Activer la synchronisation automatique selon la fréquence définie
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fréquence de synchronisation</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="manual">Manuelle uniquement</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {frequency === 'manual' 
                    ? 'La synchronisation sera déclenchée manuellement uniquement'
                    : `Les données seront synchronisées automatiquement ${
                        frequency === 'hourly' ? 'toutes les heures' :
                        frequency === 'daily' ? 'tous les jours' : 'toutes les semaines'
                      }`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label>Direction de synchronisation</Label>
                <Select value={syncDirection} onValueChange={(v: any) => setSyncDirection(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import">Import uniquement</SelectItem>
                    <SelectItem value="export">Export uniquement</SelectItem>
                    <SelectItem value="bidirectional">Bidirectionnel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {syncDirection === 'import' 
                    ? 'Importer les données depuis la plateforme'
                    : syncDirection === 'export'
                    ? 'Exporter les données vers la plateforme'
                    : 'Synchronisation dans les deux sens'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Types de données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Types de Données
            </CardTitle>
            <CardDescription>
              Sélectionnez les types de données à synchroniser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  syncTypes.includes('products') 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSyncTypeToggle('products')}
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5 text-primary" />
                  {syncTypes.includes('products') && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h4 className="font-semibold">Produits</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Catalogue complet des produits
                </p>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  syncTypes.includes('orders') 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSyncTypeToggle('orders')}
              >
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {syncTypes.includes('orders') && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h4 className="font-semibold">Commandes</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Historique des commandes
                </p>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  syncTypes.includes('inventory') 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSyncTypeToggle('inventory')}
              >
                <div className="flex items-center justify-between mb-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  {syncTypes.includes('inventory') && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h4 className="font-semibold">Inventaire</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Niveaux de stock en temps réel
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres de Synchronisation
            </CardTitle>
            <CardDescription>
              Affinez les données à synchroniser avec des filtres personnalisés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix minimum
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix maximum
                </Label>
                <Input
                  type="number"
                  placeholder="999.99"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Stock minimum
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minStock || ''}
                onChange={(e) => handleFilterChange('minStock', e.target.value ? parseInt(e.target.value) : undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Synchroniser uniquement les produits avec au moins ce nombre d'unités en stock
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Catégories
              </Label>
              <Input
                placeholder="Électronique, Vêtements, etc. (séparés par des virgules)"
                value={filters.categories?.join(', ') || ''}
                onChange={(e) => handleFilterChange('categories', e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined)}
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour synchroniser toutes les catégories
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Marques
              </Label>
              <Input
                placeholder="Nike, Adidas, etc. (séparés par des virgules)"
                value={filters.brands?.join(', ') || ''}
                onChange={(e) => handleFilterChange('brands', e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <Input
                placeholder="promo, nouveauté, etc. (séparés par des virgules)"
                value={filters.tags?.join(', ') || ''}
                onChange={(e) => handleFilterChange('tags', e.target.value ? e.target.value.split(',').map(s => s.trim()) : undefined)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Résumé de la Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? 'Activée' : 'Désactivée'}
              </Badge>
              <span className="text-sm">Synchronisation {frequency}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {syncTypes.map(type => (
                <Badge key={type} variant="outline">
                  {type === 'products' ? 'Produits' : type === 'orders' ? 'Commandes' : 'Inventaire'}
                </Badge>
              ))}
            </div>
            {Object.keys(filters).length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {Object.keys(filters).filter(k => (filters as any)[k] !== undefined).length} filtres actifs
              </p>
            )}
          </CardContent>
        </Card>
      </ChannablePageWrapper>
    </>
  );
}
