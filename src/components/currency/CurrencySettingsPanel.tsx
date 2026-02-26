import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CurrencySelector } from './CurrencySelector';
import { 
  useCurrencySettings, 
  useUpdateCurrencySettings,
  useRefreshRates,
  useExchangeRates 
} from '@/hooks/useCurrency';
import { RefreshCw, DollarSign, TrendingUp, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';

export function CurrencySettingsPanel() {
  const { data: settings, isLoading } = useCurrencySettings();
  const updateSettings = useUpdateCurrencySettings();
  const refreshRates = useRefreshRates();
  const { data: ratesData } = useExchangeRates(settings?.default_currency);

  const handleUpdate = (key: string, value: any) => {
    updateSettings.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paramètres de devise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Paramètres Multi-Devise
          </CardTitle>
          <CardDescription>
            Configurez vos devises par défaut et les options de conversion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Devises principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CurrencySelector
              label="Devise par défaut (vente)"
              value={settings?.default_currency || 'EUR'}
              onChange={(v) => handleUpdate('default_currency', v)}
            />
            <CurrencySelector
              label="Devise d'affichage"
              value={settings?.display_currency || 'EUR'}
              onChange={(v) => handleUpdate('display_currency', v)}
            />
            <CurrencySelector
              label="Devise fournisseur"
              value={settings?.supplier_currency || 'USD'}
              onChange={(v) => handleUpdate('supplier_currency', v)}
            />
          </div>

          {/* Options de conversion */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Options de conversion
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Conversion automatique</Label>
                  <p className="text-xs text-muted-foreground">
                    Convertir automatiquement les prix fournisseurs
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_convert_prices ?? true}
                  onCheckedChange={(v) => handleUpdate('auto_convert_prices', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Afficher prix originaux</Label>
                  <p className="text-xs text-muted-foreground">
                    Montrer le prix d'origine à côté
                  </p>
                </div>
                <Switch
                  checked={settings?.show_original_prices ?? true}
                  onCheckedChange={(v) => handleUpdate('show_original_prices', v)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Arrondir les prix</Label>
                  <p className="text-xs text-muted-foreground">
                    Arrondir les prix convertis
                  </p>
                </div>
                <Switch
                  checked={settings?.round_prices ?? true}
                  onCheckedChange={(v) => handleUpdate('round_prices', v)}
                />
              </div>

              <div className="p-3 rounded-lg border">
                <Label className="mb-2 block">Méthode d'arrondi</Label>
                <Select
                  value={settings?.rounding_method || 'nearest'}
                  onValueChange={(v) => handleUpdate('rounding_method', v)}
                  disabled={!settings?.round_prices}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Au plus proche</SelectItem>
                    <SelectItem value="up">Arrondi supérieur</SelectItem>
                    <SelectItem value="down">Arrondi inférieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-lg border">
              <Label className="mb-2 block">Décimales</Label>
              <Select
                value={String(settings?.decimal_places || 2)}
                onValueChange={(v) => handleUpdate('decimal_places', parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Taux de change actuels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Taux de Change Actuels
            </CardTitle>
            <CardDescription>
              Base: {settings?.default_currency || 'EUR'}
              {ratesData?.fetchedAt && (
                <span className="ml-2">
                  • Mis à jour {formatDistanceToNow(new Date(ratesData.fetchedAt), { addSuffix: true, locale: getDateFnsLocale() })}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshRates.mutate(settings?.default_currency)}
            disabled={refreshRates.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshRates.isPending ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ratesData?.rates && Object.entries(ratesData.rates).slice(0, 10).map(([currency, data]) => (
              <div 
                key={currency}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{currency}</span>
                  <span className="text-xs text-muted-foreground">
                    {data.rate.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  1 {settings?.default_currency} = {data.rate.toFixed(2)} {currency}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
