import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { usePriceSync, PriceSyncConfig } from '@/hooks/usePriceSync';
import { DollarSign, TrendingDown, TrendingUp, BarChart3 } from 'lucide-react';

export function PriceSyncPanel() {
  const { syncPrices, isSyncing, lastSyncResult } = usePriceSync();
  const [config, setConfig] = useState<PriceSyncConfig>({
    strategy: 'lowest',
    margin_percent: 30,
    round_to: 0.99,
  });

  const handleSync = () => {
    syncPrices({ config });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Synchronisation Automatique des Prix
        </CardTitle>
        <CardDescription>
          Synchronisez vos prix sur tous les marketplaces selon votre stratégie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Stratégie de prix</Label>
          <RadioGroup
            value={config.strategy}
            onValueChange={(value) =>
              setConfig({ ...config, strategy: value as PriceSyncConfig['strategy'] })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lowest" id="lowest" />
              <Label htmlFor="lowest" className="flex items-center gap-2 font-normal cursor-pointer">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                Prix le plus bas (compétitif)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="highest" id="highest" />
              <Label htmlFor="highest" className="flex items-center gap-2 font-normal cursor-pointer">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Prix le plus élevé (premium)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="average" id="average" />
              <Label htmlFor="average" className="flex items-center gap-2 font-normal cursor-pointer">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Prix moyen (équilibré)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="margin_based" id="margin_based" />
              <Label htmlFor="margin_based" className="flex items-center gap-2 font-normal cursor-pointer">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Basé sur la marge
              </Label>
            </div>
          </RadioGroup>
        </div>

        {config.strategy === 'margin_based' && (
          <div className="space-y-2">
            <Label htmlFor="margin">Marge souhaitée (%)</Label>
            <Input
              id="margin"
              type="number"
              value={config.margin_percent || 30}
              onChange={(e) =>
                setConfig({ ...config, margin_percent: parseFloat(e.target.value) })
              }
              min={0}
              max={100}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rounding">Arrondi (ex: 0.99 pour prix terminant en .99)</Label>
          <Input
            id="rounding"
            type="number"
            step="0.01"
            value={config.round_to || 0.99}
            onChange={(e) =>
              setConfig({ ...config, round_to: parseFloat(e.target.value) })
            }
          />
        </div>

        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full"
        >
          {isSyncing ? 'Synchronisation...' : 'Synchroniser les prix'}
        </Button>

        {lastSyncResult && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Dernier résultat:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Produits synchronisés:</span>
                <p className="font-semibold">{lastSyncResult.products_synced}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Erreurs:</span>
                <p className="font-semibold text-destructive">{lastSyncResult.errors}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
