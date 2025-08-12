import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Eye, Reply, Flag, TrendingUp, TrendingDown, Search, Filter, Download, RefreshCw, Bot, Zap, BarChart3, Award, Users, Calendar, AlertTriangle, CheckCircle2, Clock, Building } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Données des avis positifs
const positiveReviews = [
  {
    id: '1',
    productId: 'IP15-PRO-128',
    productName: 'iPhone 15 Pro 128GB',
    customerName: 'Marie Dubois',
    customerEmail: 'marie.dubois@email.com',
    rating: 5,
    title: 'Excellent produit, livraison rapide !',
    comment: 'Très satisfaite de mon achat. Le produit correspond parfaitement à la description et la livraison a été ultra rapide. Service client au top !',
    date: '2024-01-10',
    verified: true,
    helpful: 12,
    notHelpful: 1,
    category: 'Qualité',
    sentiment: 'très positif',
    keywords: ['qualité', 'livraison', 'service'],
    response: null,
    responseDate: null,
    photos: [],
    orderValue: 1199.99,
    customerSegment: 'VIP',
    isHighlighted: true
  },
  {
    id: '2',
    productId: 'SAM-S24-256',
    productName: 'Samsung Galaxy S24 256GB',
    customerName: 'Pierre Martin',
    customerEmail: 'pierre.martin@email.com',
    rating: 5,
    title: 'Parfait pour mes besoins professionnels',
    comment: 'Smartphone excellent avec une très bonne autonomie. Parfait pour mes besoins en déplacement. Je recommande vivement !',
    date: '2024-01-09',
    verified: true,
    helpful: 8,
    notHelpful: 0,
    category: 'Performance',
    sentiment: 'positif',
    keywords: ['autonomie', 'professionnel', 'performance'],
    response: 'Merci Pierre pour ce retour positif ! Nous sommes ravis que le Galaxy S24 réponde parfaitement à vos attentes professionnelles.',
    responseDate: '2024-01-10',
    photos: [],
    orderValue: 999.99,
    customerSegment: 'Fidèle',
    isHighlighted: false
  },
  {
    id: '3',
    productId: 'APP-PRO-2',
    productName: 'AirPods Pro 2ème génération',
    customerName: 'Sophie Bernard',
    customerEmail: 'sophie.bernard@email.com',
    rating: 4,
    title: 'Très bon son, un peu cher',
    comment: 'La qualité audio est vraiment exceptionnelle et la réduction de bruit active fonctionne parfaitement. Le prix reste élevé mais la qualité est au rendez-vous.',
    date: '2024-01-08',
    verified: true,
    helpful: 15,
    notHelpful: 2,
    category: 'Qualité',
    sentiment: 'positif',
    keywords: ['audio', 'réduction bruit', 'prix'],
    response: 'Merci Sophie ! Nous comprenons vos préoccupations sur le prix. La qualité premium justifie cet investissement.',
    responseDate: '2024-01-09',
    photos: [],
    orderValue: 279.99,
    customerSegment: 'Régulier',
    isHighlighted: true
  },
  {
    id: '4',
    productId: 'MAC-AIR-M3',
    productName: 'MacBook Air M3 13"',
    customerName: 'Luc Moreau',
    customerEmail: 'luc.moreau@email.com',
    rating: 5,
    title: 'Performances incroyables !',
    comment: 'Ce MacBook Air M3 dépasse toutes mes attentes. Ultra rapide, silencieux et l\'autonomie est exceptionnelle. Parfait pour le développement et le multimédia.',
    date: '2024-01-07',
    verified: true,
    helpful: 22,
    notHelpful: 1,
    category: 'Performance',
    sentiment: 'très positif',
    keywords: ['performance', 'autonomie', 'développement'],
    response: 'Merci Luc ! Nous sommes ravis que le MacBook Air M3 vous offre cette expérience exceptionnelle.',
    responseDate: '2024-01-08',
    photos: [],
    orderValue: 1399.99,
    customerSegment: 'VIP',
    isHighlighted: true
  },
  {
    id: '5',
    productId: 'IPD-PRO-11',
    productName: 'iPad Pro 11" M4',
    customerName: 'Emma Lefevre',
    customerEmail: 'emma.lefevre@email.com',
    rating: 4,
    title: 'Excellent pour le design',
    comment: 'Parfait pour mes projets de design graphique. L\'écran est magnifique et le Apple Pencil fonctionne parfaitement. Très satisfaite de cet achat.',
    date: '2024-01-06',
    verified: true,
    helpful: 9,
    notHelpful: 0,
    category: 'Design',
    sentiment: 'positif',
    keywords: ['design', 'écran', 'apple pencil'],
    response: null,
    responseDate: null,
    photos: [],
    orderValue: 999.99,
    customerSegment: 'Nouveau',
    isHighlighted: false
  }
]

