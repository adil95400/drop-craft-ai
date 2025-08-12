import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, TrendingUp, MessageSquare, Filter, Download, Eye, Edit, Trash2, MoreHorizontal, Search, AlertTriangle, CheckCircle2, Clock, Bot, Target, Zap, BarChart3, Users, Calendar, Globe, Award, Shield, Heart, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'


interface Review {
  id: string
  customer_name: string
  customer_email: string
  product_name: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  sentiment: 'positive' | 'negative' | 'neutral'
  is_verified: boolean
  platform: 'website' | 'amazon' | 'shopify' | 'google'
  date: string
  helpful_votes: number
  response?: string
  tags: string[]
}

const mockReviews: Review[] = [
  {
    id: '1',
    customer_name: 'Marie Dubois',
    customer_email: 'marie@example.com',
    product_name: 'Écouteurs Bluetooth Pro',
    rating: 5,
    comment: 'Excellent produit, très satisfaite de mon achat. La qualité sonore est exceptionnelle et le design très élégant. Je recommande vivement !',
    status: 'approved',
    sentiment: 'positive',
    is_verified: true,
    platform: 'website',
    date: '2024-01-15T10:30:00',
    helpful_votes: 12,
    response: 'Merci beaucoup Marie pour votre retour positif ! Nous sommes ravis que nos écouteurs vous donnent entière satisfaction.',
    tags: ['qualité', 'design', 'satisfaction']
  },
  {
    id: '2',
    customer_name: 'Pierre Martin',
    customer_email: 'pierre@example.com',
    product_name: 'Smartphone X1',
    rating: 2,
    comment: 'Déçu par la batterie qui ne tient pas la journée. Le produit ne correspond pas à mes attentes.',
    status: 'pending',
    sentiment: 'negative',
    is_verified: true,
    platform: 'amazon',
    date: '2024-01-14T16:45:00',
    helpful_votes: 3,
    tags: ['batterie', 'déception']
  },
  {
    id: '3',
    customer_name: 'Sophie Bernard',
    customer_email: 'sophie@example.com',
    product_name: 'Montre Connectée Sport',
    rating: 4,
    comment: 'Bonne montre dans l\'ensemble, quelques bugs à corriger au niveau de l\'app mais sinon très correcte pour le sport.',
    status: 'approved',
    sentiment: 'positive',
    is_verified: false,
    platform: 'shopify',
    date: '2024-01-13T09:20:00',
    helpful_votes: 8,
    tags: ['sport', 'bugs', 'application']
  }
]

const chartData = [
  { name: 'Jan', reviews: 245, rating: 4.2 },
  { name: 'Fév', reviews: 290, rating: 4.3 },
  { name: 'Mar', reviews: 320, rating: 4.1 },
  { name: 'Avr', reviews: 285, rating: 4.4 },
  { name: 'Mai', reviews: 310, rating: 4.3 },
  { name: 'Jun', reviews: 295, rating: 4.5 }
]

const sentimentData = [
  { name: 'Positifs', value: 68, color: '#22c55e' },
  { name: 'Neutres', value: 22, color: '#f59e0b' },
  { name: 'Négatifs', value: 10, color: '#ef4444' }
]

