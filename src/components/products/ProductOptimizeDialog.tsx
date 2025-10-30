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
          name: product.name,
          description: product.description,
          category: product.category
        }
      })

      if (error) throw error

      toast({
        title: "Produit optimisé !",
        description: "Les métadonnées SEO et la description ont été améliorées par l'IA"
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Optimization error:', error)
      toast({
        title: "Erreur d'optimisation",
        description: "L'optimisation IA a échoué",
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
