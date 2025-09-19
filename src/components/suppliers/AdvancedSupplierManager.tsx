import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Star,
  Globe,
  Zap,
  RefreshCw,
  Settings,
  Plus,
  Filter,
  ArrowUpDown,
  MapPin,
  DollarSign,
  Package,
  Truck,
  Activity,
  Target,
  Award
} from 'lucide-react'

interface Supplier {
  id: string
  name: string
  country: string
  rating: number
  status: 'active' | 'pending' | 'inactive' | 'warning'
  products: number
  totalRevenue: number
  avgDeliveryTime: number
  reliabilityScore: number
  lastSync: Date
  responseTime: number
  qualityScore: number
  priceCompetitiveness: number
  categories: string[]
  paymentTerms: string
  minimumOrder: number
  shippingCost: number
  certifications: string[]
}

const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: '1',
    name: 'TechGlobal Electronics',
    country: 'China',
    rating: 4.8,
    status: 'active',
    products: 1247,
    totalRevenue: 524750,
    avgDeliveryTime: 12,
    reliabilityScore: 96,
    lastSync: new Date(Date.now() - 1000 * 60 * 30),
    responseTime: 2,
    qualityScore: 94,
    priceCompetitiveness: 88,
    categories: ['Électronique', 'Smartphones', 'Accessoires'],
    paymentTerms: '30 jours',
    minimumOrder: 100,
    shippingCost: 25,
    certifications: ['ISO 9001', 'CE', 'FCC']
  },
  {
    id: '2',
    name: 'Fashion Forward',
    country: 'Italy',
    rating: 4.6,
    status: 'active',
    products: 856,
    totalRevenue: 186430,
    avgDeliveryTime: 8,
    reliabilityScore: 92,
    lastSync: new Date(Date.now() - 1000 * 60 * 45),
    responseTime: 1,
    qualityScore: 97,
    priceCompetitiveness: 75,
    categories: ['Mode', 'Vêtements', 'Accessoires'],
    paymentTerms: '45 jours',
    minimumOrder: 50,
    shippingCost: 35,
    certifications: ['GOTS', 'OEKO-TEX']
  },
  {
    id: '3',
    name: 'HomeDecor Masters',
    country: 'Poland',
    rating: 4.3,
    status: 'warning',
    products: 2341,
    totalRevenue: 298120,
    avgDeliveryTime: 15,
    reliabilityScore: 87,
    lastSync: new Date(Date.now() - 1000 * 60 * 120),
    responseTime: 4,
    qualityScore: 89,
    priceCompetitiveness: 92,
    categories: ['Maison', 'Décoration', 'Mobilier'],
    paymentTerms: '15 jours',
    minimumOrder: 200,
    shippingCost: 18,
    certifications: ['FSC', 'GREENGUARD']
  },
  {
    id: '4',
    name: 'SportMax Distribution',
    country: 'Germany',
    rating: 4.9,
    status: 'active',
    products: 432,
    totalRevenue: 145890,
    avgDeliveryTime: 5,
    reliabilityScore: 99,
    lastSync: new Date(Date.now() - 1000 * 60 * 15),
    responseTime: 1,
    qualityScore: 98,
    priceCompetitiveness: 79,
    categories: ['Sport', 'Fitness', 'Outdoor'],
    paymentTerms: '60 jours',
    minimumOrder: 25,
    shippingCost: 12,
    certifications: ['ISO 14001', 'REACH']
  }
]

const PERFORMANCE_METRICS = [
  { label: 'Fournisseurs Actifs', value: 47, trend: '+12%', icon: Users, color: 'text-blue-500' },
  { label: 'Commandes ce mois', value: 1247, trend: '+8%', icon: Package, color: 'text-green-500' },
  { label: 'Délai moyen', value: '9.2 jours', trend: '-15%', icon: Clock, color: 'text-orange-500' },
  { label: 'Score qualité', value: '94%', trend: '+3%', icon: Star, color: 'text-yellow-500' }
]

