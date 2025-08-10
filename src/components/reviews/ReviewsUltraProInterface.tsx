import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Star, MessageSquare, ThumbsUp, Filter, Eye, Download, Share, TrendingUp } from 'lucide-react'
import { useReviews } from '@/hooks/useReviews'

export function ReviewsUltraProInterface() {
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [filterRating, setFilterRating] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const { 
    reviews, 
    stats, 
    isLoading, 
    addReview, 
    markHelpful,
    isAddingReview,
    isMarkingHelpful 
  } = useReviews()

  // Mock data for demonstration
  const mockReviews = [
    {
      id: '1',
      product_id: 'prod1',
      user_id: 'user1',
      rating: 5,
      comment: 'Excellent produit, livraison rapide !',
      verified_purchase: true,
      helpful_count: 12,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      user: {
        full_name: 'Marie Dupont',
        avatar_url: '/placeholder.svg'
      },
      product: {
        name: 'Smartphone XY Pro',
        image_url: '/placeholder.svg'
      },
      platform: 'Loox',
      photos: ['/placeholder.svg']
    },
    {
      id: '2',
      product_id: 'prod2',
      user_id: 'user2',
      rating: 4,
      comment: 'Très bon rapport qualité-prix, je recommande',
      verified_purchase: true,
      helpful_count: 8,
      created_at: '2024-01-14T15:30:00Z',
      updated_at: '2024-01-14T15:30:00Z',
      user: {
        full_name: 'Pierre Martin',
        avatar_url: '/placeholder.svg'
      },
      product: {
        name: 'Écouteurs Bluetooth Pro',
        image_url: '/placeholder.svg'
      },
      platform: 'Judge.me',
      photos: []
    },
    {
      id: '3',
      product_id: 'prod3',
      user_id: 'user3',
      rating: 3,
      comment: 'Produit correct mais emballage abîmé à la réception',
      verified_purchase: false,
      helpful_count: 3,
      created_at: '2024-01-13T09:15:00Z',
      updated_at: '2024-01-13T09:15:00Z',
      user: {
        full_name: 'Sophie Leroux',
        avatar_url: '/placeholder.svg'
      },
      product: {
        name: 'Montre Connectée Sport',
        image_url: '/placeholder.svg'
      },
      platform: 'Trustpilot',
      photos: []
    }
  ]

  const mockStats = {
    total: 156,
    averageRating: 4.3,
    verified: 134,
    withPhotos: 67,
    platforms: {
      'Loox': 89,
      'Judge.me': 45,
      'Trustpilot': 22
    },
    ratingDistribution: [
      { rating: 5, count: 78 },
      { rating: 4, count: 45 },
      { rating: 3, count: 23 },
      { rating: 2, count: 7 },
      { rating: 1, count: 3 }
    ]
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      'Loox': 'bg-purple-500',
      'Judge.me': 'bg-blue-500',
      'Trustpilot': 'bg-green-500',
      'Google': 'bg-red-500'
    }
    
    return (
      <Badge className={colors[platform] || 'bg-gray-500'}>
        {platform}
      </Badge>
    )
  }

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPlatform = !selectedPlatform || review.platform === selectedPlatform
    const matchesRating = !filterRating || review.rating.toString() === filterRating
    return matchesSearch && matchesPlatform && matchesRating
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Reviews Ultra Pro</h2>
        <p className="text-muted-foreground">
          Gérez tous vos avis clients depuis une interface centralisée
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Avis</p>
                <p className="text-2xl font-bold">{mockStats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Note Moyenne</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{mockStats.averageRating}</p>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Achats Vérifiés</p>
                <p className="text-2xl font-bold">{mockStats.verified}</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Avec Photos</p>
                <p className="text-2xl font-bold">{mockStats.withPhotos}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Croissance</p>
                <p className="text-2xl font-bold text-green-600">+23%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Tous les Avis</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Rechercher dans les avis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les plateformes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les plateformes</SelectItem>
                <SelectItem value="Loox">Loox</SelectItem>
                <SelectItem value="Judge.me">Judge.me</SelectItem>
                <SelectItem value="Trustpilot">Trustpilot</SelectItem>
                <SelectItem value="Google">Google Reviews</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="2">2 étoiles</SelectItem>
                <SelectItem value="1">1 étoile</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={review.user.avatar_url}
                      alt={review.user.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{review.user.full_name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex">{getRatingStars(review.rating)}</div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            {review.verified_purchase && (
                              <Badge variant="secondary" className="text-xs">
                                Achat vérifié
                              </Badge>
                            )}
                            {getPlatformBadge(review.platform)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Sur: {review.product.name}
                        </p>
                        <p className="text-sm">{review.comment}</p>
                      </div>

                      {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2">
                          {review.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markHelpful(review.id)}
                            disabled={isMarkingHelpful}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Utile ({review.helpful_count})
                          </Button>
                        </div>
                        <Button variant="outline" size="sm">
                          Répondre
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mockStats.platforms).map(([platform, count]) => (
              <Card key={platform}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    {getPlatformBadge(platform)}
                  </div>
                  <p className="text-3xl font-bold mb-2">{count}</p>
                  <p className="text-sm text-muted-foreground">avis collectés</p>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    Synchroniser
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Intégrer une Nouvelle Plateforme</CardTitle>
              <CardDescription>
                Connectez automatiquement vos plateformes d'avis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">Plateforme</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loox">Loox</SelectItem>
                      <SelectItem value="judgeme">Judge.me</SelectItem>
                      <SelectItem value="trustpilot">Trustpilot</SelectItem>
                      <SelectItem value="google">Google Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="api-key">Clé API</Label>
                  <Input type="password" placeholder="Votre clé API" />
                </div>
              </div>
              <Button className="w-full">
                Connecter la Plateforme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStats.ratingDistribution.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-sm">{item.rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(item.count / mockStats.total) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution des Avis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Graphique à venir...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération Automatique</CardTitle>
              <CardDescription>
                Configurez les règles de modération automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Filtrer les avis avec des mots inappropriés</p>
                  <p className="text-sm text-muted-foreground">
                    Met automatiquement en attente les avis contenant des mots interdits
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Validation manuelle pour les avis 1-2 étoiles</p>
                  <p className="text-sm text-muted-foreground">
                    Nécessite une validation avant publication
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Réponse automatique aux avis positifs</p>
                  <p className="text-sm text-muted-foreground">
                    Envoie un message de remerciement automatique
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}