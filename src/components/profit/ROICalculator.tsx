import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp } from 'lucide-react'

export const ROICalculator = () => {
  const [sellingPrice, setSellingPrice] = useState<number>(49.99)
  const [costPrice, setCostPrice] = useState<number>(15.00)
  const [adSpend, setAdSpend] = useState<number>(100)
  const [unitsSold, setUnitsSold] = useState<number>(20)

  const grossProfit = (sellingPrice - costPrice) * unitsSold
  const netProfit = grossProfit - adSpend
  const roi = adSpend > 0 ? ((netProfit / adSpend) * 100) : 0
  const profitMargin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice * 100) : 0
  const breakEvenUnits = profitMargin > 0 ? Math.ceil(adSpend / (sellingPrice - costPrice)) : 0

  const getROIColor = (roi: number) => {
    if (roi >= 100) return 'text-success'
    if (roi >= 50) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Paramètres</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sellingPrice">Prix de Vente (€)</Label>
            <Input
              id="sellingPrice"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="costPrice">Coût du Produit (€)</Label>
            <Input
              id="costPrice"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="adSpend">Dépenses Publicitaires (€)</Label>
            <Input
              id="adSpend"
              type="number"
              value={adSpend}
              onChange={(e) => setAdSpend(parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>

          <div>
            <Label htmlFor="unitsSold">Unités Vendues</Label>
            <Input
              id="unitsSold"
              type="number"
              value={unitsSold}
              onChange={(e) => setUnitsSold(parseInt(e.target.value) || 0)}
              step="1"
            />
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Résultats</h3>
        </div>

        <div className="space-y-6">
          {/* ROI */}
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">ROI (Return on Investment)</p>
            <p className={`text-4xl font-bold ${getROIColor(roi)}`}>
              {roi.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {roi >= 100 ? '🟢 Excellent ROI' : roi >= 50 ? '🟡 ROI Correct' : '🔴 ROI Faible'}
            </p>
          </div>

          {/* Other Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Profit Brut</p>
              <p className="text-2xl font-bold">{grossProfit.toFixed(2)} €</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Profit Net</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netProfit.toFixed(2)} €
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Marge Produit</p>
              <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Seuil Rentabilité</p>
              <p className="text-2xl font-bold">{breakEvenUnits} unités</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-semibold text-sm">💡 Recommandations</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {roi < 50 && (
                <li>• ⚠️ ROI faible - Réduire les dépenses pub ou augmenter le prix</li>
              )}
              {profitMargin < 40 && (
                <li>• ⚠️ Marge inférieure à 40% - Chercher un fournisseur moins cher</li>
              )}
              {breakEvenUnits > unitsSold && (
                <li>• 🔴 Vous êtes en dessous du seuil de rentabilité</li>
              )}
              {roi >= 100 && profitMargin >= 50 && (
                <li>• ✅ Excellent produit - Augmentez le budget pub</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
