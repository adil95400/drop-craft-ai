import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, FileText, Tag, Image, Target, DollarSign, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'

interface BulkAIActionsProps {
  selectedProducts: string[]
  onComplete?: () => void
}

export function BulkAIActions({ selectedProducts, onComplete }: BulkAIActionsProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBulkAction = async (action: string, label: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Aucun produit sélectionné",
        description: "Veuillez sélectionner au moins un produit",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Appel à l'edge function pour l'action bulk
      const { data, error } = await supabase.functions.invoke('bulk-ai-optimizer', {
        body: {
          userId: user.id,
          productIds: selectedProducts,
          action,
          batchSize: 10
        }
      })

      if (error) throw error

      toast({
        title: `${label} terminé !`,
        description: `${data?.processed || selectedProducts.length} produits traités avec succès`
      })

      onComplete?.()
    } catch (error) {
      console.error('Bulk action error:', error)
      toast({
        title: "Erreur",
        description: `Impossible d'effectuer l'action: ${label}`,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedProducts.length === 0) return null

  return (
    <Card className="border-primary">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Actions IA en Masse</h3>
            <span className="text-sm text-muted-foreground">
              ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''} sélectionné{selectedProducts.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('rewrite_titles', 'Réécriture des titres')}
            disabled={isProcessing}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs text-center">Réécrire les titres</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('rewrite_descriptions', 'Réécriture des descriptions')}
            disabled={isProcessing}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs text-center">Réécrire les descriptions</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('complete_attributes', 'Complétion des attributs')}
            disabled={isProcessing}
          >
            <Tag className="h-5 w-5" />
            <span className="text-xs text-center">Compléter attributs</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('generate_seo', 'Génération SEO')}
            disabled={isProcessing}
          >
            <Target className="h-5 w-5" />
            <span className="text-xs text-center">Générer metas SEO</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('fix_spelling', 'Correction orthographique')}
            disabled={isProcessing}
          >
            <Zap className="h-5 w-5" />
            <span className="text-xs text-center">Corriger orthographe</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('optimize_images', 'Optimisation des images')}
            disabled={isProcessing}
          >
            <Image className="h-5 w-5" />
            <span className="text-xs text-center">Optimiser images</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('optimize_pricing', 'Optimisation des prix')}
            disabled={isProcessing}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs text-center">Optimiser prix</span>
          </Button>

          <Button
            variant="default"
            className="h-auto flex-col gap-2 py-4"
            onClick={() => handleBulkAction('full_optimization', 'Optimisation complète')}
            disabled={isProcessing}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-xs text-center">Optimisation complète</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
