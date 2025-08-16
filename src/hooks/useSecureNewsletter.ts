import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export const useSecureNewsletter = () => {
  const { toast } = useToast()

  const subscribeToNewsletter = useMutation({
    mutationFn: async (email: string) => {
      // Use the secure function instead of direct table access
      const { data, error } = await supabase.rpc('public_newsletter_signup', {
        email_param: email
      })
      
      if (error) throw error
      
      const result = data as { success: boolean; error?: string; message?: string }
      
      if (!result.success) {
        throw new Error(result.error || 'Échec de l\'inscription')
      }
      
      return result
    },
    onSuccess: (result) => {
      toast({
        title: "Inscription réussie !",
        description: result.message || "Vous avez été inscrit à notre newsletter avec succès.",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return {
    subscribeToNewsletter: subscribeToNewsletter.mutate,
    isSubscribing: subscribeToNewsletter.isPending,
    error: subscribeToNewsletter.error
  }
}