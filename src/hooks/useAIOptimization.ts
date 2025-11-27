import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useAIOptimization() {
  const queryClient = useQueryClient()

  const optimizeWithAI = useMutation({
    mutationFn: async ({ 
      productId, 
      userId, 
      mode = 'full' 
    }: { 
      productId: string
      userId: string
      mode?: 'full' | 'title' | 'description'
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-optimize-product', {
        body: { productId, userId, mode }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const modeLabel = {
        full: 'Optimisation complète',
        title: 'Titre',
        description: 'Description'
      }[data.mode]
      
      toast.success(`${modeLabel} optimisé avec IA`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['user-products'] })
    },
    onError: (error) => {
      console.error('Error optimizing with AI:', error)
      toast.error('Erreur lors de l\'optimisation IA')
    }
  })

  return {
    optimizeWithAI,
    isOptimizing: optimizeWithAI.isPending
  }
}
