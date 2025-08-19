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
      
      // Store contact submission in database
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'contact_form_submitted',
          description: `Contact form submitted by ${formData.name}`,
          entity_type: 'contact',
          metadata: {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            subject: formData.subject,
            budget: formData.budget,
            timeline: formData.timeline,
            message_length: formData.message.length
          } as any
        })
        .select()
        .single()

      if (error) throw error

      // Also log as security event for tracking
      await supabase
        .from('security_events')
        .insert({
          event_type: 'contact_form_submission',
          severity: 'info',
          description: `Contact form submitted: ${formData.subject}`,
          metadata: {
            email: formData.email,
            company: formData.company,
            budget: formData.budget
          }
        })

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

  // Start live chat
  async startLiveChat() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create a chat session entry
      const { data, error } = await supabase
        .from('realtime_chat_sessions')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          session_name: 'Support Chat',
          status: 'active'
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
      
      // Log demo request
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          action: 'demo_requested',
          description: 'Demo scheduling requested',
          entity_type: 'demo',
          metadata: {
            requested_at: new Date().toISOString(),
            type: 'personalized_demo'
          } as any
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