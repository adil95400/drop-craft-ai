import { useState } from 'react'
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

  // Fonction simple pour vérifier la connexion
  const checkConnectionStatus = async (): Promise<boolean> => {
    try {
      // Simulation simple pour la démo
      const hasCanvaToken = localStorage.getItem('canva_connected') === 'true'
      return hasCanvaToken
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

      // Simuler la connexion pour la démo
      localStorage.setItem('canva_connected', 'true')

      // Ouvrir popup OAuth Canva (simulation)
      const popup = window.open(
        'https://www.canva.com/oauth/authorize',
        'canva-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Simuler une connexion réussie après 3 secondes
      setTimeout(() => {
        if (popup) popup.close()
        setIsConnecting(false)
        toast({
          title: "Connexion réussie",
          description: "Canva connecté avec succès",
        })
      }, 3000)

    } catch (error) {
      console.error('Canva connection error:', error)
      // Fallback simulation
      localStorage.setItem('canva_connected', 'true')
      toast({
        title: "Connexion simulée",
        description: "Canva connecté (mode démo)",
      })
    } finally {
      setTimeout(() => setIsConnecting(false), 3000)
    }
  }

  const getDesigns = async (): Promise<CanvaDesign[]> => {
    setIsLoading(true)
    try {
      // Simulation de données pour la démo
      const mockDesigns: CanvaDesign[] = [
        {
          id: '1',
          title: 'Black Friday Promo',
          design_type: 'social_post',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          thumbnail: '/api/placeholder/400/300',
          status: 'active'
        },
        {
          id: '2',
          title: 'Newsletter Template',
          design_type: 'email',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          thumbnail: '/api/placeholder/400/300',
          status: 'active'
        }
      ]

      setDesigns(mockDesigns)
      return mockDesigns
    } catch (error) {
      console.error('Error fetching designs:', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const getTemplates = async (): Promise<CanvaTemplate[]> => {
    setTemplates(mockTemplates)
    return mockTemplates
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
      return null
    }
  }

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