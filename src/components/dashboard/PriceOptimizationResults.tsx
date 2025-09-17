import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface ProductOptimization {
  id: string
  name: string
  category: string
  currentPrice: number
  optimizedPrice: number
  priceChange: number
  priceChangePercent: number
  estimatedSalesIncrease: number
  monthlyRevenueImpact: number
  competitorPrice: number
  demandLevel: 'low' | 'medium' | 'high'
  stockLevel: number
  confidence: number
  reasons: string[]
}

interface PriceOptimizationResultsProps {
  isOpen: boolean
  onClose: () => void
  onApplyAll: () => void
  onApplyProduct: (productId: string) => void
}

const mockOptimizationData: ProductOptimization[] = [
  {
    id: '1',
    name: 'Smartphone Galaxy Pro',
    category: 'Électronique',
    currentPrice: 599.99,
    optimizedPrice: 649.99,
    priceChange: 50.00,
    priceChangePercent: 8.33,
    estimatedSalesIncrease: 12,
    monthlyRevenueImpact: 2847.50,
    competitorPrice: 679.99,
    demandLevel: 'high',
    stockLevel: 45,
    confidence: 94,
    reasons: [
      'Demande élevée détectée (+23% cette semaine)',
      'Prix concurrent supérieur de 4.6%',
      'Marge optimale selon l\'historique des ventes'
    ]
  },
  {
    id: '2',
    name: 'Casque Audio Wireless',
    category: 'Audio',
    currentPrice: 129.99,
    optimizedPrice: 144.99,
    priceChange: 15.00,
    priceChangePercent: 11.54,
    estimatedSalesIncrease: -3,
    monthlyRevenueImpact: 892.30,
    competitorPrice: 159.99,
    demandLevel: 'medium',
    stockLevel: 23,
    confidence: 87,
    reasons: [
      'Positionnement premium par rapport à la concurrence',
      'Stock limité justifie une hausse',
      'Historique d\'acceptation des hausses de prix'
    ]
  },
  {
    id: '3',
    name: 'Montre Connectée Sport',
    category: 'Accessoires',
    currentPrice: 249.99,
    optimizedPrice: 229.99,
    priceChange: -20.00,
    priceChangePercent: -8.00,
    estimatedSalesIncrease: 28,
    monthlyRevenueImpact: 1250.80,
    competitorPrice: 219.99,
    demandLevel: 'low',
    stockLevel: 78,
    confidence: 91,
    reasons: [
      'Surstockage détecté (78 unités)',
      'Concurrence aggressive sur ce segment',
      'Stimuler la demande par une baisse stratégique'
    ]
  }
]

export function PriceOptimizationResults({ 
  isOpen, 
  onClose, 
  onApplyAll, 
  onApplyProduct 
}: PriceOptimizationResultsProps) {
  if (!isOpen) return null

  const totalRevenuePotential = mockOptimizationData.reduce(
    (sum, product) => sum + product.monthlyRevenueImpact, 
    0
  )

  const averageConfidence = mockOptimizationData.reduce(
    (sum, product) => sum + product.confidence, 
    0
  ) / mockOptimizationData.length

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Résultats d'Optimisation des Prix</h2>
              <p className="text-muted-foreground mt-1">
                Analyse IA complète pour {mockOptimizationData.length} produits
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>

          {/* Résumé Global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gain Mensuel Estimé</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{formatCurrency(totalRevenuePotential)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Confiance Moyenne</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {averageConfidence.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Produits Analysés</p>
                    <p className="text-2xl font-bold">
                      {mockOptimizationData.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={onApplyAll} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Appliquer Toutes les Optimisations
            </Button>
          </div>
        </div>

        {/* Liste des Produits */}
        <div className="p-6 space-y-6">
          {mockOptimizationData.map((product) => (
            <Card key={product.id} className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>
                      {product.category} • Stock: {product.stockLevel} unités
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getDemandColor(product.demandLevel)}>
                      Demande {product.demandLevel}
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => onApplyProduct(product.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Appliquer
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Comparaison Prix Avant/Après */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Prix Actuel</p>
                    <p className="text-2xl font-bold">{formatCurrency(product.currentPrice)}</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-muted-foreground mb-1">Prix Optimisé</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(product.optimizedPrice)}
                    </p>
                    <div className="flex items-center justify-center mt-2">
                      {product.priceChange > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        product.priceChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.priceChange > 0 ? '+' : ''}{formatCurrency(product.priceChange)}
                        ({product.priceChange > 0 ? '+' : ''}{product.priceChangePercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métriques d'Impact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-xs text-muted-foreground">Impact Ventes</p>
                    <p className="font-bold text-green-600">
                      {product.estimatedSalesIncrease > 0 ? '+' : ''}{product.estimatedSalesIncrease}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-xs text-muted-foreground">Revenus/Mois</p>
                    <p className="font-bold text-blue-600">
                      +{formatCurrency(product.monthlyRevenueImpact)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-xs text-muted-foreground">Prix Concurrent</p>
                    <p className="font-bold">{formatCurrency(product.competitorPrice)}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <p className="text-xs text-muted-foreground">Confiance IA</p>
                    <p className="font-bold text-yellow-600">{product.confidence}%</p>
                  </div>
                </div>

                {/* Barre de Confiance */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Niveau de Confiance</span>
                    <span className="text-sm text-muted-foreground">{product.confidence}%</span>
                  </div>
                  <Progress value={product.confidence} className="h-2" />
                </div>

                {/* Raisons de l'Optimisation */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-600" />
                    Justifications IA
                  </h4>
                  <div className="space-y-2">
                    {product.reasons.map((reason, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}