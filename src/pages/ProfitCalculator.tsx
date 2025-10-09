import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck,
  CreditCard,
  Percent,
  Target,
  AlertCircle,
  Info
} from 'lucide-react'

export default function ProfitCalculator() {
  const [productPrice, setProductPrice] = useState('')
  const [supplierCost, setSupplierCost] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [adCost, setAdCost] = useState('')
  const [otherFees, setOtherFees] = useState('')
  const [taxRate, setTaxRate] = useState('20')
  const [expectedOrders, setExpectedOrders] = useState('100')

  const calculateProfit = () => {
    const price = parseFloat(productPrice) || 0
    const cost = parseFloat(supplierCost) || 0
    const shipping = parseFloat(shippingCost) || 0
    const ads = parseFloat(adCost) || 0
    const fees = parseFloat(otherFees) || 0
    const tax = parseFloat(taxRate) || 0
    const orders = parseFloat(expectedOrders) || 0

    const totalCosts = cost + shipping + ads + fees
    const taxAmount = (price * tax) / 100
    const netRevenue = price - taxAmount
    const profitPerUnit = netRevenue - totalCosts
    const profitMargin = ((profitPerUnit / price) * 100)
    const totalProfit = profitPerUnit * orders
    const totalRevenue = price * orders
    const roi = ((profitPerUnit / totalCosts) * 100)

    return {
      profitPerUnit,
      profitMargin,
      totalProfit,
      totalRevenue,
      totalCosts: totalCosts * orders,
      roi,
      breakeven: Math.ceil(totalCosts > 0 ? ads / profitPerUnit : 0)
    }
  }

  const results = calculateProfit()

  return (
    <>
      <Helmet>
        <title>Calculateur de Profit - Drop Craft AI</title>
        <meta name="description" content="Calculez vos marges et profits en temps réel pour optimiser votre business dropshipping" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Calculateur de Profit
          </h1>
          <p className="text-muted-foreground mt-1">
            Analysez vos marges et optimisez votre rentabilité
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Paramètres du Produit
                </CardTitle>
                <CardDescription>
                  Entrez les détails de votre produit pour calculer la rentabilité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="single" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Produit Unique</TabsTrigger>
                    <TabsTrigger value="bulk">Calcul en Masse</TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Prix de Vente (€)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="29.99"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cost" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Coût Fournisseur (€)
                        </Label>
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          placeholder="15.00"
                          value={supplierCost}
                          onChange={(e) => setSupplierCost(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipping" className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Frais de Livraison (€)
                        </Label>
                        <Input
                          id="shipping"
                          type="number"
                          step="0.01"
                          placeholder="3.50"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ads" className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Coût Pub par Vente (€)
                        </Label>
                        <Input
                          id="ads"
                          type="number"
                          step="0.01"
                          placeholder="5.00"
                          value={adCost}
                          onChange={(e) => setAdCost(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fees" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Frais Plateforme (€)
                        </Label>
                        <Input
                          id="fees"
                          type="number"
                          step="0.01"
                          placeholder="2.00"
                          value={otherFees}
                          onChange={(e) => setOtherFees(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax" className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          TVA (%)
                        </Label>
                        <Input
                          id="tax"
                          type="number"
                          step="0.1"
                          placeholder="20"
                          value={taxRate}
                          onChange={(e) => setTaxRate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="orders" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Ventes Prévues par Mois
                        </Label>
                        <Input
                          id="orders"
                          type="number"
                          placeholder="100"
                          value={expectedOrders}
                          onChange={(e) => setExpectedOrders(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                          <p className="font-medium mb-1">Conseils pour maximiser vos profits:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Visez une marge bénéficiaire d'au moins 30%</li>
                            <li>Optimisez vos coûts publicitaires (max 20% du prix)</li>
                            <li>Négociez les frais de livraison avec vos fournisseurs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4">
                    <div className="text-center py-8">
                      <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Calcul en Masse</h3>
                      <p className="text-muted-foreground mb-4">
                        Importez un fichier CSV pour calculer la rentabilité de plusieurs produits
                      </p>
                      <Button>
                        Importer un CSV
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Résultats */}
          <div className="space-y-4">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Profit par Unité</p>
                  <p className="text-4xl font-bold text-green-900 dark:text-green-100 my-2">
                    {results.profitPerUnit.toFixed(2)}€
                  </p>
                  <Badge variant={results.profitMargin > 30 ? 'default' : 'destructive'}>
                    {results.profitMargin.toFixed(1)}% marge
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Profit Mensuel</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100 my-2">
                    {results.totalProfit.toFixed(0)}€
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    sur {expectedOrders} ventes
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métriques Clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenu Total</span>
                  <span className="font-bold">{results.totalRevenue.toFixed(0)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Coûts Totaux</span>
                  <span className="font-bold text-red-600">{results.totalCosts.toFixed(0)}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <Badge variant={results.roi > 100 ? 'default' : 'secondary'}>
                    {results.roi.toFixed(0)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Break-even</span>
                  <span className="font-bold">{results.breakeven} ventes</span>
                </div>
              </CardContent>
            </Card>

            {results.profitMargin < 20 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">
                        Marge faible détectée
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200">
                        Votre marge est inférieure à 20%. Envisagez d'augmenter le prix ou de réduire les coûts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
