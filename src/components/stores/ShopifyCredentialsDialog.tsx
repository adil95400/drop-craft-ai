import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface ShopifyCredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  onSuccess?: () => void
}

interface ShopifyLocation {
  id: string
  name: string
  address: string
  active: boolean
}

interface ShopInfo {
  name: string
  domain: string
  currency: string
  timezone?: string
}

export function ShopifyCredentialsDialog({ 
  open, 
  onOpenChange, 
  integrationId,
  onSuccess 
}: ShopifyCredentialsDialogProps) {
  const [currentStep, setCurrentStep] = useState<'credentials' | 'locations'>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionTested, setConnectionTested] = useState(false)
  
  const [credentials, setCredentials] = useState({
    shop_domain: '',
    access_token: ''
  })
  
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [locations, setLocations] = useState<ShopifyLocation[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  const { toast } = useToast()

  const cleanDomain = (domain: string) => {
    let cleaned = domain.replace(/^https?:\/\//, '')
    if (cleaned.includes('.myshopify.com')) {
      cleaned = cleaned.replace('.myshopify.com', '')
    }
    return cleaned
  }

  const testConnection = async () => {
    if (!credentials.shop_domain || !credentials.access_token) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    setIsTestingConnection(true)
    
    try {
      // Get user session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Session expirée, veuillez vous reconnecter")
      }

      const cleanedDomain = cleanDomain(credentials.shop_domain)
      
      // Test basic connection with auth header
      const { data: connectionResult, error: connectionError } = await supabase.functions.invoke('store-connection-test', {
        body: {
          platform: 'shopify',
          credentials: {
            shop_domain: cleanedDomain + '.myshopify.com',
            access_token: credentials.access_token
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (connectionError || !connectionResult?.success) {
        throw new Error(connectionResult?.error || 'Test de connexion échoué')
      }

      // Get locations with auth header
      const { data: locationsResult, error: locationsError } = await supabase.functions.invoke('shopify-locations', {
        body: {
          shop_domain: cleanedDomain + '.myshopify.com',
          access_token: credentials.access_token
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (locationsError || !locationsResult?.success) {
        throw new Error(locationsResult?.error || 'Failed to fetch locations')
      }

      setShopInfo(locationsResult.shop_info)
      setLocations(locationsResult.locations)
      setSelectedLocations(locationsResult.locations.filter((loc: ShopifyLocation) => loc.active).map((loc: ShopifyLocation) => loc.id))
      setConnectionTested(true)
      setCurrentStep('locations')

      toast({
        title: "Connexion réussie",
        description: `Connecté à ${connectionResult.shop_info?.name || cleanedDomain}`
      })

    } catch (error: any) {
      console.error('Connection test error:', error)
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter à Shopify",
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const saveConfiguration = async () => {
    setIsLoading(true)
    
    try {
      const cleanedDomain = cleanDomain(credentials.shop_domain)
      
      // Save complete configuration to integrations table
      const { error } = await supabase
        .from('integrations')
        .update({
          encrypted_credentials: {
            shop_domain: cleanedDomain + '.myshopify.com',
            access_token: credentials.access_token,
            location_ids: selectedLocations
          },
          shop_domain: cleanedDomain + '.myshopify.com',
          platform_url: `https://${cleanedDomain}.myshopify.com`,
          connection_status: 'connected',
          store_config: {
            name: shopInfo?.name || cleanedDomain,
            currency: shopInfo?.currency,
            timezone: shopInfo?.timezone
          }
        })
        .eq('id', integrationId)

      if (error) throw error

      toast({
        title: "Configuration terminée",
        description: `Shopify configuré avec ${selectedLocations.length} location(s) sélectionnée(s)`
      })

      onOpenChange(false)
      onSuccess?.()
      
      // Reset state
      setCurrentStep('credentials')
      setConnectionTested(false)
      setShopInfo(null)
      setLocations([])
      setSelectedLocations([])
      
    } catch (error: any) {
      console.error('Save configuration error:', error)
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder la configuration",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 'credentials' ? 'Configurer Shopify - Étape 1/2' : 'Configurer Shopify - Étape 2/2'}
          </DialogTitle>
        </DialogHeader>
        
        {currentStep === 'credentials' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop_domain">Nom de la boutique</Label>
              <div className="flex items-center">
                <Input
                  id="shop_domain"
                  placeholder="ma-boutique"
                  value={credentials.shop_domain}
                  onChange={(e) => setCredentials(prev => ({ 
                    ...prev, 
                    shop_domain: e.target.value 
                  }))}
                  className="flex-1"
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  .myshopify.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Entrez uniquement le nom de votre boutique (ex: ma-boutique)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input
                id="access_token"
                type="password"
                placeholder="shpat_..."
                value={credentials.access_token}
                onChange={(e) => setCredentials(prev => ({ 
                  ...prev, 
                  access_token: e.target.value 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Token d'accès de votre application Shopify privée
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="text-sm font-medium">Comment obtenir vos credentials ?</h4>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Allez dans votre admin Shopify → Apps</li>
                <li>2. Créez une app privée ou utilisez une existante</li>
                <li>3. Activez Admin API et définissez les permissions</li>
                <li>4. Copiez l'Admin API access token</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isTestingConnection}
              >
                Annuler
              </Button>
              <Button 
                onClick={testConnection} 
                disabled={isTestingConnection || !credentials.shop_domain || !credentials.access_token}
              >
                {isTestingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Tester la connexion
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'locations' && (
          <div className="space-y-4">
            {shopInfo && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Connexion réussie</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecté à <strong>{shopInfo.name}</strong> ({shopInfo.domain})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Devise: {shopInfo.currency}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Sélectionner les emplacements à synchroniser</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choisissez quels emplacements Shopify vous souhaitez synchroniser
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {locations.map((location) => (
                  <div 
                    key={location.id} 
                    className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={location.id}
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={() => toggleLocation(location.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <label 
                          htmlFor={location.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {location.name}
                        </label>
                        {location.active && <Badge variant="secondary" className="text-xs">Actif</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {location.address}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedLocations.length === 0 && (
                <div className="flex items-center gap-2 p-2 text-amber-600 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">
                    Veuillez sélectionner au moins un emplacement pour continuer
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('credentials')}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button 
                onClick={saveConfiguration} 
                disabled={isLoading || selectedLocations.length === 0}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Finaliser la configuration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}