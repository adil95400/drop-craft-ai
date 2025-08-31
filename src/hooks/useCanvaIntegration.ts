import { useState, useCallback } from 'react'
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
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [designs, setDesigns] = useState<CanvaDesign[]>([])
  const [templates, setTemplates] = useState<CanvaTemplate[]>([])

  // Mock templates pour la démo
  const mockTemplates: CanvaTemplate[] = [
    {
      id: 'template-1',
      name: 'Black Friday Sale',
      category: 'marketing',
      thumbnail: '/api/placeholder/300/200',
      description: 'Template promotionnel pour Black Friday'
    },
    {
      id: 'template-2', 
      name: 'Social Media Post',
      category: 'social',
      thumbnail: '/api/placeholder/300/200',
      description: 'Post optimisé pour réseaux sociaux'
    },
    {
      id: 'template-3',
      name: 'Email Newsletter',
      category: 'email',
      thumbnail: '/api/placeholder/300/200',
      description: 'Newsletter professionnelle'
    },
    {
      id: 'template-4',
      name: 'Google Ads Banner',
      category: 'ads',
      thumbnail: '/api/placeholder/300/200',
      description: 'Bannière publicitaire Google'
    }
  ]

  const connectCanva = useCallback(async () => {
    setIsConnecting(true)
    try {
      const { data, error } = await supabase.functions.invoke('canva-oauth', {
        body: { action: 'initiate' }
      })

      if (error) throw error

      // Ouvrir popup OAuth Canva
      const popup = window.open(
        data.authorization_url,
        'canva-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Écouter le retour OAuth
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setIsConnecting(false)
          checkConnectionStatus()
        }
      }, 1000)

    } catch (error) {
      console.error('Canva connection error:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à Canva",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }, [toast])

  const checkConnectionStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('canva_integrations')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('Connection check error:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Connection check error:', error)
      return false
    }
  }, [])

  const getDesigns = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('canva_designs')
        .select('*')
        .eq('status', 'active')
        .order('last_modified_at', { ascending: false })

      const mappedDesigns: CanvaDesign[] = (data || []).map(design => ({
        id: design.id,
        title: design.title || 'Sans titre',
        thumbnail: design.thumbnail_url || undefined,
        design_type: design.design_type,
        created_at: design.created_at,
        updated_at: design.last_modified_at,
        design_url: design.design_url,
        status: design.status
      }))

      setDesigns(mappedDesigns)
      return mappedDesigns
    } catch (error) {
      console.error('Error fetching designs:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getTemplates = useCallback(async () => {
    // Pour la démo, on utilise des templates mockés
    setTemplates(mockTemplates)
    return mockTemplates
  }, [])

  const openCanvaEditor = useCallback((designId?: string, templateId?: string) => {
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
  }, [])

  const createDesignFromTemplate = useCallback(async (templateId: string, customData?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('canva-create-design', {
        body: { 
          template_id: templateId,
          custom_data: customData
        }
      })

      if (error) throw error

      toast({
        title: "Design créé",
        description: "Nouveau design créé dans Canva",
      })

      // Ouvrir le design dans Canva
      if (data?.design_id) {
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
    }
  }, [toast, openCanvaEditor])

  return {
    // States
    isConnecting,
    isLoading,
    designs,
    templates,

    // Actions  
    connectCanva,
    checkConnectionStatus,
    getDesigns,
    getTemplates,
    openCanvaEditor,
    createDesignFromTemplate,
  }
}