export default function ReviewsUltraPro() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [sentimentFilter, setSentimentFilter] = useState<string>('all')
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || review.platform === platformFilter
    const matchesSentiment = sentimentFilter === 'all' || review.sentiment === sentimentFilter
    
    let matchesRating = true
    if (ratingFilter !== 'all') {
      if (ratingFilter === '5') matchesRating = review.rating === 5
      else if (ratingFilter === '4') matchesRating = review.rating === 4
      else if (ratingFilter === '3') matchesRating = review.rating === 3
      else if (ratingFilter === 'low') matchesRating = review.rating <= 2
    }
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesRating && matchesSentiment
  })

  const stats = {
    totalReviews: mockReviews.length,
    averageRating: 4.3,
    pending: mockReviews.filter(r => r.status === 'pending').length,
    positiveRate: Math.round((mockReviews.filter(r => r.sentiment === 'positive').length / mockReviews.length) * 100),
    responseRate: Math.round((mockReviews.filter(r => r.response).length / mockReviews.length) * 100),
    verifiedRate: Math.round((mockReviews.filter(r => r.is_verified).length / mockReviews.length) * 100)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'amazon': return '🛒'
      case 'shopify': return '🏪'
      case 'google': return '🔍'
      default: return '🌐'
    }
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header avec Actions Avancées */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Gestion Avis Ultra Pro
            </h1>
            <p className="text-muted-foreground mt-2">
              Analytics avancées, IA et automation pour vos avis clients
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              IA Auto-Réponse
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Analytics
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600">
              <Zap className="h-4 w-4" />
              Campagne Avis
            </Button>
          </div>
        </div>

        {/* Métriques Avancées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Total Avis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">+12% ce mois</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Note Moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}/5</div>
              <div className="flex items-center gap-1 mt-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                En Attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">À modérer</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                Sentiment +
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.positiveRate}%</div>
              <p className="text-xs text-muted-foreground">Avis positifs</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Taux Réponse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">Réponses données</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-500" />
                Vérifiés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedRate}%</div>
              <p className="text-xs text-muted-foreground">Achats vérifiés</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Avis
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Bot className="h-4 w-4" />
              Automation
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Target className="h-4 w-4" />
              Campagnes
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Évolution des Avis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution des Avis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="reviews" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition Sentiments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Analyse des Sentiments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {sentimentData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insights IA */}
            <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Bot className="h-5 w-5" />
                  Insights IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <Award className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Produit Star</p>
                      <p className="text-sm text-muted-foreground">Écouteurs Bluetooth Pro</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">Point d'Attention</p>
                      <p className="text-sm text-muted-foreground">Problèmes de batterie récurrents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Tendance</p>
                      <p className="text-sm text-muted-foreground">+15% satisfaction ce mois</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des Avis */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Filtres Avancés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres Avancés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvés</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes plateformes</SelectItem>
                      <SelectItem value="website">Site Web</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="shopify">Shopify</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Notes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les notes</SelectItem>
                      <SelectItem value="5">5 étoiles</SelectItem>
                      <SelectItem value="4">4 étoiles</SelectItem>
                      <SelectItem value="3">3 étoiles</SelectItem>
                      <SelectItem value="low">≤ 2 étoiles</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous sentiments</SelectItem>
                      <SelectItem value="positive">Positif</SelectItem>
                      <SelectItem value="neutral">Neutre</SelectItem>
                      <SelectItem value="negative">Négatif</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des Avis */}
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {review.customer_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{review.customer_name}</h4>
                            {review.is_verified && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                            <Badge className={getSentimentColor(review.sentiment)}>
                              {review.sentiment === 'positive' ? 'Positif' : 
                               review.sentiment === 'negative' ? 'Négatif' : 'Neutre'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {getPlatformIcon(review.platform)} {review.platform}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm font-medium">{review.rating}/5</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{review.product_name}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                          
                          {review.response && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                                Réponse de l'équipe :
                              </p>
                              <p className="text-sm text-blue-700 dark:text-blue-300">{review.response}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span>{new Date(review.date).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>{review.helpful_votes} personnes ont trouvé cet avis utile</span>
                            {review.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex gap-1">
                                  {review.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Répondre
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Avancées */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance par Plateforme</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Site Web', avis: 120, note: 4.5 },
                      { name: 'Amazon', avis: 89, note: 4.2 },
                      { name: 'Shopify', avis: 67, note: 4.3 },
                      { name: 'Google', avis: 45, note: 4.1 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avis" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendances Temporelles</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Règles d'Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Auto-Réponse Avis Positifs</h4>
                        <p className="text-sm text-muted-foreground">Notes ≥ 4 étoiles</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Réponse automatique de remerciement pour les avis 4-5 étoiles</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                      <Button size="sm" variant="outline">Configurer</Button>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Alerte Avis Négatifs</h4>
                        <p className="text-sm text-muted-foreground">Notes ≤ 2 étoiles</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">Notification immédiate équipe support pour intervention rapide</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                      <Button size="sm" variant="outline">Configurer</Button>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campagnes */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Campagnes de Collecte d'Avis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start gap-3 h-16">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Nouvelle Campagne Email</p>
                      <p className="text-sm text-muted-foreground">Demande d'avis post-livraison</p>
                    </div>
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Campagne Active</h4>
                      <p className="text-sm text-muted-foreground mb-3">Post-Purchase Review Request</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Envoyés</span>
                          <span>1,247</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taux d'ouverture</span>
                          <span>68%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avis collectés</span>
                          <span>156</span>
                        </div>
                        <Progress value={68} className="mt-2" />
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Campagne SMS</h4>
                      <p className="text-sm text-muted-foreground mb-3">Follow-up 7 jours</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Envoyés</span>
                          <span>892</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Clics</span>
                          <span>45%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conversions</span>
                          <span>89</span>
                        </div>
                        <Progress value={45} className="mt-2" />
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}