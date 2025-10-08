import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { WinnerProduct } from '@/domains/winners/types';

interface WinnersProfitCalculatorProps {
  product: WinnerProduct;
}

export const WinnersProfitCalculator = ({ product }: WinnersProfitCalculatorProps) => {
  const [sellingPrice, setSellingPrice] = useState(product.price);
  const [costPrice, setCostPrice] = useState(product.price * 0.3);
  const [shippingCost, setShippingCost] = useState(product.price * 0.1);
  const [platformFees, setPlatformFees] = useState(15); // pourcentage
  const [adCost, setAdCost] = useState(product.price * 0.15);
  const [monthlyUnits, setMonthlyUnits] = useState(product.sales || 100);
  const [taxRate, setTaxRate] = useState(20); // pourcentage

  // Calculs
  const platformFeesAmount = (sellingPrice * platformFees) / 100;
  const taxAmount = (sellingPrice * taxRate) / 100;
  const totalCosts = costPrice + shippingCost + platformFeesAmount + adCost + taxAmount;
  const profitPerUnit = sellingPrice - totalCosts;
  const profitMargin = ((profitPerUnit / sellingPrice) * 100);
  const monthlyProfit = profitPerUnit * monthlyUnits;
  const yearlyProfit = monthlyProfit * 12;
  const breakEvenUnits = adCost > 0 ? Math.ceil(adCost / profitPerUnit) : 0;
  const roi = adCost > 0 ? ((profitPerUnit - adCost) / adCost) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calculateur de Rentabilité Avancé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prix de vente</Label>
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Coût d'achat</Label>
            <Input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Frais d'expédition</Label>
            <Input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Coût pub par vente</Label>
            <Input
              type="number"
              value={adCost}
              onChange={(e) => setAdCost(Number(e.target.value))}
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Frais plateforme (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[platformFees]}
                onValueChange={(value) => setPlatformFees(value[0])}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{platformFees}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Taxes (%)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[taxRate]}
                onValueChange={(value) => setTaxRate(value[0])}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{taxRate}%</span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Ventes mensuelles estimées</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[monthlyUnits]}
                onValueChange={(value) => setMonthlyUnits(value[0])}
                max={1000}
                step={10}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{monthlyUnits} unités</span>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold">Résultats</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Profit/unité</span>
                </div>
                <div className={`text-2xl font-bold ${profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitPerUnit.toFixed(2)} {product.currency}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Marge</span>
                </div>
                <div className={`text-2xl font-bold ${profitMargin > 20 ? 'text-green-600' : profitMargin > 10 ? 'text-orange-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Mensuel</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {monthlyProfit.toFixed(0)} {product.currency}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Annuel</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {yearlyProfit.toFixed(0)} {product.currency}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques supplémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 border rounded-lg">
              <h5 className="font-semibold text-sm">Seuil de Rentabilité</h5>
              <div className="text-2xl font-bold">{breakEvenUnits} unités</div>
              <p className="text-xs text-muted-foreground">
                Nombre de ventes nécessaires pour couvrir les coûts publicitaires
              </p>
            </div>

            <div className="space-y-2 p-4 border rounded-lg">
              <h5 className="font-semibold text-sm">ROI (Retour sur Investissement)</h5>
              <div className={`text-2xl font-bold ${roi > 100 ? 'text-green-600' : roi > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Retour sur investissement publicitaire
              </p>
            </div>
          </div>

          {/* Détail des coûts */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h5 className="font-semibold text-sm">Détail des Coûts par Unité</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coût produit</span>
                <span className="font-medium">{costPrice.toFixed(2)} {product.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expédition</span>
                <span className="font-medium">{shippingCost.toFixed(2)} {product.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais plateforme ({platformFees}%)</span>
                <span className="font-medium">{platformFeesAmount.toFixed(2)} {product.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publicité</span>
                <span className="font-medium">{adCost.toFixed(2)} {product.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes ({taxRate}%)</span>
                <span className="font-medium">{taxAmount.toFixed(2)} {product.currency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total coûts</span>
                <span>{totalCosts.toFixed(2)} {product.currency}</span>
              </div>
              <div className={`flex justify-between pt-2 border-t font-bold ${profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span>Profit net</span>
                <span>{profitPerUnit.toFixed(2)} {product.currency}</span>
              </div>
            </div>
          </div>

          {/* Recommandations */}
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="font-semibold text-sm text-blue-900 dark:text-blue-100">💡 Recommandations</h5>
            <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
              {profitMargin < 20 && (
                <li>• Marge faible : Essayez de négocier le prix d'achat ou d'augmenter le prix de vente</li>
              )}
              {profitMargin >= 20 && profitMargin < 30 && (
                <li>• Marge correcte : Vous pouvez investir plus en publicité pour augmenter le volume</li>
              )}
              {profitMargin >= 30 && (
                <li>• Excellente marge : Produit très rentable, idéal pour scaler rapidement</li>
              )}
              {adCost / sellingPrice > 0.2 && (
                <li>• Coût pub élevé : Optimisez vos campagnes ou testez d'autres canaux</li>
              )}
              {breakEvenUnits > monthlyUnits && (
                <li>• Attention : Vos ventes actuelles ne couvrent pas vos coûts publicitaires</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
