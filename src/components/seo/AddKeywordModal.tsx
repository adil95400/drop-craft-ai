import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, X, TrendingUp, Target, DollarSign } from 'lucide-react'
import { useRealSEO } from '@/hooks/useRealSEO'
import { toast } from 'sonner'

interface AddKeywordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddKeywordModal({ open, onOpenChange }: AddKeywordModalProps) {
  const { addKeyword, isAddingKeyword } = useRealSEO()
  const [formData, setFormData] = useState({
    keyword: '',
    target_url: '',
    competition: 'medium',
    tracking_active: true,
    related_keywords: [] as string[]
  })
  const [relatedKeyword, setRelatedKeyword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keyword.trim()) {
      toast.error('Veuillez entrer un mot-clé')
      return
    }

    try {
      await addKeyword(formData)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        keyword: '',
        target_url: '',
        competition: 'medium',
        tracking_active: true,
        related_keywords: []
      })
      setRelatedKeyword('')
    } catch (error) {
      // Error handled by the hook
    }
  }

  const addRelatedKeyword = () => {
    if (relatedKeyword.trim() && !formData.related_keywords.includes(relatedKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        related_keywords: [...prev.related_keywords, relatedKeyword.trim()]
      }))
      setRelatedKeyword('')
    }
  }

  const removeRelatedKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      related_keywords: prev.related_keywords.filter(k => k !== keyword)
    }))
  }

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Ajouter un Mot-clé
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="keyword">Mot-clé principal *</Label>
            <Input
              id="keyword"
              value={formData.keyword}
              onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
              placeholder="Ex: coque iphone 15 pro"
              required
            />
            <div className="text-sm text-muted-foreground">
              Entrez le mot-clé que vous souhaitez suivre et optimiser
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_url">URL cible (optionnel)</Label>
            <Input
              id="target_url"
              value={formData.target_url}
              onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
              placeholder="/produits/coque-iphone-15-pro"
            />
            <div className="text-sm text-muted-foreground">
              URL de la page que vous souhaitez positionner pour ce mot-clé
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competition">Niveau de concurrence</Label>
            <Select
              value={formData.competition}
              onValueChange={(value) => setFormData(prev => ({ ...prev, competition: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Faible - Facile à positionner
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Moyenne - Effort modéré requis
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Élevée - Stratégie avancée nécessaire
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Mots-clés associés</Label>
            <div className="flex gap-2">
              <Input
                value={relatedKeyword}
                onChange={(e) => setRelatedKeyword(e.target.value)}
                placeholder="Mot-clé associé"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRelatedKeyword())}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addRelatedKeyword}
                disabled={!relatedKeyword.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.related_keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.related_keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeRelatedKeyword(keyword)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tracking_active"
              checked={formData.tracking_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tracking_active: checked }))}
            />
            <Label htmlFor="tracking_active">Activer le suivi automatique</Label>
          </div>

          {/* Predicted Metrics (Mock) */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">Prédictions SEO (basées sur l'IA)</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">Volume estimé</div>
                  <div className="text-muted-foreground">2,400/mois</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="font-medium">Difficulté</div>
                  <Badge className={`text-xs ${getCompetitionColor(formData.competition)}`}>
                    {formData.competition === 'low' ? '25/100' : 
                     formData.competition === 'medium' ? '55/100' : '85/100'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium">CPC moyen</div>
                  <div className="text-muted-foreground">€1.25</div>
                </div>
              </div>
            </div>
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
              disabled={isAddingKeyword || !formData.keyword.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isAddingKeyword ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter le mot-clé
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}