// Données d'évolution des avis positifs
const positiveEvolution = [
  { date: '01/01', reviews: 45, rating: 4.3, helpful: 234, response: 32 },
  { date: '02/01', reviews: 52, rating: 4.4, helpful: 278, response: 41 },
  { date: '03/01', reviews: 48, rating: 4.2, helpful: 256, response: 38 },
  { date: '04/01', reviews: 61, rating: 4.5, helpful: 325, response: 48 },
  { date: '05/01', reviews: 58, rating: 4.4, helpful: 312, response: 52 },
  { date: '06/01', reviews: 65, rating: 4.6, helpful: 389, response: 58 },
  { date: '07/01', reviews: 72, rating: 4.5, helpful: 425, response: 65 },
]

// Répartition par note
const ratingDistribution = [
  { rating: 5, count: 145, percentage: 65, sentiment: 'Excellent' },
  { rating: 4, count: 58, percentage: 26, sentiment: 'Très bon' },
  { rating: 3, count: 15, percentage: 7, sentiment: 'Bon' },
  { rating: 2, count: 3, percentage: 1, sentiment: 'Moyen' },
  { rating: 1, count: 2, percentage: 1, sentiment: 'Mauvais' },
]

// Top produits par avis positifs
const topProducts = [
  { name: 'iPhone 15 Pro', reviews: 48, avgRating: 4.7, helpfulRate: 89, responseRate: 95 },
  { name: 'Samsung Galaxy S24', reviews: 35, avgRating: 4.5, helpfulRate: 86, responseRate: 92 },
  { name: 'MacBook Air M3', reviews: 28, avgRating: 4.8, helpfulRate: 94, responseRate: 98 },
  { name: 'AirPods Pro', reviews: 42, avgRating: 4.4, helpfulRate: 82, responseRate: 88 },
  { name: 'iPad Pro', reviews: 31, avgRating: 4.6, helpfulRate: 87, responseRate: 94 },
]

// Catégories d'avis
const reviewCategories = [
  { name: 'Qualité', count: 95, avgRating: 4.6, growth: 12 },
  { name: 'Performance', count: 78, avgRating: 4.7, growth: 8 },
  { name: 'Design', count: 45, avgRating: 4.4, growth: 15 },
  { name: 'Livraison', count: 62, avgRating: 4.5, growth: 5 },
  { name: 'Service', count: 38, avgRating: 4.3, growth: -2 },
]

// Mots-clés fréquents
const keywords = [
  { word: 'qualité', frequency: 145, sentiment: 'positive', growth: 12 },
  { word: 'rapide', frequency: 89, sentiment: 'positive', growth: 8 },
  { word: 'parfait', frequency: 76, sentiment: 'positive', growth: 15 },
  { word: 'excellent', frequency: 68, sentiment: 'positive', growth: 22 },
  { word: 'recommande', frequency: 54, sentiment: 'positive', growth: 18 },
]

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))']

