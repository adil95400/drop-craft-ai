import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfitCalculator } from '@/hooks/useProfitCalculator';
import { Calculator, TrendingUp, TrendingDown, Sparkles, Save, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function ProfitCalculator() {
  const { config, saveCalculation, getAISuggestions, isSaving, isLoadingAI } = useProfitCalculator();
  
  const [formData, setFormData] = useState({
    productName: '',
    sellingPrice: '',
    productCost: '',
    shippingCost: config?.default_shipping_cost?.toString() || '0',
    packagingCost: config?.default_packaging_cost?.toString() || '0',
    transactionFeePercent: config?.default_transaction_fee_percent?.toString() || '2.9',
    adCostPercent: config?.default_ad_cost_percent?.toString() || '15',
    vatPercent: config?.default_vat_percent?.toString() || '20',
    otherCosts: '0'
  });

  const [results, setResults] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (config) {
      setFormData(prev => ({
        ...prev,
        shippingCost: config.default_shipping_cost?.toString() || '0',
        packagingCost: config.default_packaging_cost?.toString() || '0',
        transactionFeePercent: config.default_transaction_fee_percent?.toString() || '2.9',
        adCostPercent: config.default_ad_cost_percent?.toString() || '15',
        vatPercent: config.default_vat_percent?.toString() || '20',
      }));
    }
  }, [config]);

  const calculateProfit = () => {
    const sellingPrice = parseFloat(formData.sellingPrice) || 0;
    const productCost = parseFloat(formData.productCost) || 0;
    const shippingCost = parseFloat(formData.shippingCost) || 0;
    const packagingCost = parseFloat(formData.packagingCost) || 0;
    const otherCosts = parseFloat(formData.otherCosts) || 0;
    
    const transactionFee = (sellingPrice * parseFloat(formData.transactionFeePercent)) / 100;
    const adCost = (sellingPrice * parseFloat(formData.adCostPercent)) / 100;
    const vat = (sellingPrice * parseFloat(formData.vatPercent)) / 100;
    
    const totalCosts = productCost + shippingCost + packagingCost + transactionFee + adCost + vat + otherCosts;
    const netProfit = sellingPrice - totalCosts;
    const profitMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const roi = productCost > 0 ? (netProfit / productCost) * 100 : 0;
    const breakeven = netProfit > 0 ? Math.ceil((productCost + shippingCost + packagingCost + otherCosts) / netProfit) : 0;

    setResults({
      sellingPrice,
      totalCosts,
      netProfit,
      profitMargin,
      roi,
      breakeven,
      breakdown: {
        productCost,
        shippingCost,
        packagingCost,
        transactionFee,
        adCost,
        vat,
        otherCosts
      }
    });
  };

  useEffect(() => {
    if (formData.sellingPrice && formData.productCost) {
      calculateProfit();
    }
  }, [formData]);

  const handleGetAISuggestions = async () => {
    if (!results) return;
    
    const suggestions = await getAISuggestions({
      productName: formData.productName,
      sellingPrice: results.sellingPrice,
      productCost: results.breakdown.productCost,
      netProfit: results.netProfit,
      profitMargin: results.profitMargin
    });
    
    if (suggestions) {
      setAiSuggestions(suggestions);
    }
  };

  const handleSave = () => {
    if (!results || !formData.productName) return;
    
    saveCalculation({
      productName: formData.productName,
      sellingPrice: results.sellingPrice,
      productCost: results.breakdown.productCost,
      shippingCost: results.breakdown.shippingCost,
      packagingCost: results.breakdown.packagingCost,
      transactionFee: results.breakdown.transactionFee,
      adCost: results.breakdown.adCost,
      vat: results.breakdown.vat,
      otherCosts: results.breakdown.otherCosts,
      netProfit: results.netProfit,
      profitMarginPercent: results.profitMargin,
      roiPercent: results.roi,
      breakevenUnits: results.breakeven,
      aiSuggestions: aiSuggestions
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Calculator className="h-6 w-6 text-primary" />
          Données Produit
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="productName">Nom du Produit</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="ex: Casque Audio Premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sellingPrice">Prix de Vente (€)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="199.99"
              />
            </div>
            <div>
              <Label htmlFor="productCost">Coût Produit (€)</Label>
              <Input
                id="productCost"
                type="number"
                step="0.01"
                value={formData.productCost}
                onChange={(e) => setFormData({ ...formData, productCost: e.target.value })}
                placeholder="50.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCost">Livraison (€)</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="packagingCost">Emballage (€)</Label>
              <Input
                id="packagingCost"
                type="number"
                step="0.01"
                value={formData.packagingCost}
                onChange={(e) => setFormData({ ...formData, packagingCost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="transactionFeePercent">Frais Transaction (%)</Label>
              <Input
                id="transactionFeePercent"
                type="number"
                step="0.1"
                value={formData.transactionFeePercent}
                onChange={(e) => setFormData({ ...formData, transactionFeePercent: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="adCostPercent">Coût Pub (%)</Label>
              <Input
                id="adCostPercent"
                type="number"
                step="0.1"
                value={formData.adCostPercent}
                onChange={(e) => setFormData({ ...formData, adCostPercent: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="vatPercent">TVA (%)</Label>
              <Input
                id="vatPercent"
                type="number"
                step="0.1"
                value={formData.vatPercent}
                onChange={(e) => setFormData({ ...formData, vatPercent: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="otherCosts">Autres Coûts (€)</Label>
            <Input
              id="otherCosts"
              type="number"
              step="0.01"
              value={formData.otherCosts}
              onChange={(e) => setFormData({ ...formData, otherCosts: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {results && (
          <>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Résultats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Net</p>
                    <p className={`text-3xl font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.netProfit.toFixed(2)} €
                    </p>
                  </div>
                  {results.netProfit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Marge</p>
                    <p className="text-2xl font-bold">{results.profitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="text-2xl font-bold">{results.roi.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Seuil de Rentabilité</p>
                  <p className="text-lg font-semibold">{results.breakeven} unités</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Répartition des Coûts</p>
                  {Object.entries(results.breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium">{value.toFixed(2)} €</span>
                      </div>
                      <Progress 
                        value={(value / results.totalCosts) * 100} 
                        className="h-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button onClick={handleGetAISuggestions} disabled={isLoadingAI} className="flex-1">
                {isLoadingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggestions IA
                  </>
                )}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.productName} variant="outline">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>

            {aiSuggestions.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommandations IA
                </h3>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        {!results && (
          <Card className="p-12 text-center">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Entrez les données du produit pour calculer le profit
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
