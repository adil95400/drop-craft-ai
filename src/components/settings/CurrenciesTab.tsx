import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencySettingsPanel } from '@/components/currency/CurrencySettingsPanel';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { 
  useRateHistory, 
  useCurrencySettings,
  useConvertSupplierPrices,
  formatCurrency 
} from '@/hooks/useCurrency';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { 
  Settings2, 
  Calculator, 
  TrendingUp, 
  Zap,
  RefreshCw,
  CheckCircle2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export function CurrenciesTab() {
  const [activeSubTab, setActiveSubTab] = useState('settings');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Gestion Multi-Devise
        </CardTitle>
        <CardDescription>
          Configurez les devises, consultez les taux et convertissez vos prix
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings2 className="h-4 w-4 mr-1.5 hidden sm:block" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="converter" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 mr-1.5 hidden sm:block" />
              Convertisseur
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4 mr-1.5 hidden sm:block" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs sm:text-sm">
              <Zap className="h-4 w-4 mr-1.5 hidden sm:block" />
              Conversion Auto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0">
            <CurrencySettingsPanel />
          </TabsContent>

          <TabsContent value="converter" className="mt-0">
            <CurrencyConverter />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <RateHistoryPanel />
          </TabsContent>

          <TabsContent value="bulk" className="mt-0">
            <BulkConversionPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Panneau d'historique des taux
function RateHistoryPanel() {
  const { data: settings } = useCurrencySettings();
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [period, setPeriod] = useState<number>(30);
  
  const baseCurrency = settings?.default_currency || 'EUR';
  const { data: historyData, isLoading } = useRateHistory(baseCurrency, targetCurrency, period);

  const chartData = historyData?.history?.map(item => ({
    date: format(new Date(item.recorded_at), 'dd/MM', { locale: getDateFnsLocale() }),
    rate: item.rate,
    fullDate: format(new Date(item.recorded_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })
  })) || [];

  // Calculer les statistiques
  const rates = historyData?.history?.map(h => h.rate) || [];
  const minRate = rates.length ? Math.min(...rates) : 0;
  const maxRate = rates.length ? Math.max(...rates) : 0;
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const currentRate = rates.length ? rates[rates.length - 1] : 0;
  const variation = rates.length >= 2 
    ? ((rates[rates.length - 1] - rates[0]) / rates[0]) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Sélecteurs */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <CurrencySelector
            label="Devise cible"
            value={targetCurrency}
            onChange={setTargetCurrency}
          />
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={period === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(days)}
            >
              {days}j
            </Button>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Taux actuel"
          value={currentRate.toFixed(4)}
          suffix={targetCurrency}
        />
        <StatCard
          label="Minimum"
          value={minRate.toFixed(4)}
          suffix={targetCurrency}
          variant="muted"
        />
        <StatCard
          label="Maximum"
          value={maxRate.toFixed(4)}
          suffix={targetCurrency}
          variant="muted"
        />
        <StatCard
          label="Moyenne"
          value={avgRate.toFixed(4)}
          suffix={targetCurrency}
          variant="muted"
        />
        <StatCard
          label="Variation"
          value={`${variation >= 0 ? '+' : ''}${variation.toFixed(2)}%`}
          variant={variation >= 0 ? 'success' : 'destructive'}
        />
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Évolution {baseCurrency}/{targetCurrency}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => value.toFixed(3)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="text-sm text-muted-foreground">{data.fullDate}</p>
                          <p className="text-lg font-bold">
                            1 {baseCurrency} = {data.rate.toFixed(4)} {targetCurrency}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Aucune donnée disponible pour cette période
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Panneau de conversion en masse
function BulkConversionPanel() {
  const { data: settings } = useCurrencySettings();
  const convertSupplierPrices = useConvertSupplierPrices();
  const [conversionResult, setConversionResult] = useState<{
    converted: number;
    conversions: any[];
  } | null>(null);

  const handleBulkConvert = async () => {
    try {
      const result = await convertSupplierPrices.mutateAsync(undefined);
      setConversionResult(result);
    } catch (error) {
      console.error('Bulk conversion error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration actuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Conversion Automatique des Prix Fournisseurs
          </CardTitle>
          <CardDescription>
            Convertissez automatiquement tous les prix fournisseurs vers votre devise de vente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Devise fournisseur</p>
              <p className="text-xl font-bold">{settings?.supplier_currency || 'USD'}</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Devise de vente</p>
              <p className="text-xl font-bold">{settings?.default_currency || 'EUR'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleBulkConvert}
              disabled={convertSupplierPrices.isPending}
              className="flex-1"
            >
              {convertSupplierPrices.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Convertir tous les prix
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats de conversion */}
      {convertSupplierPrices.isPending && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Conversion en cours...</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {conversionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Conversion Terminée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {conversionResult.converted} produits convertis
              </Badge>
            </div>

            {conversionResult.conversions.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {conversionResult.conversions.slice(0, 10).map((conv, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                  >
                    <span className="text-muted-foreground">
                      {conv.formattedOriginal}
                    </span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {conv.formattedConverted}
                    </span>
                  </div>
                ))}
                {conversionResult.conversions.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    ... et {conversionResult.conversions.length - 10} autres conversions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Options avancées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options de Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Arrondi des prix</span>
                <Badge variant={settings?.round_prices ? 'default' : 'outline'}>
                  {settings?.round_prices ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Méthode: {settings?.rounding_method === 'up' ? 'Supérieur' : 
                  settings?.rounding_method === 'down' ? 'Inférieur' : 'Au plus proche'}
              </p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Décimales</span>
                <Badge variant="outline">{settings?.decimal_places || 2}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Précision des prix convertis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant de statistique
function StatCard({ 
  label, 
  value, 
  suffix,
  variant = 'default'
}: { 
  label: string; 
  value: string; 
  suffix?: string;
  variant?: 'default' | 'muted' | 'success' | 'destructive';
}) {
  const colorClass = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    success: 'text-green-600',
    destructive: 'text-red-600'
  }[variant];

  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>
        {value} {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
    </div>
  );
}

export default CurrenciesTab;
