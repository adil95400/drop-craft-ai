/**
 * ProductReviewsTab - Onglet Avis pour le modal produit
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useProductReviews } from '@/hooks/useProductReviews'
import {
  Star,
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Image as ImageIcon,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Download,
  ExternalLink,
} from 'lucide-react'

interface ProductReviewsTabProps {
  productId: string
  productName: string
}

export function ProductReviewsTab({ productId, productName }: ProductReviewsTabProps) {
  const { reviews, stats, isLoading, deleteReview, isDeleting, togglePublish } = useProductReviews(productId)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [showWithImagesOnly, setShowWithImagesOnly] = useState(false)

  const filteredReviews = reviews.filter(review => {
    if (filterRating && review.rating !== filterRating) return false
    if (showVerifiedOnly && !review.is_verified) return false
    if (showWithImagesOnly && (!review.images || review.images.length === 0)) return false
    return true
  })

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClass,
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-600">
                    {stats.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div>
                {renderStars(Math.round(stats.averageRating), 'md')}
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.total} avis au total
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.distribution[rating as keyof typeof stats.distribution]
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={cn(
                      "flex items-center gap-3 w-full group transition-all",
                      filterRating === rating && "opacity-100",
                      filterRating && filterRating !== rating && "opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-1 w-12 justify-end">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress 
                      value={percentage} 
                      className="flex-1 h-2 group-hover:h-3 transition-all" 
                    />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={showVerifiedOnly ? "default" : "outline"} 
          className="cursor-pointer gap-1.5 py-1.5"
          onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {stats.verifiedCount} vérifiés
        </Badge>
        <Badge 
          variant={showWithImagesOnly ? "default" : "outline"} 
          className="cursor-pointer gap-1.5 py-1.5"
          onClick={() => setShowWithImagesOnly(!showWithImagesOnly)}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          {stats.withImagesCount} avec photos
        </Badge>
        {filterRating && (
          <Badge 
            variant="secondary" 
            className="cursor-pointer gap-1.5 py-1.5"
            onClick={() => setFilterRating(null)}
          >
            <Filter className="h-3.5 w-3.5" />
            {filterRating} étoiles uniquement
            <span className="ml-1 text-xs">×</span>
          </Badge>
        )}
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Avis clients ({filteredReviews.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredReviews.map((review, idx) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "p-4 rounded-xl border bg-card transition-all hover:shadow-md",
                        !review.is_published && "opacity-60 bg-muted/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {review.author_name?.charAt(0).toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {review.author_name || 'Client anonyme'}
                            </span>
                            {review.is_verified && (
                              <Badge variant="secondary" className="gap-1 text-xs py-0">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Vérifié
                              </Badge>
                            )}
                            {review.source_platform && (
                              <Badge variant="outline" className="text-xs py-0">
                                {review.source_platform}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            {review.content}
                          </p>
                          
                          {/* Review Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3 flex-wrap">
                              {review.images.slice(0, 4).map((img, imgIdx) => (
                                <a
                                  key={imgIdx}
                                  href={img}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-16 w-16 rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all"
                                >
                                  <img
                                    src={img}
                                    alt={`Review image ${imgIdx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </a>
                              ))}
                              {review.images.length > 4 && (
                                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-sm font-medium">
                                  +{review.images.length - 4}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              {review.helpful_count || 0}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => togglePublish({ 
                                reviewId: review.id, 
                                isPublished: !review.is_published 
                              })}
                            >
                              {review.is_published ? (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  Masquer
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3" />
                                  Afficher
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                              onClick={() => deleteReview(review.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">Aucun avis pour ce produit</p>
              <p className="text-xs text-muted-foreground">
                Importez des avis depuis l'extension Chrome ShopOpti+
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
