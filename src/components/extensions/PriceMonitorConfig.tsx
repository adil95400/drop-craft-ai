import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign } from 'lucide-react';

export const PriceMonitorConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    pricingStrategy: 'match_lowest',
    priceOffset: 0.01,
    undercutPercentage: 5,
    minMargin: 20,
    minPrice: 1,
    maxPrice: 10000,
    minChangeAmount: 0.5,
    monitoringInterval: 60
  });

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('extension-price-monitor', {
        body: { action: 'configure', config }
      });

      if (error) throw error;

      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres de surveillance des prix ont été mis à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stratégie de Prix
          </CardTitle>
          <CardDescription>
            Définissez comment ajuster automatiquement vos prix face à la concurrence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Stratégie principale</Label>
            <Select 
              value={config.pricingStrategy} 
              onValueChange={(value) => setConfig({ ...config, pricingStrategy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match_lowest">Égaler le prix le plus bas</SelectItem>
                <SelectItem value="match_average">Égaler le prix moyen</SelectItem>
                <SelectItem value="undercut_percentage">Sous-coter d'un pourcentage</SelectItem>
                <SelectItem value="fixed_margin">Marge fixe minimale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.pricingStrategy === 'match_lowest' && (
            <div className="space-y-2">
              <Label>Décalage de prix (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.priceOffset}
                onChange={(e) => setConfig({ ...config, priceOffset: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground">
                Montant à soustraire du prix le plus bas
              </p>
            </div>
          )}

          {config.pricingStrategy === 'undercut_percentage' && (
            <div className="space-y-2">
              <Label>Pourcentage de sous-cotation (%)</Label>
              <Input
                type="number"
                step="1"
                value={config.undercutPercentage}
                onChange={(e) => setConfig({ ...config, undercutPercentage: parseFloat(e.target.value) })}
              />
            </div>
          )}

          {config.pricingStrategy === 'fixed_margin' && (
            <div className="space-y-2">
              <Label>Marge minimale (%)</Label>
              <Input
                type="number"
                step="1"
                value={config.minMargin}
                onChange={(e) => setConfig({ ...config, minMargin: parseFloat(e.target.value) })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix minimum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.minPrice}
                onChange={(e) => setConfig({ ...config, minPrice: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prix maximum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.maxPrice}
                onChange={(e) => setConfig({ ...config, maxPrice: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Changement minimum (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={config.minChangeAmount}
              onChange={(e) => setConfig({ ...config, minChangeAmount: parseFloat(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Ne pas ajuster si le changement est inférieur à ce montant
            </p>
          </div>

          <div className="space-y-2">
            <Label>Intervalle de surveillance (minutes)</Label>
            <Select 
              value={config.monitoringInterval.toString()} 
              onValueChange={(value) => setConfig({ ...config, monitoringInterval: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="240">4 heures</SelectItem>
                <SelectItem value="1440">1 jour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            Sauvegarder la stratégie
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
