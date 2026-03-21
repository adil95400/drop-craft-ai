/**
 * ReviewAnalysisPanel — Displays review analysis with sentiment, distribution, keywords
 */
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Star, ThumbsUp, ThumbsDown, Minus, AlertTriangle, CheckCircle, Image as ImageIcon } from 'lucide-react'
import { analyzeReviews, calculateReviewTrustScore } from '@/services/scraper/reviewExtractor'
import type { ProductReview } from '@/services/scraper/types'

interface ReviewAnalysisPanelProps {
  reviews: ProductReview[]
  rating?: number
  reviewsCount?: number
}

export function ReviewAnalysisPanel({ reviews, rating, reviewsCount }: ReviewAnalysisPanelProps) {
  const analysis = useMemo(() => analyzeReviews(reviews), [reviews])
  const trustScore = useMemo(() => calculateReviewTrustScore(reviews), [reviews])

  if (!reviews.length && !rating) return null

  const sentiments = analysis.distribution.sentimentBreakdown
  const totalSentiments = sentiments ? sentiments.positive + sentiments.neutral + sentiments.negative : 0

  return (
    <div className="space-y-4">
      {/* Rating & Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Avis clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global rating */}
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-foreground">
              {analysis.distribution.averageRating || rating || '—'}
            </div>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(analysis.distribution.averageRating || rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {analysis.distribution.totalReviews || reviewsCount || 0} avis
              </p>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = analysis.distribution.distribution[star] || 0
              const total = Math.max(analysis.distribution.totalReviews, 1)
              const pct = Math.round((count / total) * 100)
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-muted-foreground">{star}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                </div>
              )
            })}
          </div>

          {/* Trust score */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Score de confiance</span>
            <Badge variant={trustScore >= 70 ? 'default' : trustScore >= 40 ? 'secondary' : 'destructive'} className="text-xs">
              {trustScore}/100
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      {sentiments && totalSentiments > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Analyse de sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SentimentBar icon={ThumbsUp} label="Positif" count={sentiments.positive} total={totalSentiments} color="bg-green-500" />
            <SentimentBar icon={Minus} label="Neutre" count={sentiments.neutral} total={totalSentiments} color="bg-yellow-500" />
            <SentimentBar icon={ThumbsDown} label="Négatif" count={sentiments.negative} total={totalSentiments} color="bg-red-500" />
          </CardContent>
        </Card>
      )}

      {/* Top Keywords */}
      {analysis.topKeywords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mots-clés fréquents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.topKeywords.slice(0, 12).map((kw) => (
                <Badge
                  key={kw.word}
                  variant="outline"
                  className={`text-xs ${kw.sentiment === 'positive' ? 'border-green-500/30 text-green-700 dark:text-green-400' : kw.sentiment === 'negative' ? 'border-red-500/30 text-red-700 dark:text-red-400' : ''}`}
                >
                  {kw.word} ({kw.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Issues */}
      {analysis.commonIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Problèmes détectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analysis.commonIssues.map((issue) => (
                <li key={issue} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quality Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Qualité des avis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Indicator
            label="Achats vérifiés"
            active={analysis.qualityIndicators.hasVerifiedPurchases}
          />
          <Indicator
            label="Photos clients"
            active={analysis.qualityIndicators.hasImages}
          />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Longueur moyenne</span>
            <span className="font-medium">{analysis.qualityIndicators.averageContentLength} car.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SentimentBar({ icon: Icon, label, count, total, color }: { icon: any; label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / Math.max(total, 1)) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="w-14 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-muted-foreground">{pct}%</span>
    </div>
  )
}

function Indicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      {active ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Minus className="h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </div>
  )
}
