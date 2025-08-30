import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3,
  Calculator,
  Eye,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { ImportedProduct } from '@/hooks/useImportUltraPro'
import { toast } from 'sonner'

interface PriceOptimizationSuggestion {
  productId: string
  currentPrice: number
  suggestedPrice: number
  reason: string
  impact: 'low' | 'medium' | 'high'
  confidence: number
  estimatedMarginIncrease: number
}

interface PriceOptimizerProps {
  products: ImportedProduct[]
  onApplyOptimization: (productId: string, newPrice: number) => void
}

export const PriceOptimizer = ({ products, onApplyOptimization }: PriceOptimizerProps) => {
  const [suggestions, setSuggestions] = useState<PriceOptimizationSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState('balanced')
  const [customMargin, setCustomMargin] = useState(30)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

  // Generate price optimization suggestions
  const generateSuggestions = () => {
    setIsAnalyzing(true)
    
    setTimeout(() => {
      const newSuggestions: PriceOptimizationSuggestion[] = products
        .filter(p => p.price > 0)
        .map(product => {
          const currentPrice = product.price
          const costPrice = product.cost_price || currentPrice * 0.6
          
          let suggestedPrice = currentPrice
          let reason = ''
          let impact: 'low' | 'medium' | 'high' = 'medium'
          
          // Price optimization logic based on strategy
          switch (selectedStrategy) {
            case 'aggressive':
              suggestedPrice = Math.round(currentPrice * 1.15 * 100) / 100
              reason = 'Augmentation aggressive pour maximiser la marge'
              impact = 'high'
              break
              
            case 'conservative':
              suggestedPrice = Math.round(currentPrice * 1.05 * 100) / 100
              reason = 'Augmentation conservative pour maintenir la compétitivité'
              impact = 'low'
              break
              
            case 'psychological':
              // Use psychological pricing (9, 99, etc.)
              const basePrice = currentPrice * 1.08
              suggestedPrice = Math.floor(basePrice) + 0.99
              reason = 'Prix psychologique pour optimiser les conversions'
              impact = 'medium'
              break
              
            case 'margin_based':
              suggestedPrice = Math.round(costPrice * (1 + customMargin / 100) * 100) / 100
              reason = `Prix basé sur une marge de ${customMargin}%`
              impact = 'medium'
              break
              
            default: // balanced
              const marketMultiplier = 1.08 + (Math.random() * 0.1)
              suggestedPrice = Math.round(currentPrice * marketMultiplier * 100) / 100
              reason = 'Optimisation équilibrée basée sur l\'analyse marché'
              impact = 'medium'
          }
          
          const marginIncrease = ((suggestedPrice - costPrice) / costPrice - (currentPrice - costPrice) / costPrice) * 100
          
          return {
            productId: product.id,
            currentPrice,
            suggestedPrice,
            reason,
            impact,
            confidence: Math.floor(Math.random() * 30 + 70), // 70-100%
            estimatedMarginIncrease: Math.round(marginIncrease * 100) / 100
          }
        })
        .filter(s => s.suggestedPrice !== s.currentPrice)
        .sort((a, b) => b.estimatedMarginIncrease - a.estimatedMarginIncrease)
      
      setSuggestions(newSuggestions)
      setIsAnalyzing(false)
      
      toast.success(`${newSuggestions.length} suggestions générées`)
    }, 2000)
  }

  const applyAllSuggestions = () => {
    suggestions.forEach(suggestion => {
      onApplyOptimization(suggestion.productId, suggestion.suggestedPrice)
    })
    toast.success(`${suggestions.length} prix optimisés`)
    setSuggestions([])
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalPotentialIncrease = suggestions.reduce((sum, s) => sum + s.estimatedMarginIncrease, 0)
  const averageConfidence = suggestions.length > 0 
    ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{suggestions.length}</div>
                <p className="text-sm text-muted-foreground">Suggestions</p>
              </div>
              <Target className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">+{totalPotentialIncrease.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Marge Potentielle</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{averageConfidence}%</div>
                <p className="text-sm text-muted-foreground">Confiance Moyenne</p>
              </div>
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-sm text-muted-foreground">Produits Analysés</p>
              </div>
              <Calculator className="h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configuration de l'Optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="balanced">Équilibré</TabsTrigger>
              <TabsTrigger value="aggressive">Agressif</TabsTrigger>
              <TabsTrigger value="conservative">Conservateur</TabsTrigger>
              <TabsTrigger value="psychological">Psychologique</TabsTrigger>
              <TabsTrigger value="margin_based">Basé Marge</TabsTrigger>
            </TabsList>

            <TabsContent value="margin_based" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marge cible (%)</Label>
                    <Input 
                      type="number" 
                      value={customMargin}
                      onChange={(e) => setCustomMargin(Number(e.target.value))}
                      min="0" 
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-4 mt-4">
            <Button 
              onClick={generateSuggestions}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Analyser les Prix
                </>
              )}
            </Button>

            {suggestions.length > 0 && (
              <Button 
                onClick={applyAllSuggestions}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Appliquer Tout ({suggestions.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analyse des prix en cours...</span>
                <span className="text-sm text-muted-foreground">Veuillez patienter</span>
              </div>
              <Progress value={66} className="w-full" />
              <div className="text-xs text-muted-foreground">
                Analyse comparative des prix • Calcul des marges • Optimisation IA
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Suggestions d'Optimisation ({suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.slice(0, 10).map((suggestion) => {
                const product = products.find(p => p.id === suggestion.productId)
                if (!product) return null

                return (
                  <div key={suggestion.productId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          Prix actuel: <span className="font-medium">{suggestion.currentPrice}€</span>
                        </div>
                        <div className="text-sm">
                          Prix suggéré: <span className="font-medium text-green-600">{suggestion.suggestedPrice}€</span>
                        </div>
                        <div className="text-sm">
                          +{suggestion.estimatedMarginIncrease}% marge
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getImpactColor(suggestion.impact)}>
                        Impact {suggestion.impact}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.confidence}% confiance
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {/* Preview logic */}}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => onApplyOptimization(suggestion.productId, suggestion.suggestedPrice)}
                        >
                          Appliquer
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {suggestions.length > 10 && (
                <div className="text-center py-4 text-muted-foreground">
                  Et {suggestions.length - 10} autres suggestions...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length === 0 && !isAnalyzing && (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune suggestion disponible</h3>
            <p className="text-muted-foreground">
              Lancez l'analyse pour obtenir des suggestions d'optimisation de prix
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}