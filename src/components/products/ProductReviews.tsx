import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Star, ThumbsUp, MessageCircle, Flag, Plus,
  Loader2, Trash2, CheckCircle, Globe, Search
} from 'lucide-react'
import { format } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { motion, AnimatePresence } from 'framer-motion'

interface Review {
  id: string
  author: string
  rating: number
  text: string
  verified_purchase: boolean
  helpful_count: number
  created_at: string
  images: string[] | null
  country: string | null
  source_platform: string | null
}

interface ProductReviewsProps {
  productId: string
  sourceUrl?: string
}

export function ProductReviews({ productId, sourceUrl }: ProductReviewsProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [isScraping, setIsScraping] = useState(false)
  const [showScrapeInput, setShowScrapeInput] = useState(false)
  const [scrapeUrlInput, setScrapeUrlInput] = useState(sourceUrl || '')

  // New review form
  const [newReview, setNewReview] = useState({
    author: '',
    rating: 5,
    text: '',
    verified_purchase: false,
    country: '',
    source_platform: 'manual',
  })

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews((data || []) as Review[])
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (productId) loadReviews()
  }, [productId])

  const handleAddReview = async () => {
    if (!user || !newReview.text.trim() || !newReview.author.trim()) {
      toast({ title: 'Erreur', description: 'Remplissez tous les champs obligatoires', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          author: newReview.author,
          rating: newReview.rating,
          text: newReview.text,
          verified_purchase: newReview.verified_purchase,
          country: newReview.country || null,
          source_platform: newReview.source_platform,
        })

      if (error) throw error

      toast({ title: 'Avis ajouté avec succès' })
      setNewReview({ author: '', rating: 5, text: '', verified_purchase: false, country: '', source_platform: 'manual' })
      setShowAddForm(false)
      loadReviews()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error
      toast({ title: 'Avis supprimé' })
      loadReviews()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  }

  const filteredReviews = filterRating
    ? reviews.filter(r => r.rating === filterRating)
    : reviews

  // Stats
  const stats = {
    total: reviews.length,
    average: reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
    distribution: [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      pct: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0,
    })),
  }

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-5 w-5 transition-colors ${
            i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
          onClick={interactive && onChange ? () => onChange(i) : undefined}
        />
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Avis Clients</h3>
          <p className="text-sm text-muted-foreground">{stats.total} avis au total</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => sourceUrl ? handleScrapeReviews() : setShowScrapeInput(!showScrapeInput)} 
            className="gap-2"
            disabled={isScraping}
          >
            {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Scraper des avis
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un avis
          </Button>
        </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold tabular-nums">{stats.average.toFixed(1)}</p>
                <div className="mt-1">{renderStars(Math.round(stats.average))}</div>
                <p className="text-sm text-muted-foreground mt-1">{stats.total} avis</p>
              </div>
            </div>
            <div className="space-y-2">
              {stats.distribution.map(({ rating, count, pct }) => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={`flex items-center gap-2 w-full group transition-colors rounded px-1 ${
                    filterRating === rating ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                >
                  <span className="text-sm w-8 tabular-nums">{rating}★</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-yellow-400 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: (5 - rating) * 0.1 }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right tabular-nums">{count}</span>
                </button>
              ))}
            </div>
          </div>
          {filterRating && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                Filtre: {filterRating}★
                <button onClick={() => setFilterRating(null)} className="ml-1 hover:text-destructive">✕</button>
              </Badge>
              <span className="text-sm text-muted-foreground">{filteredReviews.length} résultat(s)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h4 className="font-semibold mb-1">Aucun avis</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {filterRating ? `Aucun avis ${filterRating}★ pour ce produit` : 'Commencez par ajouter un premier avis'}
            </p>
            {!filterRating && (
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un avis
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {review.author?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{review.author}</span>
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Vérifié
                            </Badge>
                          )}
                          {review.country && (
                            <span className="text-xs text-muted-foreground">📍 {review.country}</span>
                          )}
                          {review.source_platform && review.source_platform !== 'manual' && (
                            <Badge variant="outline" className="text-[10px] h-5">{review.source_platform}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.created_at), 'dd MMM yyyy', { locale: getDateFnsLocale() })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed pl-[52px]">{review.text}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 pl-[52px]">
                      {review.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pl-[52px] pt-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                      <ThumbsUp className="h-3 w-3" />
                      Utile ({review.helpful_count || 0})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Répondre
                    </Button>
                  </div>

                  {replyingTo === review.id && (
                    <div className="space-y-2 pl-[52px] pt-2 border-t">
                      <Textarea
                        placeholder="Votre réponse au client..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs">Envoyer</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setReplyingTo(null); setReplyText('') }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Add Review Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Ajouter un avis
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Note</Label>
              <div className="flex items-center gap-3">
                {renderStars(newReview.rating, true, (r) => setNewReview(p => ({ ...p, rating: r })))}
                <span className="text-sm text-muted-foreground font-medium">{newReview.rating}/5</span>
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="review-author" className="text-sm font-semibold">Nom du client *</Label>
              <Input
                id="review-author"
                value={newReview.author}
                onChange={(e) => setNewReview(p => ({ ...p, author: e.target.value }))}
                placeholder="Ex: Marie Dupont"
              />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <Label htmlFor="review-text" className="text-sm font-semibold">Commentaire *</Label>
              <Textarea
                id="review-text"
                value={newReview.text}
                onChange={(e) => setNewReview(p => ({ ...p, text: e.target.value }))}
                placeholder="Décrivez l'expérience du client..."
                rows={4}
              />
            </div>

            {/* Country + Verified */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review-country" className="text-sm font-semibold">Pays</Label>
                <Input
                  id="review-country"
                  value={newReview.country}
                  onChange={(e) => setNewReview(p => ({ ...p, country: e.target.value }))}
                  placeholder="France"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Source</Label>
                <select
                  value={newReview.source_platform}
                  onChange={(e) => setNewReview(p => ({ ...p, source_platform: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="manual">Manuel</option>
                  <option value="aliexpress">AliExpress</option>
                  <option value="amazon">Amazon</option>
                  <option value="shopify">Shopify</option>
                  <option value="trustpilot">Trustpilot</option>
                </select>
              </div>
            </div>

            {/* Verified purchase toggle */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={newReview.verified_purchase}
                onChange={(e) => setNewReview(p => ({ ...p, verified_purchase: e.target.checked }))}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium">Achat vérifié</p>
                <p className="text-xs text-muted-foreground">Marquer cet avis comme provenant d'un acheteur confirmé</p>
              </div>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
            <Button
              onClick={handleAddReview}
              disabled={isSubmitting || !newReview.author.trim() || !newReview.text.trim()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Ajouter l'avis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
