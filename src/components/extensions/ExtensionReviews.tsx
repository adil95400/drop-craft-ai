import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Star, ThumbsUp, ThumbsDown, MessageSquare, Filter,
  CheckCircle, AlertTriangle, Flag, Reply, Heart
} from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  user_name: string
  user_avatar: string
  rating: number
  title: string
  content: string
  verified_purchase: boolean
  helpful_count: number
  date: string
  developer_response?: {
    content: string
    date: string
  }
  reported: boolean
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: '1',
    user_name: 'Marie Dubois',
    user_avatar: '/api/placeholder/32/32',
    rating: 5,
    title: 'Extension fantastique!',
    content: 'Cette extension a complètement transformé ma boutique. L\'interface est intuitive et les fonctionnalités sont exactement ce dont j\'avais besoin. Le support client est également excellent.',
    verified_purchase: true,
    helpful_count: 12,
    date: '2024-01-15',
    developer_response: {
      content: 'Merci beaucoup pour ce retour positif! Nous sommes ravis que l\'extension réponde à vos attentes.',
      date: '2024-01-16'
    },
    reported: false
  },
  {
    id: '2',
    user_name: 'Jean Martin',
    user_avatar: '/api/placeholder/32/32',
    rating: 4,
    title: 'Très utile mais quelques bugs',
    content: 'L\'extension fonctionne bien dans l\'ensemble. J\'ai rencontré quelques problèmes mineurs avec l\'import de données, mais le support technique a été réactif pour résoudre le problème.',
    verified_purchase: true,
    helpful_count: 8,
    date: '2024-01-12',
    developer_response: {
      content: 'Merci pour votre retour. Nous avons corrigé le problème d\'import dans la version 2.1.1. N\'hésitez pas à nous contacter si vous avez d\'autres questions.',
      date: '2024-01-13'
    },
    reported: false
  },
  {
    id: '3',
    user_name: 'Sophie Laurent',
    user_avatar: '/api/placeholder/32/32',
    rating: 2,
    title: 'Décevant par rapport aux attentes',
    content: 'L\'extension ne fonctionne pas comme annoncé. Plusieurs fonctionnalités ne sont pas disponibles et l\'interface est confuse. J\'ai demandé un remboursement.',
    verified_purchase: true,
    helpful_count: 3,
    date: '2024-01-10',
    reported: false
  },
  {
    id: '4',
    user_name: 'Pierre Dupont',
    user_avatar: '/api/placeholder/32/32',
    rating: 5,
    title: 'Parfait pour mon e-commerce',
    content: 'Installation facile, configuration intuitive et résultats immédiats. Cette extension a augmenté mes ventes de 25% en un mois. Je recommande vivement!',
    verified_purchase: true,
    helpful_count: 15,
    date: '2024-01-08',
    developer_response: {
      content: 'Nous sommes très heureux d\'apprendre ces excellents résultats! Merci de nous faire confiance.',
      date: '2024-01-09'
    },
    reported: false
  }
]

export const ExtensionReviews = ({ extensionId }: { extensionId: string }) => {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS)
  const [sortBy, setSortBy] = useState('recent')
  const [ratingFilter, setRatingFilter] = useState('')
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }))

  const filteredReviews = reviews.filter(review => {
    if (ratingFilter) {
      return review.rating === parseInt(ratingFilter)
    }
    return true
  })

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case 'helpful':
        return b.helpful_count - a.helpful_count
      case 'rating_high':
        return b.rating - a.rating
      case 'rating_low':
        return a.rating - b.rating
      default:
        return 0
    }
  })

  const handleHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, helpful_count: review.helpful_count + 1 }
        : review
    ))
    toast.success('Merci pour votre retour!')
  }

  const handleReport = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, reported: true }
        : review
    ))
    toast.success('Avis signalé pour modération')
  }

  const handleReply = (reviewId: string) => {
    if (!replyContent.trim()) return
    
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            developer_response: {
              content: replyContent,
              date: new Date().toISOString().split('T')[0]
            }
          }
        : review
    ))
    setReplyContent('')
    setShowReplyForm(null)
    toast.success('Réponse publiée!')
  }

  const renderStars = (rating: number, size = 'sm') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground'
            }`} 
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Avis et évaluations</h1>
        <p className="text-muted-foreground">
          {reviews.length} avis • Note moyenne: {averageRating.toFixed(1)}/5
        </p>
      </div>

      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des évaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(averageRating), 'lg')}
              <div className="text-sm text-muted-foreground mt-2">
                Basé sur {reviews.length} avis
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrer par:</span>
        </div>
        
        <select 
          value={ratingFilter} 
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="">Toutes les notes</option>
          <option value="5">5 étoiles</option>
          <option value="4">4 étoiles</option>
          <option value="3">3 étoiles</option>
          <option value="2">2 étoiles</option>
          <option value="1">1 étoile</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="recent">Plus récents</option>
          <option value="helpful">Plus utiles</option>
          <option value="rating_high">Note décroissante</option>
          <option value="rating_low">Note croissante</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map(review => (
          <Card key={review.id} className={review.reported ? 'opacity-50' : ''}>
            <CardContent className="p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.user_avatar} />
                    <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.user_name}</span>
                      {review.verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Achat vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleReport(review.id)}
                  disabled={review.reported}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>

              {/* Review Content */}
              <div className="space-y-3">
                <h3 className="font-semibold">{review.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {review.content}
                </p>
              </div>

              {/* Review Actions */}
              <div className="flex items-center gap-4 mt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Utile ({review.helpful_count})
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowReplyForm(review.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Répondre
                </Button>
              </div>

              {/* Developer Response */}
              {review.developer_response && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Réponse du développeur
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.developer_response.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm">{review.developer_response.content}</p>
                </div>
              )}

              {/* Reply Form */}
              {showReplyForm === review.id && (
                <div className="mt-4 p-4 border rounded-lg bg-background">
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Rédigez votre réponse..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleReply(review.id)}
                        disabled={!replyContent.trim()}
                      >
                        Publier la réponse
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowReplyForm(null)
                          setReplyContent('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedReviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun avis trouvé</h3>
            <p className="text-muted-foreground">
              Aucun avis ne correspond à vos critères de filtrage.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setRatingFilter('')
                setSortBy('recent')
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques des avis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {reviews.filter(r => r.verified_purchase).length}
              </div>
              <div className="text-sm text-muted-foreground">Achats vérifiés</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {reviews.reduce((sum, r) => sum + r.helpful_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Votes utiles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {reviews.filter(r => r.developer_response).length}
              </div>
              <div className="text-sm text-muted-foreground">Réponses développeur</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExtensionReviews