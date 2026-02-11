import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useStoreConnection } from '@/hooks/useStoreConnection'
import { PlatformGridSelector } from './components/PlatformGridSelector'
import { StoreConnectionDialog } from '@/components/stores/connection/StoreConnectionDialog'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

const ConnectStorePage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { connectStore } = useStoreConnection()
  
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform)
    setDialogOpen(true)
  }

  const handleConnect = async (data: any) => {
    try {
      // Normaliser les credentials pour correspondre au format attendu (snake_case)
      const credentials = {
        ...data,
        platform: undefined,
        name: undefined,
        domain: undefined,
      }

      // Convertir accessToken en access_token si nécessaire (pour compatibilité)
      if (credentials.accessToken && !credentials.access_token) {
        credentials.access_token = credentials.accessToken
      }

      await connectStore({
        platform: data.platform,
        name: data.name,
        domain: data.domain,
        credentials,
      })

      toast({
        title: "Connexion réussie",
        description: `Votre boutique ${data.name} a été connectée avec succès`,
      })

      navigate('/stores-channels')
    } catch (error) {
      console.error('Connection error:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter la boutique",
        variant: "destructive"
      })
      throw error
    }
  }

  return (
    <ChannablePageWrapper
      title="Connecter une boutique"
      description="Sélectionnez une plateforme pour connecter votre boutique"
      heroImage="integrations"
      badge={{ label: 'Connexion', icon: Store }}
    >

      <Card>
        <CardHeader>
          <CardTitle>Plateformes disponibles</CardTitle>
          <CardDescription>
            Choisissez la plateforme de votre boutique e-commerce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformGridSelector 
            onSelect={handlePlatformSelect}
          />
        </CardContent>
      </Card>

      {selectedPlatform && (
        <StoreConnectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          platform={selectedPlatform}
          onConnect={handleConnect}
        />
      )}
    </ChannablePageWrapper>
  )
}

export default ConnectStorePage
