import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ProductOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
}

export function ProductOptimizeDialog({ open, onOpenChange, product }: ProductOptimizeDialogProps) {
  const { toast } = useToast()
  const [isOptimizing, setIsOptimizing] = useState(false)

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-optimizer', {
        body: {
          productId: product.id,
          productSource: 'products',
          optimizationType: 'seo_meta',
          currentData: {
            name: product.name || product.title,
            description: product.description,
            category: product.category,
            price: product.price
          }
        }
      })

      if (error) {
        // Handle specific error codes
        const errorMessage = error.message || ''
        if (errorMessage.includes('429') || errorMessage.includes('Limite')) {
          toast({
            title: "Limite atteinte",
            description: "Trop de requêtes. Réessayez dans quelques instants.",
            variant: "destructive"
          })
        } else if (errorMessage.includes('401') || errorMessage.includes('session')) {
          toast({
            title: "Session expirée",
            description: "Veuillez vous reconnecter.",
            variant: "destructive"
          })
        } else {
          toast({
            title: "Erreur d'optimisation",
            description: "L'optimisation IA a échoué. Réessayez.",
            variant: "destructive"
          })
        }
        return
      }

      toast({
        title: "Produit optimisé !",
        description: "Les métadonnées SEO ont été générées par l'IA"
      })
      
      onOpenChange(false)
    } catch (error: any) {
      console.error('Optimization error:', error)
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Optimiser avec l'IA
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-semibold mb-2">{product.name}</h4>
            <p className="text-sm text-muted-foreground">
              L'IA va améliorer:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>✨ Titre SEO optimisé</li>
              <li>✨ Meta description engageante</li>
              <li>✨ Mots-clés pertinents</li>
              <li>✨ Description produit améliorée</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimisation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimiser
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
