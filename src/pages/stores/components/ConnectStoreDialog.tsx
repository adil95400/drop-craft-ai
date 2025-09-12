import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Store as StoreIcon, Zap, Shield, ArrowLeft } from 'lucide-react'
import { useStores, type Store } from '@/hooks/useStores'
import { useToast } from '@/hooks/use-toast'
import { PlatformConnectionForm } from '@/components/stores/connection/PlatformConnectionForm'
import { FieldMappingDialog } from '@/components/stores/connection/FieldMappingDialog'

interface ConnectStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const platforms = [
  {
    id: 'shopify' as const,
    name: 'Shopify',
    description: 'Synchronisation temps réel via Admin API',
    icon: '🛍️',
    features: ['OAuth', 'Webhooks', 'GraphQL', 'Temps réel'],
    difficulty: 'Facile',
    color: 'bg-green-500',
    popularity: 95
  },
  {
    id: 'woocommerce' as const,
    name: 'WooCommerce',
    description: 'Synchronisation WordPress e-commerce',
    icon: '🔌',
    features: ['API REST', 'Webhooks', 'Extensions'],
    difficulty: 'Moyen',
    color: 'bg-purple-500',
    popularity: 85
  },
  {
    id: 'prestashop' as const,
    name: 'PrestaShop',
    description: 'Synchronisation via Webservice API',
    icon: '🛒',
    features: ['Webservice', 'Multi-boutique', 'Modules'],
    difficulty: 'Moyen',
    color: 'bg-blue-500',
    popularity: 75
  },
  {
    id: 'magento' as const,
    name: 'Magento',
    description: 'Plateforme enterprise avec MSI',
    icon: '⚡',
    features: ['API REST', 'GraphQL', 'MSI', 'Enterprise'],
    difficulty: 'Avancé',
    color: 'bg-orange-500',
    popularity: 70
  },
  {
    id: 'bigcommerce' as const,
    name: 'BigCommerce',
    description: 'API REST complète et webhooks',
    icon: '🏪',
    features: ['API REST v3', 'Webhooks', 'Multi-store'],
    difficulty: 'Moyen',
    color: 'bg-red-500',
    popularity: 60
  },
  {
    id: 'squarespace' as const,
    name: 'Squarespace',
    description: 'Commerce API et inventaire',
    icon: '◼️',
    features: ['Commerce API', 'Inventaire', 'Design'],
    difficulty: 'Facile',
    color: 'bg-gray-700',
    popularity: 55
  }
]

export function ConnectStoreDialog({ open, onOpenChange }: ConnectStoreDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platforms[0]['id'] | null>(null)
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectStore } = useStores()
  const { toast } = useToast()

  const handleConnect = async (connectionData: any) => {
    setIsConnecting(true)
    try {
      await connectStore({
        name: connectionData.name,
        platform: connectionData.platform,
        domain: connectionData.domain,
        status: 'connected',
        last_sync: null,
        products_count: 0,
        orders_count: 0,
        revenue: 0,
        currency: connectionData.credentials?.currency || 'EUR',
        created_at: new Date().toISOString(),
        settings: {
          auto_sync: connectionData.credentials?.enableWebhooks || true,
          sync_frequency: connectionData.credentials?.syncFrequency || 'hourly',
          sync_products: connectionData.credentials?.importProducts !== false,
          sync_orders: connectionData.credentials?.importOrders !== false,
          sync_customers: connectionData.credentials?.importCustomers !== false
        },
        credentials: connectionData.credentials
      })
      
      toast({
        title: "Boutique connectée",
        description: `${connectionData.name} a été connectée avec succès`,
      })
      
      setSelectedPlatform(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to connect store:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter la boutique. Vérifiez vos paramètres.",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const resetForm = () => {
    setSelectedPlatform(null)
    setShowFieldMapping(false)
  }

  const handleFieldMappingSave = (mappings: any[]) => {
    console.log('Field mappings saved:', mappings)
    toast({
      title: "Mapping sauvegardé",
      description: `${mappings.length} mappings de champs configurés`
    })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetForm()
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            Connecter une boutique
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedPlatform ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Choisissez votre plateforme e-commerce</h3>
                  <p className="text-muted-foreground">
                    Connectez votre boutique pour synchroniser vos produits, commandes et données
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFieldMapping(true)}
                  disabled={!selectedPlatform}
                >
                  Configurer les mappings
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms
                  .sort((a, b) => b.popularity - a.popularity)
                  .map((platform) => (
                    <Card 
                      key={platform.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 hover:scale-[1.02] group"
                      onClick={() => setSelectedPlatform(platform.id)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${platform.color} text-white group-hover:scale-110 transition-transform`}>
                              {platform.icon}
                            </div>
                            <div>
                              <div className="font-semibold">{platform.name}</div>
                              <div className="text-xs text-muted-foreground font-normal">
                                {platform.popularity}% popularité
                              </div>
                            </div>
                          </div>
                          <Badge variant={
                            platform.difficulty === 'Facile' ? 'default' : 
                            platform.difficulty === 'Moyen' ? 'secondary' : 
                            'destructive'
                          }>
                            {platform.difficulty}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {platform.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {platform.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Configuration {platform.difficulty.toLowerCase()}</span>
                            <span>→ Continuer</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
              
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Sécurité et confidentialité</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Vos données de connexion sont chiffrées avec AES-256 et stockées de manière sécurisée. 
                        Nous ne stockons que les informations nécessaires à la synchronisation.
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full" />
                          Chiffrement AES-256
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full" />
                          Conformité RGPD
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-success rounded-full" />
                          Audit de sécurité
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <PlatformConnectionForm
              platform={selectedPlatform}
              onConnect={handleConnect}
              onCancel={() => setSelectedPlatform(null)}
            />
          )}
        </div>

        {/* Field Mapping Dialog */}
        <FieldMappingDialog
          open={showFieldMapping}
          onOpenChange={setShowFieldMapping}
          platform={selectedPlatform || 'shopify'}
          onSave={handleFieldMappingSave}
        />
      </DialogContent>
    </Dialog>
  )
}