export default function AvisPositifUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  // Calcul des métriques
  const totalReviews = positiveReviews.length
  const avgRating = positiveReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  const totalHelpful = positiveReviews.reduce((sum, review) => sum + review.helpful, 0)
  const responseRate = (positiveReviews.filter(review => review.response).length / totalReviews) * 100

  // Filtrage des données
  const filteredReviews = positiveReviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter
    const matchesCategory = categoryFilter === 'all' || review.category === categoryFilter
    const matchesVerified = verifiedFilter === 'all' || 
                           (verifiedFilter === 'verified' && review.verified) ||
                           (verifiedFilter === 'unverified' && !review.verified)
    
    return matchesSearch && matchesRating && matchesCategory && matchesVerified
  })

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'très positif':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">😍 Très positif</Badge>
      case 'positif':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">😊 Positif</Badge>
      default:
        return <Badge variant="outline">{sentiment}</Badge>
    }
  }

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">👑 VIP</Badge>
      case 'Fidèle':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">💙 Fidèle</Badge>
      case 'Régulier':
        return <Badge variant="secondary">👤 Régulier</Badge>
      case 'Nouveau':
        return <Badge variant="outline" className="bg-green-100 text-green-800">✨ Nouveau</Badge>
      default:
        return <Badge variant="outline">{segment}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header avec contrôles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Avis Positifs Ultra Pro</h1>
            <p className="text-muted-foreground">Analyse avancée des avis positifs avec insights IA et gestion automatisée</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync avis
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export rapport
            </Button>
            
            <Button size="sm">
              <Bot className="h-4 w-4 mr-2" />
              Analyse IA
            </Button>

            <Button size="sm">
              <Reply className="h-4 w-4 mr-2" />
              Réponses automatiques
            </Button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Star className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline">{avgRating.toFixed(1)}/5</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-xs text-muted-foreground">Avis positifs</p>
                <p className="text-xs text-muted-foreground">Note moyenne: {avgRating.toFixed(1)}/5</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <ThumbsUp className="h-5 w-5 text-emerald-500" />
                <Badge variant="default">+15.3%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{totalHelpful}</p>
                <p className="text-xs text-muted-foreground">Votes utiles</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <Badge variant="secondary">{Math.round(responseRate)}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{Math.round(responseRate)}%</p>
                <p className="text-xs text-muted-foreground">Taux de réponse</p>
                <p className="text-xs text-muted-foreground">Objectif: 95%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <Badge variant="default" className="bg-emerald-100 text-emerald-800">+22.1%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold">4.5</p>
                <p className="text-xs text-muted-foreground">Score satisfaction</p>
                <p className="text-xs text-muted-foreground">vs mois dernier</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution des avis positifs */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des avis positifs</CardTitle>
              <CardDescription>Tendance et engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={positiveEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="reviews" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Avis positifs"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="helpful" 
                    stroke="hsl(var(--secondary))" 
                    fill="hsl(var(--secondary))" 
                    fillOpacity={0.3}
                    name="Votes utiles"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition par note */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par étoiles</CardTitle>
              <CardDescription>Distribution des notes positives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ratingDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{item.rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{item.sentiment}</span>
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des avis positifs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle>Avis positifs récents</CardTitle>
                <CardDescription>Gestion intelligente avec analyse de sentiment</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher dans les avis..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="5">5 étoiles</SelectItem>
                    <SelectItem value="4">4 étoiles</SelectItem>
                    <SelectItem value="3">3 étoiles</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="Qualité">Qualité</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Livraison">Livraison</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className={`p-6 rounded-lg border ${review.isHighlighted ? 'border-primary bg-primary/5' : 'bg-muted/20'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">{getRatingStars(review.rating)}</div>
                          <span className="font-medium">{review.rating}/5</span>
                          {review.verified && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.customerName}</span>
                          {getSegmentBadge(review.customerSegment)}
                          {getSentimentBadge(review.sentiment)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(review.date)}</p>
                      <p className="text-xs text-muted-foreground">{review.category}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">{review.title}</h3>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        📱 {review.productName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        💰 {formatCurrency(review.orderValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">{review.helpful}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{review.notHelpful}</span>
                      </div>
                    </div>
                  </div>

                  {review.keywords.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Mots-clés:</span>
                        {review.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {review.response ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Réponse de l'entreprise</span>
                        <span className="text-sm text-blue-600">{formatDate(review.responseDate!)}</span>
                      </div>
                      <p className="text-blue-700">{review.response}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Reply className="h-4 w-4 mr-2" />
                        Répondre
                      </Button>
                      <Button size="sm" variant="outline">
                        <Flag className="h-4 w-4 mr-2" />
                        Marquer
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir profil
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analyses détaillées */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Top produits</TabsTrigger>
            <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
            <TabsTrigger value="analytics">Analytics IA</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Produits les mieux notés</CardTitle>
                <CardDescription>Performance par avis positifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.reviews} avis • Note: {product.avgRating}/5
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {getRatingStars(Math.round(product.avgRating))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-bold text-emerald-600">{product.helpfulRate}%</p>
                            <p className="text-xs text-muted-foreground">Utiles</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-blue-600">{product.responseRate}%</p>
                            <p className="text-xs text-muted-foreground">Réponses</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des mots-clés</CardTitle>
                <CardDescription>Termes les plus fréquents dans les avis positifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">
                          {keyword.frequency}
                        </div>
                        <div>
                          <p className="font-medium">"{keyword.word}"</p>
                          <p className="text-sm text-muted-foreground">
                            {keyword.frequency} mentions • Sentiment: {keyword.sentiment}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default" className="bg-emerald-100 text-emerald-800">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{keyword.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Insights IA</CardTitle>
                  <CardDescription>Analyse avancée des avis positifs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800">Tendance positive</span>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Les avis mentionnent 3x plus souvent "qualité" ce mois-ci. Excellente perception produit.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Profil clients</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        68% des avis positifs viennent de clients VIP et Fidèles. Forte satisfaction segment premium.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">Prédiction</span>
                      </div>
                      <p className="text-sm text-purple-700">
                        Prévision +25% d'avis positifs next month basé sur les tendances actuelles.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions recommandées</CardTitle>
                  <CardDescription>Optimisations suggérées par l'IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Taux de réponse</span>
                        <span className="text-sm text-muted-foreground">Objectif: 95%</span>
                      </div>
                      <Progress value={responseRate} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        +{(95 - responseRate).toFixed(1)}% pour atteindre l'objectif
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Mise en avant produits</span>
                        <span className="text-sm text-muted-foreground">Score: 85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Capitaliser sur iPhone 15 Pro (4.7/5)
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Engagement communauté</span>
                        <span className="text-sm text-muted-foreground">Votes utiles</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Encourager interactions clients
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Actions prioritaires</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>Répondre aux 12 avis non traités</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span>Mettre en avant témoignages iPhone</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span>Solliciter avis clients récents</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}