/**
 * ShippingEstimator — Inline widget for estimating shipping costs
 * Shows carrier options with prices for a given destination
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Truck, Clock, Euro, Zap, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ShippingRate {
  carrier: string;
  service: string;
  price: number;
  currency: string;
  estimated_days: number;
  is_recommended: boolean;
}

interface ShippingEstimatorProps {
  defaultWeight?: number;
  defaultCountry?: string;
  defaultPostalCode?: string;
  orderValue?: number;
  onSelectRate?: (rate: ShippingRate) => void;
  compact?: boolean;
}

const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'BE', name: 'Belgique' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CH', name: 'Suisse' },
  { code: 'AT', name: 'Autriche' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
];

export function ShippingEstimator({
  defaultWeight = 0.5,
  defaultCountry = 'FR',
  defaultPostalCode = '',
  orderValue = 0,
  onSelectRate,
  compact = false,
}: ShippingEstimatorProps) {
  const [country, setCountry] = useState(defaultCountry);
  const [postalCode, setPostalCode] = useState(defaultPostalCode);
  const [weight, setWeight] = useState(defaultWeight);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shipping-rate-calculator', {
        body: {
          destination_country: country,
          destination_postal_code: postalCode,
          weight,
          order_value: orderValue,
        }
      });

      if (error) throw error;

      // Normalize rates from the edge function
      const fetchedRates: ShippingRate[] = (data?.rates || []).map((r: any, idx: number) => ({
        carrier: r.carrier || r.carrier_name || 'Standard',
        service: r.service || r.service_name || 'Livraison standard',
        price: r.price || r.rate || 0,
        currency: r.currency || 'EUR',
        estimated_days: r.estimated_days || r.delivery_days || 3,
        is_recommended: idx === 0,
      }));

      // If no rates returned, provide fallback estimates
      if (fetchedRates.length === 0) {
        const isEU = ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'AT'].includes(country);
        setRates([
          {
            carrier: 'Colissimo',
            service: isEU ? 'International' : 'Mondial',
            price: isEU ? 6.90 + weight * 2 : 15.90 + weight * 4,
            currency: 'EUR',
            estimated_days: isEU ? 3 : 7,
            is_recommended: true,
          },
          {
            carrier: 'Chronopost',
            service: 'Express',
            price: isEU ? 12.50 + weight * 3 : 29.90 + weight * 6,
            currency: 'EUR',
            estimated_days: isEU ? 1 : 3,
            is_recommended: false,
          },
          {
            carrier: 'Mondial Relay',
            service: 'Point Relais',
            price: isEU ? 4.50 + weight * 1.5 : 0,
            currency: 'EUR',
            estimated_days: isEU ? 5 : 0,
            is_recommended: false,
          },
        ].filter(r => r.price > 0));
      } else {
        setRates(fetchedRates);
      }
    } catch (err) {
      // Fallback rates
      setRates([
        { carrier: 'Standard', service: 'Livraison standard', price: 5.90, currency: 'EUR', estimated_days: 5, is_recommended: true },
        { carrier: 'Express', service: 'Livraison express', price: 12.90, currency: 'EUR', estimated_days: 2, is_recommended: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRate(rate.carrier + rate.service);
    onSelectRate?.(rate);
  };

  return (
    <Card className="border-border">
      <CardHeader className={cn("pb-3", compact && "py-3 px-4")}>
        <CardTitle className={cn("flex items-center gap-2", compact ? "text-sm" : "text-base")}>
          <Truck className="h-4 w-4 text-primary" />
          Estimateur de frais d'expédition
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "px-4 pb-4")}>
        <div className={cn("grid gap-3", compact ? "grid-cols-4" : "grid-cols-3")}>
          <div className="space-y-1">
            <Label className="text-xs">Pays</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                {COUNTRIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Code postal</Label>
            <Input
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              placeholder="75001"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Poids (kg)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value) || 0.5)}
              className="h-8 text-xs"
            />
          </div>
          {compact && (
            <div className="flex items-end">
              <Button
                onClick={fetchRates}
                disabled={loading}
                size="sm"
                className="h-8 w-full text-xs"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Calculer'}
              </Button>
            </div>
          )}
        </div>

        {!compact && (
          <Button onClick={fetchRates} disabled={loading} size="sm" className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Calculer les tarifs
          </Button>
        )}

        {rates.length > 0 && (
          <div className="space-y-2">
            {rates.map((rate) => {
              const isSelected = selectedRate === rate.carrier + rate.service;
              return (
                <button
                  key={rate.carrier + rate.service}
                  onClick={() => handleSelectRate(rate)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 bg-background"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rate.carrier}</span>
                        {rate.is_recommended && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Zap className="h-2.5 w-2.5" />
                            Recommandé
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{rate.service}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {rate.estimated_days}j
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {rate.price.toFixed(2)} €
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
