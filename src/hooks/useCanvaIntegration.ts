import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface CanvaDesign {
  id: string
  title: string
  thumbnail?: string
  design_type: string
  created_at: string
  updated_at: string
  design_url?: string
  status?: string
  canva_design_id: string
}

export interface CanvaTemplate {
  id: string
  name: string
  category: 'marketing' | 'social' | 'email' | 'ads'
  thumbnail: string
  description: string
}

export const useCanvaIntegration = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)

  // Fetch Canva integration status from integrations table
  const { data: integration, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['canva-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'canva')
        .eq('connection_status', 'connected')
        .maybeSingle()

      if (error) {
        console.error('Error fetching Canva integration:', error)
        return null
      }
      return data
    }
  })

  // Fetch designs from blog_posts table as a placeholder for designs
  const { data: designs = [], isLoading: isLoading, refetch: refetchDesigns } = useQuery({
    queryKey: ['canva-designs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Use blog_posts as design storage since canva_designs doesn't exist
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'canva_design')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching Canva designs:', error)
        return []
      }

      return (data || []).map(d => ({
        id: d.id,
        title: d.title,
        thumbnail: d.image_url,
        design_type: 'custom',
        created_at: d.created_at || '',
        updated_at: d.updated_at || '',
        design_url: d.image_url,
        status: d.status,
        canva_design_id: d.id
      })) as CanvaDesign[]
    }
  })

  // Fetch templates from static config
  const { data: templates = [] } = useQuery({
    queryKey: ['canva-templates'],
    queryFn: async () => {
      const defaultTemplates: CanvaTemplate[] = [
        {
          id: 'black-friday-sale',
          name: 'Black Friday Sale',
          category: 'marketing',
          thumbnail: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=300&h=200&fit=crop',
          description: 'Template promotionnel pour Black Friday'
        },
        {
          id: 'social-media-post',
          name: 'Social Media Post',
          category: 'social',
          thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=200&fit=crop',
          description: 'Post optimisé pour réseaux sociaux'
        },
        {
          id: 'email-newsletter',
          name: 'Email Newsletter',
          category: 'email',
          thumbnail: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=300&h=200&fit=crop',
          description: 'Newsletter professionnelle'
        },
        {
          id: 'google-ads-banner',
          name: 'Google Ads Banner',
          category: 'ads',
          thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
          description: 'Bannière publicitaire Google'
        }
      ]
      return defaultTemplates
    }
  })

  const checkConnectionStatus = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('integrations')
        .select('id, connection_status')
        .eq('user_id', user.id)
        .eq('platform', 'canva')
        .eq('connection_status', 'connected')
        .maybeSingle()

      if (error) {
        console.error('Error checking Canva connection:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Connection check error:', error)
      return false
    }
  }

  const connectCanva = async () => {
    setIsConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: { action: 'initiate' }
      })

      if (error) throw error

      if (data?.authUrl) {
        const popup = window.open(
          data.authUrl,
          'canva-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'canva-oauth-callback') {
            window.removeEventListener('message', handleMessage)
            if (popup) popup.close()
            
            const { data: { user } } = await supabase.auth.getUser()
            if (user && event.data.tokens) {
              await supabase.from('integrations').upsert({
                user_id: user.id,
                platform: 'canva',
                platform_name: 'Canva',
                connection_status: 'connected',
                is_active: true,
                access_token_encrypted: event.data.tokens.access_token,
                refresh_token_encrypted: event.data.tokens.refresh_token,
              })
              
              queryClient.invalidateQueries({ queryKey: ['canva-integration'] })
            }

            setIsConnecting(false)
            toast({
              title: "Connexion réussie",
              description: "Canva connecté avec succès",
            })
          }
        }

        window.addEventListener('message', handleMessage)

        setTimeout(() => {
          window.removeEventListener('message', handleMessage)
          if (isConnecting) {
            setIsConnecting(false)
            toast({
              title: "Timeout",
              description: "La connexion a expiré. Veuillez réessayer.",
              variant: "destructive"
            })
          }
        }, 120000)
      } else {
        throw new Error('No auth URL received')
      }
    } catch (error) {
      console.error('Canva connection error:', error)
      setIsConnecting(false)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à Canva. Veuillez réessayer.",
        variant: "destructive"
      })
    }
  }

  const disconnectCanva = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('integrations')
        .update({ connection_status: 'disconnected', is_active: false })
        .eq('user_id', user.id)
        .eq('platform', 'canva')

      queryClient.invalidateQueries({ queryKey: ['canva-integration'] })
      queryClient.invalidateQueries({ queryKey: ['canva-designs'] })

      toast({
        title: "Déconnexion réussie",
        description: "Canva a été déconnecté",
      })
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter Canva",
        variant: "destructive"
      })
    }
  }

  const getDesigns = async (): Promise<CanvaDesign[]> => {
    await refetchDesigns()
    return designs
  }

  const getTemplates = async (): Promise<CanvaTemplate[]> => {
    return templates
  }

  const openCanvaEditor = (designId?: string, templateId?: string) => {
    const baseUrl = 'https://www.canva.com'
    let editorUrl = baseUrl

    if (designId) {
      editorUrl = `${baseUrl}/design/${designId}`
    } else if (templateId) {
      editorUrl = `${baseUrl}/design?template=${templateId}`
    } else {
      editorUrl = `${baseUrl}/create`
    }

    window.open(editorUrl, '_blank', 'width=1200,height=800')
  }

  const createDesignFromTemplate = async (templateId: string, customData?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('canva-create-design', {
        body: { 
          template_id: templateId,
          custom_data: customData
        }
      })

      if (error) throw error

      if (data?.design_id) {
        // Store as blog post with canva_design category
        await supabase.from('blog_posts').insert({
          user_id: user.id,
          title: customData?.title || `Design from ${templateId}`,
          content: JSON.stringify(data),
          category: 'canva_design',
          image_url: data.thumbnail_url,
          status: 'draft'
        })

        queryClient.invalidateQueries({ queryKey: ['canva-designs'] })

        toast({
          title: "Design créé",
          description: "Nouveau design créé dans Canva",
        })

        openCanvaEditor(data.design_id)
      }

      return data
    } catch (error) {
      console.error('Error creating design:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le design",
        variant: "destructive"
      })
      return null
    }
  }

  return {
    isConnecting,
    isLoading: isLoading || isLoadingIntegration,
    designs,
    templates,
    isConnected: !!integration,
    integration,
    connectCanva,
    disconnectCanva,
    checkConnectionStatus,
    getDesigns,
    getTemplates,
    openCanvaEditor,
    createDesignFromTemplate,
  }
}
