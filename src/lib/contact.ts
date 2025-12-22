import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface ContactFormData {
  name: string
  email: string
  company?: string
  subject: string
  message: string
  budget?: string
  timeline?: string
}

export const contactActions = {
  // Submit contact form
  async submitContactForm(formData: ContactFormData) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Store contact submission in activity_logs
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || null,
          action: 'contact_form_submitted',
          description: `Contact form submitted by ${formData.name}`,
          entity_type: 'contact',
          details: {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            subject: formData.subject,
            budget: formData.budget,
            timeline: formData.timeline,
            message_length: formData.message.length
          }
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais",
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre message. Veuillez réessayer.",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Start live chat - uses notifications table as chat placeholder
  async startLiveChat() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Veuillez vous connecter pour utiliser le chat.",
          variant: "destructive"
        })
        return { success: false, error: 'Not authenticated' }
      }
      
      // Create a notification for the chat request
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Chat support demandé',
          message: 'Un agent va vous répondre dans quelques instants',
          type: 'chat_request',
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Chat démarré",
        description: "Un agent va vous répondre dans quelques instants",
      })

      return { success: true, sessionId: data.id }
    } catch (error) {
      console.error('Error starting chat:', error)
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le chat. Veuillez réessayer.",
        variant: "destructive"
      })
      return { success: false, error }
    }
  },

  // Schedule demo
  async scheduleDemo() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log demo request in activity_logs
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || null,
          action: 'demo_requested',
          description: 'Demo scheduling requested',
          entity_type: 'demo',
          details: {
            requested_at: new Date().toISOString(),
            type: 'personalized_demo'
          }
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Demande enregistrée",
        description: "Nous vous contacterons pour planifier votre démo personnalisée",
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error scheduling demo:', error)
      toast({
        title: "Erreur",
        description: "Impossible de planifier la démo. Veuillez réessayer.",
        variant: "destructive"
      })
      return { success: false, error }
    }
  }
}
