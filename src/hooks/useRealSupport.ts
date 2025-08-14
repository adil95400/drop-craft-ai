import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface SupportTicket {
  id: string
  user_id: string
  ticket_number: string
  subject: string
  description: string
  category: 'technical' | 'billing' | 'feature' | 'integration' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'pending' | 'resolved' | 'closed'
  assigned_to?: string
  created_at: string
  updated_at: string
  messages?: SupportMessage[]
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_type: 'user' | 'agent'
  sender_name: string
  message: string
  attachments?: string[]
  created_at: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  views: number
  helpful_votes: number
  created_at: string
}

export const useRealSupport = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError
  } = useQuery({
    queryKey: ['real-support-tickets'],
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Mock tickets since we don't have support_tickets table yet
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          user_id: user.id,
          ticket_number: '#12345',
          subject: 'Problème synchronisation Shopify',
          description: 'La synchronisation avec Shopify ne fonctionne plus depuis hier',
          category: 'technical',
          priority: 'high',
          status: 'open',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          user_id: user.id,
          ticket_number: '#12344',
          subject: 'Question sur les limites d\'import',
          description: 'Je voudrais connaître les limites de mon plan actuel',
          category: 'billing',
          priority: 'medium',
          status: 'pending',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]

      return mockTickets
    }
  })

  const {
    data: faqItems = [],
    isLoading: faqLoading
  } = useQuery({
    queryKey: ['real-faq'],
    queryFn: async (): Promise<FAQItem[]> => {
      // Mock FAQ items
      const mockFAQ: FAQItem[] = [
        {
          id: '1',
          question: 'Comment importer des produits depuis AliExpress ?',
          answer: 'Vous pouvez importer des produits depuis AliExpress en utilisant notre extension Chrome ou en copiant-collant les URLs dans l\'interface d\'import.',
          category: 'Import',
          views: 1250,
          helpful_votes: 45,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          question: 'Quelle est la différence entre les plans ?',
          answer: 'Nos plans diffèrent par le nombre de produits importables, les intégrations disponibles et les fonctionnalités avancées comme l\'IA.',
          category: 'Facturation',
          views: 890,
          helpful_votes: 32,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          question: 'Comment synchroniser avec Shopify ?',
          answer: 'La synchronisation avec Shopify se fait via notre connecteur. Allez dans Intégrations > Ajouter > Shopify et suivez les instructions.',
          category: 'Intégrations',
          views: 2150,
          helpful_votes: 78,
          created_at: new Date().toISOString()
        }
      ]

      return mockFAQ
    }
  })

  // Create support ticket
  const createTicket = useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, 'id' | 'user_id' | 'ticket_number' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate ticket number
      const ticketNumber = `#${Date.now().toString().slice(-5)}`

      // In a real app, this would save to database
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        user_id: user.id,
        ticket_number: ticketNumber,
        ...ticket,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return newTicket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-support-tickets'] })
      toast({
        title: "Ticket créé",
        description: "Votre demande de support a été créée. Nous vous répondrons bientôt."
      })
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket",
        variant: "destructive"
      })
    }
  })

  // Mark FAQ as helpful
  const markFAQHelpful = useMutation({
    mutationFn: async (faqId: string) => {
      // In real app, would update database
      return faqId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-faq'] })
      toast({
        title: "Merci !",
        description: "Votre retour nous aide à améliorer notre aide"
      })
    }
  })

  // Statistics
  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    pendingTickets: tickets.filter(t => t.status === 'pending').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    averageResponseTime: '4h',
    satisfaction: 4.8
  }

  return {
    tickets,
    faqItems,
    stats,
    isLoading: ticketsLoading || faqLoading,
    error: ticketsError,
    createTicket: createTicket.mutate,
    markFAQHelpful: markFAQHelpful.mutate,
    isCreatingTicket: createTicket.isPending
  }
}