import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  author: string;
  is_staff: boolean;
  created_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
}

export const useSupport = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TK-001',
      subject: 'Problème synchronisation Shopify',
      description: 'Impossible de synchroniser mes produits avec Shopify',
      category: 'technical',
      priority: 'high',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      responses: []
    },
    {
      id: 'TK-002',
      subject: 'Question sur les limites d\'import',
      description: 'Combien de produits puis-je importer par jour ?',
      category: 'billing',
      priority: 'medium',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      responses: [
        {
          id: 'R-001',
          message: 'Merci pour votre question. Avec votre plan actuel...',
          author: 'Support Team',
          is_staff: true,
          created_at: new Date().toISOString()
        }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createTicket = async (ticketData: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'updated_at' | 'responses'>) => {
    setLoading(true);
    
    try {
      const newTicket: SupportTicket = {
        ...ticketData,
        id: `TK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        responses: []
      };

      setTickets(prev => [newTicket, ...prev]);
      
      toast({
        title: "Ticket créé",
        description: `Votre ticket ${newTicket.id} a été créé avec succès`,
      });

      return newTicket;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status, updated_at: new Date().toISOString() }
          : ticket
      )
    );

    toast({
      title: "Ticket mis à jour",
      description: `Statut changé vers: ${status}`,
    });
  };

  const addResponse = async (ticketId: string, message: string, isStaff = false) => {
    const response: TicketResponse = {
      id: `R-${Math.random().toString(36).substr(2, 9)}`,
      message,
      author: isStaff ? 'Support Team' : 'Vous',
      is_staff: isStaff,
      created_at: new Date().toISOString()
    };

    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { 
              ...ticket, 
              responses: [...ticket.responses, response],
              updated_at: new Date().toISOString()
            }
          : ticket
      )
    );

    toast({
      title: "Réponse ajoutée",
      description: "Votre message a été envoyé",
    });
  };

  const searchFAQ = (query: string) => {
    const faqItems: FAQItem[] = [
      {
        id: '1',
        question: 'Comment importer des produits depuis AliExpress ?',
        answer: 'Vous pouvez importer des produits depuis AliExpress en utilisant notre extension Chrome ou en copiant l\'URL du produit dans l\'outil d\'import.',
        category: 'Import',
        helpful_count: 45
      },
      {
        id: '2',
        question: 'Quelle est la différence entre les plans ?',
        answer: 'Le plan Starter permet 1000 produits, le plan Pro est illimité avec IA avancée, et le plan Enterprise inclut le support dédié.',
        category: 'Facturation',
        helpful_count: 32
      },
      {
        id: '3',
        question: 'Comment synchroniser avec Shopify ?',
        answer: 'Allez dans Intégrations > Shopify, connectez votre store et configurez la synchronisation automatique.',
        category: 'Intégrations',
        helpful_count: 28
      }
    ];

    if (!query.trim()) return faqItems;
    
    return faqItems.filter(item => 
      item.question.toLowerCase().includes(query.toLowerCase()) ||
      item.answer.toLowerCase().includes(query.toLowerCase())
    );
  };

  const requestCallback = async (phone: string, preferredTime: string) => {
    toast({
      title: "Rappel demandé",
      description: `Nous vous rappellerons au ${phone} ${preferredTime}`,
    });
  };

  const startLiveChat = () => {
    toast({
      title: "Chat en direct",
      description: "Connexion au service de chat...",
    });
  };

  return {
    tickets,
    loading,
    createTicket,
    updateTicketStatus,
    addResponse,
    searchFAQ,
    requestCallback,
    startLiveChat
  };
};