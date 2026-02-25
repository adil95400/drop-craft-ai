import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CredentialInput } from '@/components/common/CredentialInput'
import { Settings, TestTube2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Store } from '@/hooks/useStores'

interface StoreSettingsDialogProps {
  store: Store
  onUpdate: () => void
}

export function StoreSettingsDialog({ store, onUpdate }: StoreSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: store.name,
    domain: store.domain,
    accessToken: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    if (!formData.accessToken) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un token d'accès pour tester",
        variant: "destructive"
      })
      return
    }

    setTesting(true)
    setTestResult(null)
    
    try {
      const credentials = {
        shop_domain: formData.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        access_token: formData.accessToken
      }

      const { data, error } = await supabase.functions.invoke('store-connection-test', {
        body: { 
          platform: store.platform,
          credentials
        }
      })

      if (error) throw error

      if (data.success) {
        setTestResult({ success: true, message: data.message || 'Connexion réussie' })
        toast({
          title: "Test réussi",
          description: "La connexion à votre boutique fonctionne correctement"
        })
      } else {
        throw new Error(data.error || 'Test de connexion échoué')
      }
    } catch (error: any) {
      console.error('Connection test error:', error)
      setTestResult({ 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      })
      toast({
        title: "Test échoué",
        description: error.message || 'Impossible de se connecter à votre boutique',
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const updateCredentials = async () => {
    try {
      // Update the integration record in the database
      const { error } = await supabase
        .from('integrations')
        .update({
          name: formData.name,
          config: { domain: formData.domain },
          is_active: true,
          status: 'connected',
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id)

      if (error) throw error

      onUpdate()

      toast({
        title: "Succès",
        description: "Les paramètres de la boutique ont été mis à jour"
      })
      
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les paramètres",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paramètres de {store.name}</DialogTitle>
          <DialogDescription>
            Configurez et testez la connexion à votre boutique {store.platform}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Statut de la connexion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={store.status === 'connected' ? 'default' : 'secondary'}>
                  {store.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                </Badge>
                {store.last_sync && (
                  <span className="text-sm text-muted-foreground">
                    Dernière sync: {new Date(store.last_sync).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuration</CardTitle>
              <CardDescription>
                Mettez à jour les informations de connexion à votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la boutique</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domaine</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                  />
                </div>
              </div>

              {store.platform === 'shopify' && (
                <CredentialInput
                  id="accessToken"
                  label="Access Token"
                  value={formData.accessToken}
                  onChange={(value) => handleInputChange('accessToken', value)}
                  placeholder="Saisissez votre token d'accès Shopify"
                  required
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test de connexion</CardTitle>
              <CardDescription>
                Vérifiez que vos credentials permettent de se connecter à votre boutique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult && (
                <div className={`flex items-center space-x-2 p-3 rounded-md ${
                  testResult.success 
                    ? 'bg-success/10 text-success-foreground' 
                    : 'bg-destructive/10 text-destructive-foreground'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={testConnection} 
                  disabled={testing || !formData.accessToken}
                  variant="outline"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <TestTube2 className="h-4 w-4 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={updateCredentials}
                  disabled={!formData.accessToken || !testResult?.success}
                >
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}