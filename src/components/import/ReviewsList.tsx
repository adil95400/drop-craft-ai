/**
 * ReviewsList — Displays individual reviews with sentiment badges
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ThumbsUp, CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { analyzeSentiment } from '@/services/scraper/normalizer'
import type { ProductReview } from '@/services/scraper/types'

interface ReviewsListProps {
  reviews: ProductReview[]
  maxVisible?: number
}

export function ReviewsList({ reviews, maxVisible = 5 }: ReviewsListProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleReviews = showAll ? reviews : reviews.slice(0, maxVisible)

  if (!reviews.length) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Avis clients ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleReviews.map((review, idx) => (
          <ReviewItem key={idx} review={review} />
        ))}

        {reviews.length > maxVisible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs"
          >
            {showAll ? (
              <>Voir moins <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>Voir les {reviews.length - maxVisible} autres avis <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ReviewItem({ review }: { review: ProductReview }) {
  const sentiment = review.sentiment || analyzeSentiment(review.content)

  const sentimentColors = {
    positive: 'bg-green-500/10 text-green-700 dark:text-green-400',
    neutral: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    negative: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Stars */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${s <= (review.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
              />
            ))}
          </div>
          {/* Author */}
          <span className="text-xs text-muted-foreground">{review.author || 'Anonyme'}</span>
          {/* Verified */}
          {review.verified && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-0.5">
              <CheckCircle className="h-2.5 w-2.5" /> Vérifié
            </Badge>
          )}
        </div>
        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${sentimentColors[sentiment]}`}>
          {sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐'}
        </Badge>
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-xs font-medium text-foreground">{review.title}</p>
      )}

      {/* Content */}
      <p className="text-xs text-muted-foreground line-clamp-3">{review.content}</p>

      {/* Footer */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {review.date && <span>{new Date(review.date).toLocaleDateString('fr-FR')}</span>}
        {review.variant && <span>Variante: {review.variant}</span>}
        {(review.helpfulCount ?? 0) > 0 && (
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="h-2.5 w-2.5" /> {review.helpfulCount}
          </span>
        )}
        {(review.images?.length ?? 0) > 0 && (
          <span className="flex items-center gap-0.5">
            <ImageIcon className="h-2.5 w-2.5" /> {review.images!.length}
          </span>
        )}
      </div>
    </div>
  )
}
