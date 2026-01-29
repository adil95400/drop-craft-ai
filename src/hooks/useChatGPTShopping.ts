import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export function useChatGPTShopping(user_id: string) {
  const queryClient = useQueryClient()

  const generateFeed = useMutation({
    mutationFn: async (products: any[]) => {
      const { data, error } = await supabase.functions.invoke('chatgpt-shopping-feed', {
        body: { user_id, products }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-feeds'] })
      toast({
        title: 'Flux ChatGPT généré',
        description: `Flux créé avec ${data.product_count} produits`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de génération',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    generateFeed: generateFeed.mutate,
    isGenerating: generateFeed.isPending
  }
}
