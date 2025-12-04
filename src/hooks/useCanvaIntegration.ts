import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

  // Fetch Canva integration status from database
  const { data: integration, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['canva-integration'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('canva_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        console.error('Error fetching Canva integration:', error)
        return null
      }
      return data
    }
  })

  // Fetch designs from Supabase
  const { data: designs = [], isLoading: isLoading, refetch: refetchDesigns } = useQuery({
    queryKey: ['canva-designs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('canva_designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching Canva designs:', error)
        return []
      }

      return data.map(d => ({
        id: d.id,
        title: d.title,
        thumbnail: d.thumbnail_url,
        design_type: d.design_type || 'unknown',
        created_at: d.created_at,
        updated_at: d.updated_at,
        design_url: d.design_url,
        status: d.status,
        canva_design_id: d.canva_design_id
      })) as CanvaDesign[]
    }
  })

  // Fetch templates from database or static config
  const { data: templates = [] } = useQuery({
    queryKey: ['canva-templates'],
    queryFn: async () => {
      // Templates are typically static or from Canva API
      // For now, use predefined templates that match Canva's offerings
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

  // Check connection status from database
  const checkConnectionStatus = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data, error } = await supabase
        .from('canva_integrations')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
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

  // Connect to Canva with real OAuth flow
  const connectCanva = async () => {
    setIsConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: { action: 'initiate' }
      })

      if (error) throw error

      if (data?.authUrl) {
        // Open real OAuth popup
        const popup = window.open(
          data.authUrl,
          'canva-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        // Listen for OAuth callback
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'canva-oauth-callback') {
            window.removeEventListener('message', handleMessage)
            if (popup) popup.close()
            
            // Store integration in database
            const { data: { user } } = await supabase.auth.getUser()
            if (user && event.data.tokens) {
              await supabase.from('canva_integrations').upsert({
                user_id: user.id,
                canva_user_id: event.data.userId || 'unknown',
                access_token: event.data.tokens.access_token,
                refresh_token: event.data.tokens.refresh_token,
                token_expires_at: event.data.tokens.expires_at,
                status: 'active'
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

        // Timeout after 2 minutes
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

  // Disconnect from Canva
  const disconnectCanva = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('canva_integrations')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id)

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

  // Get designs from database
  const getDesigns = async (): Promise<CanvaDesign[]> => {
    await refetchDesigns()
    return designs
  }

  // Get templates
  const getTemplates = async (): Promise<CanvaTemplate[]> => {
    return templates
  }

  // Open Canva editor
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

  // Create design from template with real API call
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

      // Store the new design in database
      if (data?.design_id) {
        const integrationData = await supabase
          .from('canva_integrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (integrationData.data) {
          await supabase.from('canva_designs').insert({
            user_id: user.id,
            canva_design_id: data.design_id,
            canva_integration_id: integrationData.data.id,
            title: customData?.title || `Design from ${templateId}`,
            design_type: data.design_type || 'custom',
            design_url: data.design_url,
            thumbnail_url: data.thumbnail_url,
            status: 'active'
          })

          queryClient.invalidateQueries({ queryKey: ['canva-designs'] })
        }

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
    // States
    isConnecting,
    isLoading: isLoading || isLoadingIntegration,
    designs,
    templates,
    isConnected: !!integration,
    integration,

    // Actions  
    connectCanva,
    disconnectCanva,
    checkConnectionStatus,
    getDesigns,
    getTemplates,
    openCanvaEditor,
    createDesignFromTemplate,
  }
}
