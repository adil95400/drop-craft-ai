/**
 * Composant d'analyse des coûts et marges
 * Calcule la marge nette en incluant tous les frais
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Euro,
  Truck,
  CreditCard,
  Store,
  Percent,
  Info,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface CostBreakdown {
  supplierPrice: number;
  shippingCost: number;
  stripeFeesPercent: number;
  stripeFeesFixed: number;
  shopifyFees: number;
  vatPercent: number;
  sellingPrice: number;
}

const DEFAULT_COSTS: CostBreakdown = {
  supplierPrice: 15,
  shippingCost: 5,
  stripeFeesPercent: 2.9,
  stripeFeesFixed: 0.25,
  shopifyFees: 2,
  vatPercent: 20,
  sellingPrice: 45,
};

export function ImportCostAnalysis() {
  const [costs, setCosts] = useState<CostBreakdown>(DEFAULT_COSTS);
  const [currency, setCurrency] = useState('EUR');

  const currencySymbol = currency === 'EUR' ? '€' : '$';

  // Calculs détaillés
  const analysis = useMemo(() => {
    const { supplierPrice, shippingCost, stripeFeesPercent, stripeFeesFixed, shopifyFees, vatPercent, sellingPrice } = costs;

    // Coût de revient
    const costOfGoods = supplierPrice + shippingCost;

    // Frais de paiement Stripe (sur le prix de vente)
    const stripeFees = (sellingPrice * stripeFeesPercent / 100) + stripeFeesFixed;

    // Frais Shopify (sur le prix de vente)
    const shopifyFeesAmount = sellingPrice * (shopifyFees / 100);

    // Total des frais
    const totalFees = stripeFees + shopifyFeesAmount;

    // Marge brute (avant TVA)
    const grossMargin = sellingPrice - costOfGoods - totalFees;

    // TVA à reverser (si applicable)
    const vatAmount = sellingPrice * (vatPercent / 100 / (1 + vatPercent / 100));

    // Marge nette (après tous les frais)
    const netMargin = grossMargin - vatAmount;

    // Pourcentages
    const grossMarginPercent = (grossMargin / sellingPrice) * 100;
    const netMarginPercent = (netMargin / sellingPrice) * 100;

    // ROI
    const roi = ((netMargin / costOfGoods) * 100);

    // Seuil de rentabilité
    const breakEvenPrice = costOfGoods + totalFees + (costOfGoods + totalFees) * (vatPercent / 100 / (1 + vatPercent / 100));

    // Indicateurs de santé
    const isHealthy = netMarginPercent >= 20;
    const isWarning = netMarginPercent >= 10 && netMarginPercent < 20;
    const isDanger = netMarginPercent < 10;

    return {
      costOfGoods,
      stripeFees,
      shopifyFeesAmount,
      totalFees,
      grossMargin,
      vatAmount,
      netMargin,
      grossMarginPercent,
      netMarginPercent,
      roi,
      breakEvenPrice,
      isHealthy,
      isWarning,
      isDanger,
    };
  }, [costs]);

  const updateCost = (key: keyof CostBreakdown, value: number) => {
    setCosts(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setCosts(DEFAULT_COSTS);
  };

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10">
              <Calculator className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Calculateur de Marge</CardTitle>
              <CardDescription>
                Analysez la rentabilité de vos imports en temps réel
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR €</SelectItem>
                <SelectItem value="USD">USD $</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Cost inputs */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Coûts d'achat
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  Prix fournisseur
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={costs.supplierPrice}
                    onChange={(e) => updateCost('supplierPrice', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  Frais de livraison
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={costs.shippingCost}
                    onChange={(e) => updateCost('shippingCost', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Frais de vente
            </h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Commission Stripe
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Frais Stripe : {costs.stripeFeesPercent}% + {costs.stripeFeesFixed}€ par transaction</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={costs.stripeFeesPercent}
                      onChange={(e) => updateCost('stripeFeesPercent', parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <div className="relative w-24">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={costs.stripeFeesFixed}
                      onChange={(e) => updateCost('stripeFeesFixed', parseFloat(e.target.value) || 0)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  Commission Shopify
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[costs.shopifyFees]}
                    onValueChange={([value]) => updateCost('shopifyFees', value)}
                    max={5}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{costs.shopifyFees}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-muted-foreground" />
                  TVA applicable
                </Label>
                <Select
                  value={costs.vatPercent.toString()}
                  onValueChange={(value) => updateCost('vatPercent', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Hors UE)</SelectItem>
                    <SelectItem value="5.5">5.5% (Taux réduit)</SelectItem>
                    <SelectItem value="10">10% (Taux intermédiaire)</SelectItem>
                    <SelectItem value="20">20% (Taux normal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right: Selling price & results */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Prix de vente
            </h4>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary" />
                Prix de vente TTC
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  value={costs.sellingPrice}
                  onChange={(e) => updateCost('sellingPrice', parseFloat(e.target.value) || 0)}
                  className="pl-10 h-14 text-2xl font-bold"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Seuil de rentabilité : {analysis.breakEvenPrice.toFixed(2)} {currencySymbol}
              </p>
            </div>

            <Separator />

            {/* Results breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Décomposition
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coût de revient</span>
                  <span className="font-medium">-{analysis.costOfGoods.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais Stripe</span>
                  <span className="font-medium">-{analysis.stripeFees.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais Shopify</span>
                  <span className="font-medium">-{analysis.shopifyFeesAmount.toFixed(2)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA à reverser</span>
                  <span className="font-medium">-{analysis.vatAmount.toFixed(2)} {currencySymbol}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-medium">Marge nette</span>
                  <span className={cn(
                    "font-bold",
                    analysis.isHealthy && "text-green-600",
                    analysis.isWarning && "text-amber-600",
                    analysis.isDanger && "text-red-600"
                  )}>
                    {analysis.netMargin.toFixed(2)} {currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "p-4 rounded-xl text-center",
                analysis.isHealthy && "bg-green-500/10",
                analysis.isWarning && "bg-amber-500/10",
                analysis.isDanger && "bg-red-500/10"
              )}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {analysis.netMarginPercent >= 0 ? (
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      analysis.isHealthy && "text-green-600",
                      analysis.isWarning && "text-amber-600",
                      analysis.isDanger && "text-red-600"
                    )} />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={cn(
                    "text-2xl font-bold",
                    analysis.isHealthy && "text-green-600",
                    analysis.isWarning && "text-amber-600",
                    analysis.isDanger && "text-red-600"
                  )}>
                    {analysis.netMarginPercent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Marge nette</p>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <span className="text-2xl font-bold text-primary">
                  {analysis.roi.toFixed(0)}%
                </span>
                <p className="text-xs text-muted-foreground">ROI</p>
              </div>
            </div>

            {/* Health indicator */}
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg",
              analysis.isHealthy && "bg-green-500/10 text-green-700",
              analysis.isWarning && "bg-amber-500/10 text-amber-700",
              analysis.isDanger && "bg-red-500/10 text-red-700"
            )}>
              {analysis.isHealthy && <CheckCircle className="w-4 h-4" />}
              {analysis.isWarning && <AlertTriangle className="w-4 h-4" />}
              {analysis.isDanger && <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {analysis.isHealthy && "Excellente rentabilité"}
                {analysis.isWarning && "Rentabilité correcte, à surveiller"}
                {analysis.isDanger && "Marge insuffisante, révisez vos prix"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