export function AdvancedSupplierManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('rating')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />
      case 'inactive': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Actif</Badge>
      case 'warning': return <Badge variant="destructive">Attention</Badge>
      case 'pending': return <Badge variant="secondary">En attente</Badge>
      case 'inactive': return <Badge variant="outline">Inactif</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-blue-600'
    if (score >= 75) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredSuppliers = MOCK_SUPPLIERS
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.country.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.rating - a.rating
        case 'revenue': return b.totalRevenue - a.totalRevenue
        case 'reliability': return b.reliabilityScore - a.reliabilityScore
        case 'products': return b.products - a.products
        default: return 0
      }
    })

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">Gestion Fournisseurs Avancée</h2>
            <p className="text-muted-foreground">
              Monitoring temps réel et optimisation de vos relations fournisseurs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Tous
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Fournisseur
            </Button>
          </div>
        </div>

        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PERFORMANCE_METRICS.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-xs ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.trend} vs mois dernier
                    </p>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher fournisseurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Tous
              </Button>
              <Button 
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Actifs
              </Button>
              <Button 
                variant={filterStatus === 'warning' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('warning')}
              >
                Attention
              </Button>
              
              <Button variant="outline">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Trier par: {sortBy}
              </Button>
            </div>
          </div>

          {/* Liste des fournisseurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card 
                key={supplier.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedSupplier?.id === supplier.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedSupplier(supplier)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {supplier.country}
                      </div>
                    </div>
                    {getStatusBadge(supplier.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Rating et métriques principales */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold">{supplier.rating}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{supplier.products} produits</p>
                      <p className="text-xs text-muted-foreground">€{supplier.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Scores de performance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Fiabilité</span>
                      <span className={`font-medium ${getScoreColor(supplier.reliabilityScore)}`}>
                        {supplier.reliabilityScore}%
                      </span>
                    </div>
                    <Progress value={supplier.reliabilityScore} className="h-1.5" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Qualité</span>
                      <span className={`font-medium ${getScoreColor(supplier.qualityScore)}`}>
                        {supplier.qualityScore}%
                      </span>
                    </div>
                    <Progress value={supplier.qualityScore} className="h-1.5" />
                  </div>

                  {/* Informations clés */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{supplier.avgDeliveryTime}j livraison</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>Min €{supplier.minimumOrder}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span>{supplier.responseTime}h réponse</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      <span>€{supplier.shippingCost} port</span>
                    </div>
                  </div>

                  {/* Catégories */}
                  <div className="flex flex-wrap gap-1">
                    {supplier.categories.slice(0, 2).map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {supplier.categories.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{supplier.categories.length - 2}
                      </Badge>
                    )}
                  </div>

                  {/* Certifications */}
                  {supplier.certifications.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {supplier.certifications.slice(0, 2).join(', ')}
                        {supplier.certifications.length > 2 && ` +${supplier.certifications.length - 2}`}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Fournisseurs avec les meilleures performances globales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_SUPPLIERS
                    .sort((a, b) => (b.reliabilityScore + b.qualityScore) - (a.reliabilityScore + a.qualityScore))
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' : 'bg-muted'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{Math.round((supplier.reliabilityScore + supplier.qualityScore) / 2)}%</p>
                          <p className="text-sm text-muted-foreground">Score global</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes & Actions</CardTitle>
                <CardDescription>Points d'attention et recommandations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">HomeDecor Masters</p>
                      <p className="text-xs text-muted-foreground">Pas de sync depuis 2h - vérifier la connexion API</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Résoudre
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Opportunité de négociation</p>
                      <p className="text-xs text-muted-foreground">TechGlobal - volumes élevés, renégocier les tarifs</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Contacter
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 p-3 border rounded-lg border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Nouveau certification</p>
                      <p className="text-xs text-muted-foreground">SportMax a obtenu une nouvelle certification ISO</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Voir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Fiabilité</span>
                    <span className="font-bold">93.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Qualité</span>
                    <span className="font-bold">94.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Délai livraison</span>
                    <span className="font-bold">9.2 jours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Temps de réponse</span>
                    <span className="font-bold">2.1 heures</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Évolution Mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Nouveaux fournisseurs</span>
                    <span className="font-bold text-green-600">+3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Commandes traitées</span>
                    <span className="font-bold text-green-600">+18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Délais moyens</span>
                    <span className="font-bold text-green-600">-15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Coûts logistiques</span>
                    <span className="font-bold text-red-600">+3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">ROI Fournisseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">€186K</p>
                    <p className="text-sm text-muted-foreground">Économies ce mois</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">23%</p>
                    <p className="text-sm text-muted-foreground">Marge moyenne améliorée</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribution Géographique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { country: 'Chine', suppliers: 18, revenue: '€420K' },
                  { country: 'Allemagne', suppliers: 12, revenue: '€340K' },
                  { country: 'Italie', suppliers: 8, revenue: '€180K' },
                  { country: 'Pologne', suppliers: 9, revenue: '€220K' }
                ].map((data) => (
                  <div key={data.country} className="text-center p-3 border rounded-lg">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-medium">{data.country}</p>
                    <p className="text-sm text-muted-foreground">{data.suppliers} fournisseurs</p>
                    <p className="text-sm font-bold">{data.revenue}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Règles d'Automatisation</CardTitle>
                <CardDescription>
                  Configurez des actions automatiques basées sur les performances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Auto-sync quotidien</span>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Synchronisation automatique des stocks et prix à 6h00
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Alertes performance</span>
                      <Badge className="bg-green-500">Actif</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Notification si fiabilité &lt; 85% ou délai &gt; 15 jours
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Prix dynamiques</span>
                      <Badge variant="outline">Configuration</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ajustement automatique des prix selon la concurrence
                    </p>
                  </div>

                  <Button className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Nouvelle règle
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflows Intelligents</CardTitle>
                <CardDescription>
                  Processus automatisés pour optimiser la gestion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Onboarding Nouveau Fournisseur</div>
                      <div className="text-sm text-muted-foreground">
                        Processus automatisé de validation et intégration
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Évaluation Performance</div>
                      <div className="text-sm text-muted-foreground">
                        Scoring automatique et recommandations IA
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Gestion des Conflits</div>
                      <div className="text-sm text-muted-foreground">
                        Résolution automatique des problèmes courants
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Optimisation Commandes</div>
                      <div className="text-sm text-muted-foreground">
                        Regroupement intelligent et négociation auto
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}