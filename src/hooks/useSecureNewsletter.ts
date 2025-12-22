import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export const useSecureNewsletter = () => {
  const { toast } = useToast()

  const subscribeToNewsletter = useMutation({
    mutationFn: async (email: string) => {
      // Log newsletter signup to activity_logs since newsletter_subscribers table doesn't exist
      const { error } = await supabase.from('activity_logs').insert({
        action: 'newsletter_signup',
        description: `Newsletter signup: ${email}`,
        details: { email, subscribed_at: new Date().toISOString() },
        severity: 'info',
        source: 'newsletter'
      })
      
      if (error) throw error
      return { success: true, message: 'Inscription réussie' }
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
