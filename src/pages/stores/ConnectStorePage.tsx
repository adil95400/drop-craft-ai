import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useStoreConnection } from '@/hooks/useStoreConnection'
import { PlatformGridSelector } from './components/PlatformGridSelector'
import { BackButton } from '@/components/navigation/BackButton'
import { StoreConnectionDialog } from '@/components/stores/connection/StoreConnectionDialog'

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

      navigate('/dashboard/stores')
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
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BackButton />
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Store className="h-8 w-8" />
              Connecter une boutique
            </h1>
          </div>
          <p className="text-muted-foreground">
            Sélectionnez une plateforme pour connecter votre boutique
          </p>
        </div>
      </div>

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
    </div>
  )
}

export default ConnectStorePage
