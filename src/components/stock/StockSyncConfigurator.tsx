import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface StockSyncConfiguratorProps {
  configs: any[];
  upsertConfig: (config: any) => void;
  syncSupplier: (supplierId: string) => void;
}

export function StockSyncConfigurator({ configs, upsertConfig, syncSupplier }: StockSyncConfiguratorProps) {
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const handleSave = () => {
    if (selectedConfig) {
      upsertConfig(selectedConfig);
      setSelectedConfig(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration Synchronisation Stock</CardTitle>
          <CardDescription>
            Configurez la synchronisation automatique du stock depuis vos fournisseurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configs.map((config) => (
              <Card key={config.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">{config.suppliers?.name || 'Fournisseur'}</p>
                      <p className="text-sm text-muted-foreground">
                        Sync toutes les {config.sync_frequency_minutes} minutes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.sync_enabled}
                        onCheckedChange={(checked) => {
                          upsertConfig({ ...config, sync_enabled: checked });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncSupplier(config.supplier_id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedConfig(config)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Seuil stock faible</p>
                      <p className="font-bold">{config.low_stock_threshold} unités</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Action rupture</p>
                      <Badge variant="outline">{config.out_of_stock_action}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total syncs</p>
                      <p className="font-bold">{config.total_syncs}</p>
                    </div>
                  </div>

                  {config.last_error && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {config.last_error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {configs.length === 0 && (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucune configuration</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez vos fournisseurs pour activer la synchronisation du stock
                </p>
                <Button onClick={() => window.location.href = '/suppliers/browse'}>
                  Connecter des Fournisseurs
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      {selectedConfig && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Modifier Configuration</CardTitle>
            <CardDescription>{selectedConfig.suppliers?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Fréquence de synchronisation (minutes)</Label>
              <Input
                type="number"
                value={selectedConfig.sync_frequency_minutes}
                onChange={(e) => setSelectedConfig({ ...selectedConfig, sync_frequency_minutes: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Seuil stock faible</Label>
              <Input
                type="number"
                value={selectedConfig.low_stock_threshold}
                onChange={(e) => setSelectedConfig({ ...selectedConfig, low_stock_threshold: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Action en cas de rupture</Label>
              <Select
                value={selectedConfig.out_of_stock_action}
                onValueChange={(value) => setSelectedConfig({ ...selectedConfig, out_of_stock_action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disable">Désactiver le produit</SelectItem>
                  <SelectItem value="keep_visible">Garder visible</SelectItem>
                  <SelectItem value="notify_only">Notifier uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Enregistrer</Button>
              <Button variant="outline" onClick={() => setSelectedConfig(null)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
