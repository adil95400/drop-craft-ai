import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Star, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface AddReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddReviewModal({ open, onOpenChange }: AddReviewModalProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    title: '',
    content: '',
    rating: 5,
    platform: 'website',
    verified_purchase: false,
    product_id: '',
    status: 'published'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Mock API call - in real implementation, this would call the backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Avis ajouté avec succès!')
      onOpenChange(false)
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        title: '',
        content: '',
        rating: 5,
        platform: 'website',
        verified_purchase: false,
        product_id: '',
        status: 'published'
      })
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'avis')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
            }`}
            onClick={() => onRatingChange(star)}
          />
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Ajouter un Avis Client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nom du client *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Jean Dupont"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email du client</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                placeholder="jean@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre de l'avis</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Excellent produit, très satisfait !"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu de l'avis *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Décrivez votre expérience avec le produit..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Note *</Label>
            <div className="flex items-center gap-4">
              {renderStars(formData.rating, (rating) => 
                setFormData(prev => ({ ...prev, rating }))
              )}
              <span className="text-sm text-muted-foreground">
                {formData.rating}/5 étoile{formData.rating > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Plateforme</Label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Site Web</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_id">ID Produit (optionnel)</Label>
            <Input
              id="product_id"
              value={formData.product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
              placeholder="prod_123456"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="verified_purchase"
              checked={formData.verified_purchase}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verified_purchase: checked }))}
            />
            <Label htmlFor="verified_purchase">Achat vérifié</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ajout...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Ajouter l'avis
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}