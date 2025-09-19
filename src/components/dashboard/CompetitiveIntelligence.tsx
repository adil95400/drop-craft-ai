/**
 * Intelligence Concurrentielle Avancée
 * Analyse des concurrents et identification des opportunités
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  Search, TrendingUp, TrendingDown, AlertTriangle, Target, 
  Shield, Zap, Eye, BarChart3, Globe, ArrowUpRight,
  Star, Award, Users, ShoppingCart, DollarSign, Package
} from 'lucide-react'

interface Competitor {
  id: string
  name: string
  logo: string
  domain: string
  category: string
  score: number
  strengths: string[]
  weaknesses: string[]
  traffic: number
  marketShare: number
  avgPrice: number
  topProducts: string[]
  socialPresence: {
    instagram: number
    facebook: number
    tiktok: number
  }
  seoScore: number
  trustScore: number
}

interface MarketOpportunity {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  timeToMarket: string
  potentialRevenue: number
  category: string
  insights: string[]
}

interface PriceGap {
  product: string
  category: string
  ourPrice: number
  competitorAvg: number
  opportunity: number
  volume: number
  difficulty: 'low' | 'medium' | 'high'
}

export const CompetitiveIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([])
  const [priceGaps, setPriceGaps] = useState<PriceGap[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCompetitiveData()
  }, [])

  const loadCompetitiveData = async () => {
    setLoading(true)
    
    // Simulation de données concurrentielles avancées
    const mockCompetitors: Competitor[] = [
      {
        id: '1',
        name: 'DropiziPro',
        logo: '/api/placeholder/40/40',
        domain: 'dropizi.com',
        category: 'Dropshipping',
        score: 8.7,
        strengths: ['Interface moderne', 'IA avancée', 'Support français'],
        weaknesses: ['Prix élevé', 'Courbe apprentissage'],
        traffic: 45000,
        marketShare: 23.5,
        avgPrice: 49,
        topProducts: ['Mode', 'Tech', 'Maison'],
        socialPresence: {
          instagram: 12000,
          facebook: 8500,
          tiktok: 3200
        },
        seoScore: 89,
        trustScore: 92
      },
      {
        id: '2',
        name: 'Spocket Elite',
        logo: '/api/placeholder/40/40',
        domain: 'spocket.co',
        category: 'Fournisseurs EU/US',
        score: 8.3,
        strengths: ['Fournisseurs EU', 'Livraison rapide', 'Qualité produits'],
        weaknesses: ['Moins de produits', 'Interface datée'],
        traffic: 67000,
        marketShare: 31.2,
        avgPrice: 39,
        topProducts: ['Bijoux', 'Beauté', 'Sport'],
        socialPresence: {
          instagram: 18000,
          facebook: 15000,
          tiktok: 1800
        },
        seoScore: 85,
        trustScore: 88
      },
      {
        id: '3',
        name: 'Oberlo Plus',
        logo: '/api/placeholder/40/40',
        domain: 'oberlo.com',
        category: 'Shopify Integration',
        score: 7.9,
        strengths: ['Intégration Shopify', 'Base utilisateurs', 'Prix attractif'],
        weaknesses: ['Fonctionnalités limitées', 'Support en anglais'],
        traffic: 89000,
        marketShare: 28.7,
        avgPrice: 29,
        topProducts: ['Électronique', 'Mode', 'Accessoires'],
        socialPresence: {
          instagram: 25000,
          facebook: 20000,
          tiktok: 5400
        },
        seoScore: 78,
        trustScore: 85
      }
    ]

    const mockOpportunities: MarketOpportunity[] = [
      {
        id: '1',
        title: 'Créneaux Mode Durable',
        description: 'Les concurrents négligent le segment éco-responsable en croissance de +67%',
        impact: 'high',
        difficulty: 'medium',
        timeToMarket: '2-3 mois',
        potentialRevenue: 84000,
        category: 'Niche Market',
        insights: [
          'Aucun concurrent majeur sur ce segment',
          'Demande en croissance exponentielle',
          'Marges plus élevées (+15%)'
        ]
      },
      {
        id: '2',
        title: 'IA Personnalisation Produits',
        description: 'Manque d\'outils IA pour personnaliser les recommandations produits',
        impact: 'high',
        difficulty: 'hard',
        timeToMarket: '4-6 mois',
        potentialRevenue: 125000,
        category: 'Technology Gap',
        insights: [
          'Technologie différenciante',
          'Augmentation conversion +25%',
          'Barrière entrée élevée'
        ]
      },
      {
        id: '3',
        title: 'Marché Seniors (50+)',
        description: 'Segment sous-exploité avec pouvoir d\'achat élevé',
        impact: 'medium',
        difficulty: 'easy',
        timeToMarket: '1 mois',
        potentialRevenue: 45000,
        category: 'Demographics',
        insights: [
          'Interface simplifiée nécessaire',
          'Support téléphonique valorisé',
          'Fidélité client plus élevée'
        ]
      }
    ]

    const mockPriceGaps: PriceGap[] = [
      {
        product: 'Coques iPhone 15',
        category: 'Tech Accessories',
        ourPrice: 25,
        competitorAvg: 32,
        opportunity: 28,
        volume: 450,
        difficulty: 'low'
      },
      {
        product: 'Montres Connectées',
        category: 'Wearables',
        ourPrice: 89,
        competitorAvg: 125,
        opportunity: 40,
        volume: 180,
        difficulty: 'medium'
      },
      {
        product: 'Écouteurs Sans Fil',
        category: 'Audio',
        ourPrice: 45,
        competitorAvg: 58,
        opportunity: 29,
        volume: 320,
        difficulty: 'low'
      }
    ]

    setTimeout(() => {
      setCompetitors(mockCompetitors)
      setOpportunities(mockOpportunities)
      setPriceGaps(mockPriceGaps)
      setLoading(false)
    }, 1500)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'hard': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Analyse concurrentielle en cours...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Intelligence Concurrentielle */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-600" />
                Intelligence Concurrentielle
              </h2>
              <p className="text-muted-foreground">Analyse approfondie de la concurrence et des opportunités</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600">12</div>
              <div className="text-sm text-muted-foreground">Concurrents Analysés</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold">23.7%</div>
              <div className="text-xs text-muted-foreground">Part de Marché</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="font-semibold">8.4/10</div>
              <div className="text-xs text-muted-foreground">Score Compétitivité</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Eye className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="font-semibold">15</div>
              <div className="text-xs text-muted-foreground">Opportunités Détectées</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="font-semibold">€254k</div>
              <div className="text-xs text-muted-foreground">Potentiel Revenus</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="competitors">Concurrents</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
          <TabsTrigger value="pricing">Analyse Prix</TabsTrigger>
        </TabsList>

        {/* Vue d'Ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Position Concurrentielle */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Position Concurrentielle</CardTitle>
                <CardDescription>Comparaison avec la concurrence principale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitors.slice(0, 3).map((competitor, index) => (
                    <div key={competitor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={competitor.logo} alt={competitor.name} />
                          <AvatarFallback>{competitor.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{competitor.name}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.domain}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Score</div>
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            {competitor.score}/10
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Trafic</div>
                          <div className="text-sm text-muted-foreground">
                            {(competitor.traffic / 1000).toFixed(0)}k/mois
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">Part Marché</div>
                          <div className="text-sm text-muted-foreground">
                            {competitor.marketShare}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métriques Clés */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance SEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Notre Score</span>
                      <span className="font-medium">85/100</span>
                    </div>
                    <Progress value={85} />
                    <div className="text-xs text-muted-foreground">
                      +12 points vs concurrence moyenne
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Confiance Clients</span>
                      <span className="font-medium">91/100</span>
                    </div>
                    <Progress value={91} />
                    <div className="text-xs text-muted-foreground">
                      Excellent niveau de confiance
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analyse Concurrents */}
        <TabsContent value="competitors" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Rechercher un concurrent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Analyser Nouveau
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {competitors.map((competitor) => (
              <Card key={competitor.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={competitor.logo} alt={competitor.name} />
                        <AvatarFallback>{competitor.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{competitor.name}</h3>
                        <p className="text-sm text-muted-foreground">{competitor.category}</p>
                      </div>
                    </div>
                    <Badge variant={competitor.score > 8.5 ? 'destructive' : 'secondary'}>
                      {competitor.score}/10
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Trafic Mensuel</div>
                      <div className="font-medium">{competitor.traffic.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Prix Moyen</div>
                      <div className="font-medium">€{competitor.avgPrice}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Forces</div>
                    <div className="flex flex-wrap gap-1">
                      {competitor.strengths.map((strength, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Faiblesses</div>
                    <div className="flex flex-wrap gap-1">
                      {competitor.weaknesses.map((weakness, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Social: </span>
                      <span className="font-medium">
                        {Object.values(competitor.socialPresence).reduce((a, b) => a + b, 0).toLocaleString()} followers
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Analyser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Opportunités Marché */}
        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getImpactColor(opportunity.impact)}>
                      {opportunity.impact === 'high' ? 'Impact Élevé' :
                       opportunity.impact === 'medium' ? 'Impact Moyen' : 'Impact Faible'}
                    </Badge>
                    <Badge className={getDifficultyColor(opportunity.difficulty)} variant="outline">
                      {opportunity.difficulty === 'easy' ? 'Facile' :
                       opportunity.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                    </Badge>
                  </div>

                  <h3 className="font-semibold mb-2">{opportunity.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenus Potentiels</span>
                      <span className="font-medium text-green-600">
                        €{opportunity.potentialRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Temps de Mise en Marché</span>
                      <span className="font-medium">{opportunity.timeToMarket}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Insights Clés</div>
                    <div className="space-y-1">
                      {opportunity.insights.map((insight, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Exploiter l'Opportunité
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analyse Prix */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Écarts de Prix Identifiés</CardTitle>
              <CardDescription>Opportunités d'optimisation tarifaire</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceGaps.map((gap, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{gap.product}</h4>
                      <p className="text-sm text-muted-foreground">{gap.category}</p>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground">Notre Prix</div>
                        <div className="font-medium">€{gap.ourPrice}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Moy. Concurrence</div>
                        <div className="font-medium">€{gap.competitorAvg}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Prix Optimal</div>
                        <div className="font-medium text-green-600">€{gap.opportunity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Volume/mois</div>
                        <div className="font-medium">{gap.volume}</div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Ajuster Prix
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CompetitiveIntelligence