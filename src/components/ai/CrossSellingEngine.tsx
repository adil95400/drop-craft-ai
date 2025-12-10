import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ShoppingCart, TrendingUp, Brain, Sparkles, Target,
  Users, DollarSign, ArrowRight, Settings, Play, Plus,
  Package, BarChart3, Zap, RefreshCw, Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProductRecommendation {
  id: string
  productId: string
  productName: string
  productImage: string
  price: number
  recommendationType: 'cross_sell' | 'upsell' | 'bundle' | 'similar'
  confidenceScore: number
  conversionRate: number
  avgOrderValue: number
  frequency: number
  targetProduct?: {
    id: string
    name: string
  }
}

interface RecommendationRule {
  id: string
  name: string
  type: 'behavior' | 'history' | 'category' | 'bundle' | 'ai'
  isActive: boolean
  priority: number
  conditions: string[]
  impact: {
    impressions: number
    clicks: number
    conversions: number
    revenue: number
  }
}

export function CrossSellingEngine() {
  const { toast } = useToast()
  const [isTraining, setIsTraining] = useState(false)
  const [recommendations] = useState<ProductRecommendation[]>([
    {
      id: '1',
      productId: 'prod_001',
      productName: 'Coque iPhone 15 Pro',
      productImage: '/placeholder.svg',
      price: 29.99,
      recommendationType: 'cross_sell',
      confidenceScore: 94,
      conversionRate: 18.5,
      avgOrderValue: 45.00,
      frequency: 234,
      targetProduct: { id: 'prod_iphone', name: 'iPhone 15 Pro' }
    },
    {
      id: '2',
      productId: 'prod_002',
      productName: 'Pack Premium (Coque + Verre + Chargeur)',
      productImage: '/placeholder.svg',
      price: 79.99,
      recommendationType: 'bundle',
      confidenceScore: 89,
      conversionRate: 24.2,
      avgOrderValue: 79.99,
      frequency: 156
    },
    {
      id: '3',
      productId: 'prod_003',
      productName: 'MacBook Pro M3',
      productImage: '/placeholder.svg',
      price: 2499.00,
      recommendationType: 'upsell',
      confidenceScore: 76,
      conversionRate: 8.3,
      avgOrderValue: 2499.00,
      frequency: 45,
      targetProduct: { id: 'prod_macbook_m2', name: 'MacBook Pro M2' }
    },
    {
      id: '4',
      productId: 'prod_004',
      productName: 'Écouteurs AirPods Pro',
      productImage: '/placeholder.svg',
      price: 279.00,
      recommendationType: 'similar',
      confidenceScore: 82,
      conversionRate: 12.7,
      avgOrderValue: 279.00,
      frequency: 189
    }
  ])

  const [rules, setRules] = useState<RecommendationRule[]>([
    {
      id: 'rule_1',
      name: 'Produits fréquemment achetés ensemble',
      type: 'history',
      isActive: true,
      priority: 1,
      conditions: ['min_purchase_frequency >= 10', 'confidence >= 0.7'],
      impact: { impressions: 15420, clicks: 2312, conversions: 428, revenue: 18750 }
    },
    {
      id: 'rule_2',
      name: 'Accessoires par catégorie',
      type: 'category',
      isActive: true,
      priority: 2,
      conditions: ['same_category = true', 'price_diff <= 50%'],
      impact: { impressions: 12300, clicks: 1845, conversions: 312, revenue: 14200 }
    },
    {
      id: 'rule_3',
      name: 'Recommandations comportementales',
      type: 'behavior',
      isActive: true,
      priority: 3,
      conditions: ['viewed_but_not_purchased = true', 'session_time >= 120s'],
      impact: { impressions: 8920, clicks: 1250, conversions: 198, revenue: 9800 }
    },
    {
      id: 'rule_4',
      name: 'Bundles intelligents IA',
      type: 'ai',
      isActive: false,
      priority: 4,
      conditions: ['ai_model = transformer_v2', 'min_confidence = 0.85'],
      impact: { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    }
  ])

  const [settings, setSettings] = useState({
    maxRecommendations: 4,
    minConfidence: 70,
    displayPosition: 'product_page',
    enablePersonalization: true,
    enableABTesting: true,
    fallbackStrategy: 'bestsellers'
  })

  const handleTrainModel = async () => {
    setIsTraining(true)
    toast({
      title: "Entraînement en cours",
      description: "L'IA analyse les données d'achat pour optimiser les recommandations..."
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    setIsTraining(false)
    toast({
      title: "Modèle entraîné",
      description: "Les recommandations ont été optimisées avec les dernières données"
    })
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cross_sell': return 'bg-blue-100 text-blue-800'
      case 'upsell': return 'bg-green-100 text-green-800'
      case 'bundle': return 'bg-purple-100 text-purple-800'
      case 'similar': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'behavior': return 'bg-purple-100 text-purple-800'
      case 'history': return 'bg-blue-100 text-blue-800'
      case 'category': return 'bg-green-100 text-green-800'
      case 'bundle': return 'bg-orange-100 text-orange-800'
      case 'ai': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalRevenue = rules.reduce((acc, rule) => acc + rule.impact.revenue, 0)
  const totalConversions = rules.reduce((acc, rule) => acc + rule.impact.conversions, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Cross-Selling & Upselling IA
          </h2>
          <p className="text-muted-foreground">
            Recommandations intelligentes basées sur l'historique d'achat et le comportement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTrainModel} disabled={isTraining}>
            {isTraining ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Entraînement...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Entraîner le modèle
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">Revenus générés</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Conversions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">+23.5%</div>
                <div className="text-sm text-muted-foreground">Panier moyen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">87%</div>
                <div className="text-sm text-muted-foreground">Précision IA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top Recommandations Actives</span>
                <Badge variant="outline">{recommendations.length} produits</Badge>
              </CardTitle>
              <CardDescription>
                Produits les plus recommandés par l'IA avec les meilleurs taux de conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{rec.productName}</span>
                        <Badge className={getTypeColor(rec.recommendationType)}>
                          {rec.recommendationType === 'cross_sell' && 'Cross-sell'}
                          {rec.recommendationType === 'upsell' && 'Upsell'}
                          {rec.recommendationType === 'bundle' && 'Bundle'}
                          {rec.recommendationType === 'similar' && 'Similaire'}
                        </Badge>
                      </div>
                      
                      {rec.targetProduct && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Recommandé avec: {rec.targetProduct.name}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Brain className="h-3 w-3 text-primary" />
                          <span>{rec.confidenceScore}% confiance</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span>{rec.conversionRate}% conversion</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-blue-600" />
                          <span>{rec.frequency} affichages</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(rec.price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        AOV: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(rec.avgOrderValue)}
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Règles de Recommandation</span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle règle
                </Button>
              </CardTitle>
              <CardDescription>
                Configurez les stratégies de recommandation et leur priorité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className={`p-4 border rounded-lg ${rule.isActive ? 'bg-background' : 'bg-muted/30 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <span className="text-sm text-muted-foreground">Priorité {rule.priority}</span>
                        </div>
                        <span className="font-medium">{rule.name}</span>
                        <Badge className={getRuleTypeColor(rule.type)}>
                          {rule.type === 'behavior' && 'Comportemental'}
                          {rule.type === 'history' && 'Historique'}
                          {rule.type === 'category' && 'Catégorie'}
                          {rule.type === 'bundle' && 'Bundle'}
                          {rule.type === 'ai' && 'IA Avancée'}
                        </Badge>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {rule.conditions.map((condition, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium">{rule.impact.impressions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Impressions</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium">{rule.impact.clicks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Clics</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium">{rule.impact.conversions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Conversions</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-600">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(rule.impact.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Revenus</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance par Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['cross_sell', 'upsell', 'bundle', 'similar'].map((type) => {
                    const typeRecs = recommendations.filter(r => r.recommendationType === type)
                    const avgConversion = typeRecs.length > 0 
                      ? typeRecs.reduce((acc, r) => acc + r.conversionRate, 0) / typeRecs.length 
                      : 0
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('_', '-')}</span>
                          <span className="font-medium">{avgConversion.toFixed(1)}%</span>
                        </div>
                        <Progress value={avgConversion * 4} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impact sur le Panier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Augmentation panier moyen</span>
                    <span className="text-lg font-bold text-green-600">+23.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Articles par commande</span>
                    <span className="text-lg font-bold text-blue-600">+1.4</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm">Taux de réachat</span>
                    <span className="text-lg font-bold text-purple-600">+18.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration du Moteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Nombre max de recommandations</Label>
                  <Input
                    type="number"
                    value={settings.maxRecommendations}
                    onChange={(e) => setSettings({ ...settings, maxRecommendations: Number(e.target.value) })}
                    min={1}
                    max={10}
                  />
                </div>
                
                <div>
                  <Label>Confiance minimum (%)</Label>
                  <Input
                    type="number"
                    value={settings.minConfidence}
                    onChange={(e) => setSettings({ ...settings, minConfidence: Number(e.target.value) })}
                    min={50}
                    max={100}
                  />
                </div>

                <div>
                  <Label>Position d'affichage</Label>
                  <Select
                    value={settings.displayPosition}
                    onValueChange={(value) => setSettings({ ...settings, displayPosition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_page">Page produit</SelectItem>
                      <SelectItem value="cart">Panier</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="confirmation">Page de confirmation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stratégie de fallback</Label>
                  <Select
                    value={settings.fallbackStrategy}
                    onValueChange={(value) => setSettings({ ...settings, fallbackStrategy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestsellers">Meilleures ventes</SelectItem>
                      <SelectItem value="new_arrivals">Nouveautés</SelectItem>
                      <SelectItem value="random">Aléatoire</SelectItem>
                      <SelectItem value="none">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Personnalisation utilisateur</Label>
                    <p className="text-sm text-muted-foreground">
                      Adapter les recommandations à l'historique de chaque client
                    </p>
                  </div>
                  <Switch
                    checked={settings.enablePersonalization}
                    onCheckedChange={(checked) => setSettings({ ...settings, enablePersonalization: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>A/B Testing automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Tester différentes stratégies de recommandation
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableABTesting}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableABTesting: checked })}
                  />
                </div>
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
