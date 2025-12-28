import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  category: string
  variables: string[]
  thumbnail_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const DEFAULT_TEMPLATES = [
  {
    name: 'Bienvenue',
    subject: 'Bienvenue chez {{company_name}}!',
    category: 'welcome',
    html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Bienvenue {{first_name}}!</h1>
      <p>Nous sommes ravis de vous accueillir dans notre communauté.</p>
      <p>Découvrez nos derniers produits et offres exclusives.</p>
      <a href="{{shop_url}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Découvrir la boutique</a>
    </div>`,
    variables: ['first_name', 'company_name', 'shop_url']
  },
  {
    name: 'Panier abandonné',
    subject: 'Vous avez oublié quelque chose...',
    category: 'cart_abandonment',
    html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Votre panier vous attend!</h1>
      <p>Bonjour {{first_name}},</p>
      <p>Vous avez laissé des articles dans votre panier. Finalisez votre commande avant qu'il ne soit trop tard!</p>
      <a href="{{cart_url}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Voir mon panier</a>
    </div>`,
    variables: ['first_name', 'cart_url']
  },
  {
    name: 'Confirmation de commande',
    subject: 'Commande #{{order_number}} confirmée',
    category: 'order_confirmation',
    html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #22c55e;">Merci pour votre commande!</h1>
      <p>Bonjour {{first_name}},</p>
      <p>Votre commande #{{order_number}} a bien été confirmée.</p>
      <p><strong>Total: {{order_total}}</strong></p>
      <a href="{{order_url}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Suivre ma commande</a>
    </div>`,
    variables: ['first_name', 'order_number', 'order_total', 'order_url']
  },
  {
    name: 'Newsletter',
    subject: '{{newsletter_title}}',
    category: 'newsletter',
    html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">{{newsletter_title}}</h1>
      <p>{{newsletter_content}}</p>
      <a href="{{cta_url}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">{{cta_text}}</a>
    </div>`,
    variables: ['newsletter_title', 'newsletter_content', 'cta_url', 'cta_text']
  },
  {
    name: 'Réactivation client inactif',
    subject: 'Vous nous manquez {{first_name}}!',
    category: 'reactivation',
    html_content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Ça fait longtemps!</h1>
      <p>Bonjour {{first_name}},</p>
      <p>Vous nous manquez! Profitez de {{discount_percent}}% de réduction sur votre prochaine commande.</p>
      <a href="{{shop_url}}?discount={{discount_code}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Utiliser mon code: {{discount_code}}</a>
    </div>`,
    variables: ['first_name', 'discount_percent', 'discount_code', 'shop_url']
  }
]

export function useEmailTemplates() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as EmailTemplate[]
    },
    enabled: !!user?.id
  })

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      if (!user?.id) throw new Error('Not authenticated')
      if (!template.name || !template.subject || !template.html_content) {
        throw new Error('Name, subject and content required')
      }
      const { data, error } = await supabase
        .from('email_templates')
        .insert([{ 
          name: template.name,
          subject: template.subject,
          html_content: template.html_content,
          text_content: template.text_content,
          category: template.category || 'general',
          variables: template.variables || [],
          user_id: user.id 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast({ title: 'Template créé', description: 'Le template a été créé avec succès' })
    }
  })

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast({ title: 'Template mis à jour', description: 'Les modifications ont été enregistrées' })
    }
  })

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast({ title: 'Template supprimé', description: 'Le template a été supprimé' })
    }
  })

  const duplicateTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated')
      const template = templates.find(t => t.id === id)
      if (!template) throw new Error('Template not found')

      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          user_id: user.id,
          name: `${template.name} (copie)`,
          subject: template.subject,
          html_content: template.html_content,
          text_content: template.text_content,
          category: template.category,
          variables: template.variables
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast({ title: 'Template dupliqué', description: 'Une copie a été créée' })
    }
  })

  const initializeDefaultTemplates = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')
      
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existing && existing.length > 0) {
        return existing
      }

      const { data, error } = await supabase
        .from('email_templates')
        .insert(DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id })))
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      toast({ title: 'Templates initialisés', description: 'Les templates par défaut ont été créés' })
    }
  })

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    duplicateTemplate: duplicateTemplate.mutate,
    initializeDefaultTemplates: initializeDefaultTemplates.mutate,
    isCreating: createTemplate.isPending
  }
}
