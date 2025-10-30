import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save } from 'lucide-react';
import { usePriceStockMonitor } from '@/hooks/usePriceStockMonitor';
import { toast } from 'sonner';

export function MonitoringConfig() {
  const { createMonitor, isCreating } = usePriceStockMonitor();
  const [config, setConfig] = useState({
    catalog_product_id: '',
    check_frequency_minutes: 60,
    price_change_threshold: 5,
    stock_alert_threshold: 10,
    auto_adjust_price: false,
    max_price: 0,
    min_price: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.catalog_product_id) {
      toast.error('Sélectionnez un produit');
      return;
    }

    createMonitor({
      catalog_product_id: config.catalog_product_id,
      check_frequency_minutes: config.check_frequency_minutes,
      price_change_threshold: config.price_change_threshold,
      stock_alert_threshold: config.stock_alert_threshold,
      auto_adjust_price: config.auto_adjust_price,
      price_adjustment_rules: {
        max_price: config.max_price,
        min_price: config.min_price,
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration du Monitoring</h2>
        <p className="text-muted-foreground">Configurez la surveillance automatique des prix et stocks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Nouveau Monitoring
          </CardTitle>
          <CardDescription>
            Ajoutez un produit à surveiller automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produit du catalogue</Label>
                <Input
                  id="product"
                  placeholder="ID du produit"
                  value={config.catalog_product_id}
                  onChange={(e) => setConfig({ ...config, catalog_product_id: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Fréquence de vérification (min)</Label>
                  <Select
                    value={config.check_frequency_minutes.toString()}
                    onValueChange={(value) => setConfig({ ...config, check_frequency_minutes: parseInt(value) })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                      <SelectItem value="240">4 heures</SelectItem>
                      <SelectItem value="480">8 heures</SelectItem>
                      <SelectItem value="1440">24 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceThreshold">Seuil changement prix (%)</Label>
                  <Input
                    id="priceThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={config.price_change_threshold}
                    onChange={(e) => setConfig({ ...config, price_change_threshold: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockThreshold">Seuil d'alerte stock (unités)</Label>
                <Input
                  id="stockThreshold"
                  type="number"
                  min="0"
                  value={config.stock_alert_threshold}
                  onChange={(e) => setConfig({ ...config, stock_alert_threshold: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoAdjust">Ajustement automatique des prix</Label>
                    <p className="text-sm text-muted-foreground">
                      Ajuster automatiquement vos prix en fonction du marché
                    </p>
                  </div>
                  <Switch
                    id="autoAdjust"
                    checked={config.auto_adjust_price}
                    onCheckedChange={(checked) => setConfig({ ...config, auto_adjust_price: checked })}
                  />
                </div>

                {config.auto_adjust_price && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPrice">Prix minimum (€)</Label>
                      <Input
                        id="minPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.min_price}
                        onChange={(e) => setConfig({ ...config, min_price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPrice">Prix maximum (€)</Label>
                      <Input
                        id="maxPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.max_price}
                        onChange={(e) => setConfig({ ...config, max_price: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isCreating} className="w-full gap-2">
              <Save className="w-4 h-4" />
              Créer le monitoring
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités AutoDS</CardTitle>
          <CardDescription>Surveillance et automatisation complètes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Surveillance des prix en temps réel</p>
                <p className="text-xs text-muted-foreground">Alertes automatiques sur les changements</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Gestion intelligente du stock</p>
                <p className="text-xs text-muted-foreground">Réapprovisionnement automatique</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Auto-ordering intelligent</p>
                <p className="text-xs text-muted-foreground">Commandes automatiques basées sur vos règles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Historique et analytics</p>
                <p className="text-xs text-muted-foreground">Suivi complet de toutes les actions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
