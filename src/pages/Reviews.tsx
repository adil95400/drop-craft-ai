import { useState } from 'react'
import { Star, ThumbsUp, Filter, Search, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReviews } from '@/hooks/useReviews'

export default function Reviews() {
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const { reviews, stats, isLoading, markHelpful } = useReviews()

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter
    return matchesSearch && matchesRating
  })

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Chargement des avis...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Star className="w-8 h-8 text-primary" />
            Avis Clients
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez et analysez les avis de vos clients avec des outils avancés
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtres Avancés
          </Button>
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Recherche IA
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            onClick={() => window.location.href = '/reviews-ultra-pro'}
          >
            <Crown className="w-4 h-4 mr-2" />
            Reviews Ultra Pro
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avis</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
            {renderStars(Math.round(stats.averageRating))}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribution des Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.ratingDistribution.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-8">{rating}★</span>
                <Progress value={(count / (stats.total || 1)) * 100} className="flex-1" />
                <span className="text-sm text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <Star className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Système d'Avis en Développement</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Le module de gestion des avis clients sera bientôt disponible. 
              Il vous permettra de collecter, modérer et analyser les retours de vos clients.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-lg mx-auto">
              <div className="text-left">
                <h3 className="font-medium">Fonctionnalités à venir :</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Collecte automatique d'avis</li>
                  <li>• Modération et réponses</li>
                  <li>• Analytics détaillées</li>
                  <li>• Intégration e-commerce</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Bénéfices :</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Améliorer la confiance</li>
                  <li>• Booster les conversions</li>
                  <li>• Feedback précieux</li>
                  <li>• SEO optimisé</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}