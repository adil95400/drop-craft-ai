import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, Truck, Clock, CheckCircle } from 'lucide-react';
import { useShippingZones, useShippingRates, calculateShippingCost, ShippingRate } from '@/hooks/useShippingZones';

export function ShippingCalculatorTab() {
  const { data: zones = [] } = useShippingZones();
  const { data: allRates = [] } = useShippingRates();
  const [zoneId, setZoneId] = useState('');
  const [weight, setWeight] = useState('1');
  const [orderTotal, setOrderTotal] = useState('50');
  const [result, setResult] = useState<{ rate: ShippingRate; cost: number; estimatedDays: string } | null>(null);
  const [noResult, setNoResult] = useState(false);

  const handleCalculate = () => {
    const zoneRates = allRates.filter(r => r.zone_id === zoneId);
    const calc = calculateShippingCost(zoneRates, parseFloat(weight) || 0, parseFloat(orderTotal) || 0);
    setResult(calc);
    setNoResult(!calc);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Calculateur de frais de port</h3>
        <p className="text-sm text-muted-foreground">Simulez le coût d'expédition pour une commande donnée</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Paramètres</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Zone de destination</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez une zone" /></SelectTrigger>
                <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} ({z.countries.length} pays)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Poids (kg)</Label>
                <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
              <div>
                <Label>Montant commande (€)</Label>
                <Input type="number" step="1" value={orderTotal} onChange={e => setOrderTotal(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCalculate} disabled={!zoneId} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />Calculer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Résultat</CardTitle></CardHeader>
          <CardContent>
            {!result && !noResult && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mb-4 opacity-30" />
                <p>Remplissez les paramètres et cliquez sur Calculer</p>
              </div>
            )}
            {noResult && (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
                <p className="font-semibold">Aucun tarif applicable</p>
                <p className="text-sm text-muted-foreground mt-1">Vérifiez vos zones et tarifs configurés</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary">
                    {result.cost === 0 ? (
                      <span className="text-success">GRATUIT</span>
                    ) : (
                      <>{result.cost.toFixed(2)} €</>
                    )}
                  </div>
                  {result.cost === 0 && (
                    <Badge className="mt-2 bg-success/10 text-success border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />Seuil de livraison gratuite atteint
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Tarif utilisé</span>
                    <span className="font-medium">{result.rate.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Tarif de base</span>
                    <span className="font-mono">{result.rate.base_rate.toFixed(2)} €</span>
                  </div>
                  {result.rate.per_kg_rate > 0 && (
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">Supplément poids</span>
                      <span className="font-mono">+{(result.rate.per_kg_rate * parseFloat(weight)).toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Délai estimé</span>
                    <span className="font-medium">{result.estimatedDays}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
