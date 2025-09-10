import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Star, ThumbsUp, ThumbsDown, Flag, Reply, Filter, TrendingUp } from 'lucide-react'

export default function ReviewsPage() {
  const [selectedRating, setSelectedRating] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const reviewStats = {
    averageRating: 4.6,
    totalReviews: 1247,
    breakdown: [
      { rating: 5, count: 823, percentage: 66 },
      { rating: 4, count: 249, percentage: 20 },
      { rating: 3, count: 112, percentage: 9 },
      { rating: 2, count: 37, percentage: 3 },
      { rating: 1, count: 26, percentage: 2 }
    ]
  }

  const reviews = [
    {
      id: '1',
      extension: 'Data Scraper Pro',
      user: {
        name: 'Jean Dupont',
        avatar: '/api/placeholder/32/32',
        verified: true
      },
      rating: 5,
      date: '2024-01-15',
      title: 'Excellent outil pour le scraping',
      content: 'Cette extension a révolutionné mon workflow. Interface intuitive et performances exceptionnelles. Je recommande vivement !',
      helpful: 24,
      notHelpful: 2,
      response: {
        author: 'Équipe Dev',
        content: 'Merci beaucoup pour ce retour positif ! Nous sommes ravis que l\'extension vous aide dans votre travail.',
        date: '2024-01-16'
      }
    },
    {
      id: '2',
      extension: 'Review Importer',
      user: {
        name: 'Marie Martin',
        avatar: '/api/placeholder/32/32',
        verified: false
      },
      rating: 4,
      date: '2024-01-14',
      title: 'Très utile mais quelques bugs',
      content: 'Globalement satisfaite de l\'extension. L\'import fonctionne bien mais j\'ai rencontré quelques problèmes avec les avis Amazon. Support réactif.',
      helpful: 18,
      notHelpful: 1,
      response: null
    },
    {
      id: '3',
      extension: 'Price Monitor',
      user: {
        name: 'Pierre Durant',
        avatar: '/api/placeholder/32/32',
        verified: true
      },
      rating: 3,
      date: '2024-01-12',
      title: 'Potentiel mais améliorations nécessaires',
      content: 'L\'idée est bonne mais l\'interface pourrait être plus claire. Les notifications sont parfois tardives.',
      helpful: 12,
      notHelpful: 5,
      response: null
    }
  ]

  const extensionReviews = [
    {
      name: 'Data Scraper Pro',
      rating: 4.8,
      reviews: 456,
      trend: '+15%'
    },
    {
      name: 'Review Importer',
      rating: 4.6,
      reviews: 289,
      trend: '+8%'
    },
    {
      name: 'Price Monitor',
      rating: 4.3,
      reviews: 324,
      trend: '-2%'
    },
    {
      name: 'SEO Optimizer',
      rating: 4.7,
      reviews: 178,
      trend: '+22%'
    }
  ]

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestion des Avis
        </h1>
        <p className="text-muted-foreground mt-2">
          Consultez et gérez les avis de vos extensions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold mb-2">{reviewStats.averageRating}</div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(reviewStats.averageRating), 'w-5 h-5')}
            </div>
            <p className="text-sm text-muted-foreground">
              Basé sur {reviewStats.totalReviews.toLocaleString()} avis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Répartition des Notes</h3>
            <div className="space-y-2">
              {reviewStats.breakdown.map((item) => (
                <div key={item.rating} className="flex items-center space-x-2">
                  <span className="text-sm w-2">{item.rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <Progress value={item.percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-8">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Extensions Populaires</h3>
            <div className="space-y-3">
              {extensionReviews.slice(0, 3).map((ext, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{ext.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {ext.rating} ⭐
                    </Badge>
                  </div>
                  <Badge variant={ext.trend.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                    {ext.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-reviews">Tous les Avis</TabsTrigger>
          <TabsTrigger value="by-extension">Par Extension</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
        </TabsList>

        <TabsContent value="all-reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Avis Récents</CardTitle>
                <div className="flex space-x-2">
                  <Select value={selectedRating} onValueChange={setSelectedRating}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les notes</SelectItem>
                      <SelectItem value="5">5 étoiles</SelectItem>
                      <SelectItem value="4">4 étoiles</SelectItem>
                      <SelectItem value="3">3 étoiles</SelectItem>
                      <SelectItem value="2">2 étoiles</SelectItem>
                      <SelectItem value="1">1 étoile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Plus récents</SelectItem>
                      <SelectItem value="oldest">Plus anciens</SelectItem>
                      <SelectItem value="highest">Note élevée</SelectItem>
                      <SelectItem value="lowest">Note faible</SelectItem>
                      <SelectItem value="helpful">Plus utiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={review.user.avatar} />
                      <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{review.user.name}</span>
                          {review.user.verified && (
                            <Badge variant="outline" className="text-xs">Vérifié</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        {renderStars(review.rating)}
                        <Badge variant="outline">{review.extension}</Badge>
                      </div>
                      
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                      <p className="text-sm mb-4">{review.content}</p>
                      
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {review.helpful}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {review.notHelpful}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Reply className="w-4 h-4 mr-1" />
                          Répondre
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Flag className="w-4 h-4 mr-1" />
                          Signaler
                        </Button>
                      </div>
                      
                      {review.response && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-sm">{review.response.author}</span>
                            <Badge variant="outline" className="text-xs">Développeur</Badge>
                            <span className="text-xs text-muted-foreground">{review.response.date}</span>
                          </div>
                          <p className="text-sm">{review.response.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-extension" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avis par Extension</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {extensionReviews.map((ext, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{ext.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(Math.round(ext.rating))}
                            <span className="text-sm text-muted-foreground">
                              {ext.rating} • {ext.reviews} avis
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={ext.trend.startsWith('+') ? 'default' : 'secondary'}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {ext.trend}
                          </Badge>
                          <Button variant="outline" size="sm">Voir détails</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération des Avis</CardTitle>
              <CardDescription>
                Avis signalés et en attente de modération
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun avis signalé</h3>
                <p className="text-muted-foreground">
                  Tous les avis respectent nos conditions d'utilisation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}