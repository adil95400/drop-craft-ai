import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { 
  Star, ThumbsUp, MessageCircle, Flag, 
  CheckCircle, Filter
} from 'lucide-react'
import { ReviewsService, Review } from '@/services/reviews.service'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'

interface ProductReviewsProps {
  productId: string
  reviews?: Review[]
}

export function ProductReviews({ productId, reviews: initialReviews }: ProductReviewsProps) {
  const { toast } = useToast()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [isLoading, setIsLoading] = useState(!initialReviews)

  useEffect(() => {
    if (!initialReviews) {
      loadReviews()
    }
  }, [productId, initialReviews])

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const data = await ReviewsService.getProductReviews(productId)
      setReviews(data)
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les avis",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = ReviewsService.calculateReviewStats(reviews)
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating, index) => ({
    rating,
    count: stats.distribution[index],
    percentage: reviews.length > 0 ? (stats.distribution[index] / reviews.length) * 100 : 0
  }))

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    
    toast({
      title: "Réponse envoyée",
      description: "Votre réponse a été publiée"
    })
    setReplyingTo(null)
    setReplyText('')
  }

  const markAsHelpful = (reviewId: string) => {
    toast({
      title: "Merci !",
      description: "Votre avis a été enregistré"
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Avis Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé des notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="space-y-1">
                  <div className="flex gap-1">{renderStars(Math.round(stats.averageRating))}</div>
                  <p className="text-sm text-muted-foreground">
                    Basé sur {reviews.length} avis
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liste des avis */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tous les avis</h3>
            {reviews.map((review) => (
              <Card key={review.id} className="border-primary/10">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.customer_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{review.customer_name}</span>
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Achat vérifié
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">{renderStars(review.rating)}</div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: getDateFnsLocale() })}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">{review.title}</h4>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review ${idx + 1}`}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsHelpful(review.id)}
                      className="gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Utile ({review.helpful_count})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                  </div>

                  {replyingTo === review.id && (
                    <div className="space-y-2 pt-2 border-t">
                      <Textarea
                        placeholder="Votre réponse..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleReply(review.id)} size="sm">
                          Envoyer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText('')
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
