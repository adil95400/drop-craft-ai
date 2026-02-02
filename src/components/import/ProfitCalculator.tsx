/**
 * Calculateur de Profit - Intégré au flow d'import
 * Calcule la marge nette en intégrant tous les frais
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, 
  Percent, Package, CreditCard, Truck, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfitCalculatorProps {
  purchasePrice?: number;
  suggestedPrice?: number;
  currency?: string;
  onPriceChange?: (sellingPrice: number) => void;
  className?: string;
  compact?: boolean;
}

interface FeeConfig {
  stripeFeePercent: number;
  stripeFeeFixed: number;
  platformFeePercent: number;
  vatPercent: number;
  shippingCost: number;
}

const DEFAULT_FEES: FeeConfig = {
  stripeFeePercent: 2.9,
  stripeFeeFixed: 0.30,
  platformFeePercent: 2.0, // Shopify
  vatPercent: 20,
  shippingCost: 0,
};

export function ProfitCalculator({
  purchasePrice = 0,
  suggestedPrice,
  currency = 'EUR',
  onPriceChange,
  className,
  compact = false,
}: ProfitCalculatorProps) {
  const [sellingPrice, setSellingPrice] = useState(suggestedPrice || purchasePrice * 2);
  const [includeVat, setIncludeVat] = useState(true);
  const [fees, setFees] = useState<FeeConfig>(DEFAULT_FEES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculations = useMemo(() => {
    const revenue = sellingPrice;
    
    // Frais Stripe
    const stripeFees = (revenue * fees.stripeFeePercent / 100) + fees.stripeFeeFixed;
    
    // Frais plateforme (Shopify/WooCommerce)
    const platformFees = revenue * fees.platformFeePercent / 100;
    
    // TVA si applicable
    const vatAmount = includeVat ? revenue * fees.vatPercent / (100 + fees.vatPercent) : 0;
    
    // Coût de livraison
    const shippingCost = fees.shippingCost;
    
    // Calcul du profit
    const totalFees = stripeFees + platformFees + shippingCost;
    const revenueAfterVat = revenue - vatAmount;
    const grossProfit = revenueAfterVat - purchasePrice - totalFees;
    const netProfit = grossProfit;
    
    // Marges
    const grossMarginPercent = revenue > 0 ? ((revenue - purchasePrice) / revenue) * 100 : 0;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const markup = purchasePrice > 0 ? ((revenue - purchasePrice) / purchasePrice) * 100 : 0;
    
    return {
      revenue,
      stripeFees,
      platformFees,
      vatAmount,
      shippingCost,
      totalFees,
      grossProfit: revenue - purchasePrice,
      netProfit,
      grossMarginPercent,
      netMarginPercent,
      markup,
      isProfitable: netProfit > 0,
    };
  }, [sellingPrice, purchasePrice, fees, includeVat]);

  const handlePriceChange = (value: number) => {
    setSellingPrice(value);
    onPriceChange?.(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 10) return 'text-green-500';
    if (profit > 0) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProfitBadge = () => {
    if (calculations.netMarginPercent >= 30) {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Excellente marge</Badge>;
    }
    if (calculations.netMarginPercent >= 15) {
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Bonne marge</Badge>;
    }
    if (calculations.netMarginPercent >= 5) {
      return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Marge faible</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Non rentable</Badge>;
  };

  if (compact) {
    return (
      <div className={cn("p-4 rounded-lg border bg-card/50", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Calculateur</span>
          </div>
          {getProfitBadge()}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Achat</p>
            <p className="font-semibold">{formatCurrency(purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vente</p>
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
              className="h-8 text-center font-semibold"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Profit net</p>
            <p className={cn("font-bold", getProfitColor(calculations.netProfit))}>
              {formatCurrency(calculations.netProfit)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculateur de Profit
          </CardTitle>
          {getProfitBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Prix de base */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Prix d'achat
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={purchasePrice}
                readOnly
                className="pl-8 bg-muted/50"
              />
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Prix de vente
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={sellingPrice}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                className="pl-8"
                step="0.01"
              />
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Slider de marge */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Markup</span>
            <span className="font-medium">{calculations.markup.toFixed(0)}%</span>
          </div>
          <Slider
            value={[sellingPrice]}
            onValueChange={([value]) => handlePriceChange(value)}
            min={purchasePrice}
            max={purchasePrice * 5}
            step={0.1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(purchasePrice)}</span>
            <span>{formatCurrency(purchasePrice * 5)}</span>
          </div>
        </div>

        <Separator />

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={includeVat}
              onCheckedChange={setIncludeVat}
              id="include-vat"
            />
            <Label htmlFor="include-vat" className="text-sm cursor-pointer">
              Prix TTC (TVA {fees.vatPercent}%)
            </Label>
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary hover:underline"
          >
            {showAdvanced ? 'Masquer' : 'Options avancées'}
          </button>
        </div>

        {/* Options avancées */}
        {showAdvanced && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Frais Stripe (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>2.9% + 0.30€ par transaction</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  value={fees.stripeFeePercent}
                  onChange={(e) => setFees({ ...fees, stripeFeePercent: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  className="h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  Commission plateforme (%)
                </Label>
                <Input
                  type="number"
                  value={fees.platformFeePercent}
                  onChange={(e) => setFees({ ...fees, platformFeePercent: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  className="h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Frais de livraison
                </Label>
                <Input
                  type="number"
                  value={fees.shippingCost}
                  onChange={(e) => setFees({ ...fees, shippingCost: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  className="h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  TVA (%)
                </Label>
                <Input
                  type="number"
                  value={fees.vatPercent}
                  onChange={(e) => setFees({ ...fees, vatPercent: parseFloat(e.target.value) || 0 })}
                  step="1"
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Résumé des profits */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Détail des frais</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenu brut</span>
              <span>{formatCurrency(calculations.revenue)}</span>
            </div>
            
            <div className="flex justify-between text-red-500/80">
              <span>- Coût d'achat</span>
              <span>{formatCurrency(purchasePrice)}</span>
            </div>
            
            <div className="flex justify-between text-red-500/80">
              <span>- Frais Stripe</span>
              <span>{formatCurrency(calculations.stripeFees)}</span>
            </div>
            
            <div className="flex justify-between text-red-500/80">
              <span>- Commission plateforme</span>
              <span>{formatCurrency(calculations.platformFees)}</span>
            </div>
            
            {fees.shippingCost > 0 && (
              <div className="flex justify-between text-red-500/80">
                <span>- Livraison</span>
                <span>{formatCurrency(fees.shippingCost)}</span>
              </div>
            )}
            
            {includeVat && calculations.vatAmount > 0 && (
              <div className="flex justify-between text-orange-500/80">
                <span>- TVA ({fees.vatPercent}%)</span>
                <span>{formatCurrency(calculations.vatAmount)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Profit final */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {calculations.isProfitable ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className="font-semibold">Profit net</span>
            </div>
            <div className="text-right">
              <p className={cn("text-xl font-bold", getProfitColor(calculations.netProfit))}>
                {formatCurrency(calculations.netProfit)}
              </p>
              <p className={cn("text-sm", getProfitColor(calculations.netMarginPercent))}>
                {calculations.netMarginPercent.toFixed(1)}% de marge nette
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfitCalculator;
