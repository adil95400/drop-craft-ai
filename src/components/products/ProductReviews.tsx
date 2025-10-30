import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, StarHalf, ThumbsUp, Flag, MessageSquare, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Review {
  id: string
  customer_name: string
  customer_avatar?: string
  rating: number
  title: string
  comment: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  images?: string[]
}

interface ProductReviewsProps {
  productId: string
  reviews?: Review[]
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: '1',
    customer_name: 'Sophie Martin',
    rating: 5,
    title: 'Excellent produit !',
    comment: 'Très satisfaite de mon achat. La qualité est au rendez-vous et la livraison était rapide. Je recommande vivement !',
    verified_purchase: true,
    helpful_count: 12,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    customer_name: 'Marc Dubois',
    rating: 4,
    title: 'Bon rapport qualité/prix',
    comment: 'Produit conforme à la description. Un petit point à améliorer sur l\'emballage mais sinon rien à redire.',
    verified_purchase: true,
    helpful_count: 8,
    created_at: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    customer_name: 'Julie Leroy',
    rating: 5,
    title: 'Parfait !',
    comment: 'Exactement ce que je cherchais. Service client très réactif également.',
    verified_purchase: true,
    helpful_count: 5,
    created_at: '2024-01-05T09:15:00Z'
  }
]

export function ProductReviews({ productId, reviews = SAMPLE_REVIEWS }: ProductReviewsProps) {
  const { toast } = useToast()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
  }))

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
    }
    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)
    }
    return stars
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return
    
    try {
      // TODO: Appel API pour envoyer la réponse
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été publiée"
      })
      setReplyingTo(null)
      setReplyText('')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la réponse",
        variant: "destructive"
      })
    }
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
            <MessageSquare className="h-5 w-5 text-primary" />
            Avis Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé des notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="space-y-1">
                  <div className="flex gap-1">{renderStars(averageRating)}</div>
                  <p className="text-sm text-muted-foreground">
                    Basé sur {reviews.length} avis
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0)}% recommandent ce produit
              </Badge>
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
                        <AvatarImage src={review.customer_avatar} />
                        <AvatarFallback>
                          {review.customer_name.split(' ').map(n => n[0]).join('')}
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
                          {format(new Date(review.created_at), 'dd MMMM yyyy', { locale: fr })}
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
                      <MessageSquare className="h-4 w-4 mr-1" />
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
