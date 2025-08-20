import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, ThumbsUp, CheckCircle, Clock, AlertTriangle, Edit2, Trash2, MessageSquare } from 'lucide-react'
import { useRealReviews } from '@/hooks/useRealReviews'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'
import { toast } from 'sonner'

interface ReviewDetailsModalProps {
  reviewId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReviewDetailsModal({ reviewId, open, onOpenChange }: ReviewDetailsModalProps) {
  const { reviews, markHelpful } = useRealReviews()
  const [response, setResponse] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  
  const review = reviews.find(r => r.id === reviewId)

  if (!review) {
    return null
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleResponse = async () => {
    if (!response.trim()) return

    setIsResponding(true)
    try {
      // Mock API call - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Réponse ajoutée avec succès!')
      setResponse('')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la réponse')
    } finally {
      setIsResponding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Détails de l'avis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Header */}
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {(review.customer_name || 'A').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{review.customer_name || 'Client anonyme'}</h3>
                <Badge 
                  variant={review.status === 'published' ? 'default' : 
                          review.status === 'pending' ? 'secondary' : 'destructive'}
                >
                  {getStatusIcon(review.status)}
                  <span className="ml-1 capitalize">{review.status}</span>
                </Badge>
                {review.verified_purchase && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span>{review.customer_email}</span>
                <span>•</span>
                <span>{new Date(review.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
                <span>•</span>
                <span className="capitalize">{review.platform}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">({review.rating}/5)</span>
              </div>
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-4">
            {review.title && (
              <div>
                <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-foreground leading-relaxed">{review.content}</p>
            </div>

            {review.photos && review.photos.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Photos jointes</h5>
                <div className="grid grid-cols-3 gap-2">
                  {review.photos.map((photo, index) => (
                    <img 
                      key={index}
                      src={photo} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Review Stats */}
          <div className="flex items-center gap-6 py-4 border-t border-b">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{review.helpful_count} personnes ont trouvé cet avis utile</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markHelpful(review.id)}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Marquer comme utile
            </Button>
          </div>

          {/* Response Section */}
          <div className="space-y-4">
            <h5 className="font-medium">Répondre à cet avis</h5>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Rédigez votre réponse à ce client..."
              rows={4}
            />
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Une réponse professionnelle et bienveillante améliore votre réputation
              </div>
              <Button 
                onClick={handleResponse}
                disabled={!response.trim() || isResponding}
                size="sm"
              >
                {isResponding ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Répondre
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}