import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Brain, Sparkles,
  Target, AlertTriangle, CheckCircle, ArrowUp, ArrowDown,
  RefreshCw, Settings, Zap, Eye, BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PricePrediction {
  productId: string
  productName: string
  currentPrice: number
  optimalPrice: number
  priceChange: number
  confidence: number
  demandElasticity: number
  competitorAvg: number
  margin: number
  estimatedRevenue: number
  recommendation: 'increase' | 'decrease' | 'maintain'
  reasoning: string[]
}

interface MarketTrend {
  date: string
  yourPrice: number
  competitorAvg: number
  demand: number
  sales: number
}

export function PricePredictionsEngine() {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoReprice, setAutoReprice] = useState(false)
  const [marginFloor, setMarginFloor] = useState([15])
  const [priceChangeLimit, setPriceChangeLimit] = useState([10])

  const [predictions] = useState<PricePrediction[]>([
    {
      productId: 'prod_001',
      productName: 'Coque iPhone 15 Pro Max',
      currentPrice: 29.99,
      optimalPrice: 34.99,
      priceChange: 16.7,
      confidence: 92,
      demandElasticity: -1.2,
      competitorAvg: 32.50,
      margin: 45,
      estimatedRevenue: 2450,
      recommendation: 'increase',
      reasoning: [
        'Demande stable malgré prix plus élevés',
        'Concurrents ont augmenté leurs prix de 8%',
        'Stock limité chez les concurrents'
      ]
    },
    {
      productId: 'prod_002',
      productName: 'Chargeur USB-C 65W',
      currentPrice: 45.99,
      optimalPrice: 39.99,
      priceChange: -13.0,
      confidence: 87,
      demandElasticity: -2.1,
      competitorAvg: 38.00,
      margin: 32,
      estimatedRevenue: 1890,
      recommendation: 'decrease',
      reasoning: [
        'Prix supérieur à la moyenne concurrents',
        'Forte élasticité-prix détectée',
        'Baisse de prix = +35% ventes estimées'
      ]
    },
    {
      productId: 'prod_003',
      productName: 'Écouteurs Bluetooth Pro',
      currentPrice: 89.99,
      optimalPrice: 89.99,
      priceChange: 0,
      confidence: 78,
      demandElasticity: -0.8,
      competitorAvg: 92.00,
      margin: 38,
      estimatedRevenue: 3200,
      recommendation: 'maintain',
      reasoning: [
        'Prix déjà optimal par rapport au marché',
        'Faible élasticité-prix',
        'Bonne position concurrentielle'
      ]
    }
  ])

  const [marketData] = useState<MarketTrend[]>([
    { date: '01/01', yourPrice: 29.99, competitorAvg: 31.50, demand: 85, sales: 45 },
    { date: '08/01', yourPrice: 29.99, competitorAvg: 32.00, demand: 88, sales: 52 },
    { date: '15/01', yourPrice: 29.99, competitorAvg: 32.50, demand: 92, sales: 58 },
    { date: '22/01', yourPrice: 29.99, competitorAvg: 33.00, demand: 95, sales: 62 },
    { date: '29/01', yourPrice: 29.99, competitorAvg: 33.50, demand: 90, sales: 55 },
    { date: '05/02', yourPrice: 29.99, competitorAvg: 34.00, demand: 93, sales: 60 }
  ])

  const runPriceAnalysis = async () => {
    setIsAnalyzing(true)
    toast({
      title: "Analyse en cours",
      description: "L'IA analyse les données de marché et de concurrence..."
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    setIsAnalyzing(false)
    toast({
      title: "Analyse terminée",
      description: "Les prédictions de prix ont été mises à jour"
    })
  }

  const applyRecommendation = (prediction: PricePrediction) => {
    toast({
      title: "Prix mis à jour",
      description: `Le prix de "${prediction.productName}" a été ajusté à ${prediction.optimalPrice.toFixed(2)}€`
    })
  }

  const applyAllRecommendations = () => {
    toast({
      title: "Prix mis à jour",
      description: `${predictions.length} prix ont été optimisés selon les recommandations IA`
    })
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'increase': return 'text-green-600 bg-green-100'
      case 'decrease': return 'text-red-600 bg-red-100'
      case 'maintain': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalPotentialRevenue = predictions.reduce((acc, p) => acc + p.estimatedRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Prédictions de Prix IA
          </h2>
          <p className="text-muted-foreground">
            Optimisez vos prix basé sur la demande et la concurrence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runPriceAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyser le marché
              </>
            )}
          </Button>
          <Button onClick={applyAllRecommendations}>
            <Zap className="h-4 w-4 mr-2" />
            Appliquer tout
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">+12.4%</div>
                <div className="text-sm text-muted-foreground">Revenus potentiels</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPotentialRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">Revenus estimés</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{predictions.length}</div>
                <div className="text-sm text-muted-foreground">Produits analysés</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Brain className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-muted-foreground">Confiance moyenne</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="market">Tendances Marché</TabsTrigger>
          <TabsTrigger value="competitors">Concurrence</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recommandations de Prix</span>
                <Badge variant="outline">{predictions.length} produits</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div key={prediction.productId} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{prediction.productName}</div>
                        <div className="text-sm text-muted-foreground">
                          Confiance: {prediction.confidence}% | Élasticité: {prediction.demandElasticity}
                        </div>
                      </div>
                      <Badge className={getRecommendationColor(prediction.recommendation)}>
                        {prediction.recommendation === 'increase' && (
                          <><ArrowUp className="h-3 w-3 mr-1" /> Augmenter</>
                        )}
                        {prediction.recommendation === 'decrease' && (
                          <><ArrowDown className="h-3 w-3 mr-1" /> Diminuer</>
                        )}
                        {prediction.recommendation === 'maintain' && (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Maintenir</>
                        )}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="text-sm text-muted-foreground">Prix actuel</div>
                        <div className="font-bold">{prediction.currentPrice.toFixed(2)}€</div>
                      </div>
                      <div className={`text-center p-2 rounded ${
                        prediction.recommendation === 'increase' 
                          ? 'bg-green-50' 
                          : prediction.recommendation === 'decrease' 
                            ? 'bg-red-50' 
                            : 'bg-blue-50'
                      }`}>
                        <div className="text-sm text-muted-foreground">Prix optimal</div>
                        <div className="font-bold">{prediction.optimalPrice.toFixed(2)}€</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="text-sm text-muted-foreground">Moy. concurrents</div>
                        <div className="font-bold">{prediction.competitorAvg.toFixed(2)}€</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="text-sm text-muted-foreground">Marge</div>
                        <div className="font-bold">{prediction.margin}%</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Raisonnement IA:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {prediction.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Revenus estimés: </span>
                        <span className="font-medium text-green-600">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prediction.estimatedRevenue)}
                        </span>
                      </div>
                      <Button size="sm" onClick={() => applyRecommendation(prediction)}>
                        Appliquer le prix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Prix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marketData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="yourPrice" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Votre prix"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="competitorAvg" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Moy. concurrents"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Demande & Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={marketData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="demand" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary)/0.2)"
                        name="Demande"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="hsl(142 76% 36%)" 
                        fill="hsl(142 76% 36% / 0.2)"
                        name="Ventes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Concurrentielle</CardTitle>
              <CardDescription>Positionnement prix par rapport aux concurrents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {predictions.map((prediction) => (
                  <div key={prediction.productId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{prediction.productName}</span>
                      <span>
                        {prediction.currentPrice < prediction.competitorAvg 
                          ? `${((1 - prediction.currentPrice / prediction.competitorAvg) * 100).toFixed(0)}% moins cher`
                          : `${((prediction.currentPrice / prediction.competitorAvg - 1) * 100).toFixed(0)}% plus cher`
                        }
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-primary/30 rounded-full"
                        style={{ 
                          left: '20%',
                          width: '60%'
                        }}
                      />
                      <div 
                        className="absolute h-full w-1 bg-muted-foreground"
                        style={{ 
                          left: `${(prediction.competitorAvg / (prediction.competitorAvg * 1.5)) * 100}%`
                        }}
                        title="Moyenne concurrents"
                      />
                      <div 
                        className="absolute h-full w-3 bg-primary rounded-full"
                        style={{ 
                          left: `${(prediction.currentPrice / (prediction.competitorAvg * 1.5)) * 100 - 1.5}%`
                        }}
                        title="Votre prix"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Prix bas</span>
                      <span>Moy. marché: {prediction.competitorAvg.toFixed(2)}€</span>
                      <span>Prix haut</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du Repricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Repricing automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Appliquer automatiquement les recommandations de prix
                  </p>
                </div>
                <Switch checked={autoReprice} onCheckedChange={setAutoReprice} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Marge minimum</Label>
                  <span className="text-sm font-medium">{marginFloor[0]}%</span>
                </div>
                <Slider
                  value={marginFloor}
                  onValueChange={setMarginFloor}
                  max={50}
                  min={5}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Ne jamais descendre en dessous de cette marge
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Limite de changement de prix</Label>
                  <span className="text-sm font-medium">±{priceChangeLimit[0]}%</span>
                </div>
                <Slider
                  value={priceChangeLimit}
                  onValueChange={setPriceChangeLimit}
                  max={30}
                  min={1}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Changement maximum autorisé par ajustement
                </p>
              </div>

              <Button className="w-full">
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
