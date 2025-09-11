import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Store as StoreIcon, Zap, Shield } from 'lucide-react'
import { useStores, type Store } from '@/hooks/useStores'
import { useToast } from '@/hooks/use-toast'

interface ConnectStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const platforms = [
  {
    id: 'shopify' as const,
    name: 'Shopify',
    description: 'Plateforme e-commerce complète',
    icon: '🛍️',
    features: ['API REST', 'Webhooks', 'GraphQL'],
    difficulty: 'Facile'
  },
  {
    id: 'woocommerce' as const,
    name: 'WooCommerce',
    description: 'Plugin WordPress e-commerce',
    icon: '🔌',
    features: ['API REST', 'Webhooks'],
    difficulty: 'Moyen'
  },
  {
    id: 'prestashop' as const,
    name: 'PrestaShop',
    description: 'Solution e-commerce open source',
    icon: '🏪',
    features: ['API REST', 'Modules'],
    difficulty: 'Moyen'
  },
  {
    id: 'magento' as const,
    name: 'Magento',
    description: 'Plateforme e-commerce enterprise',
    icon: '⚡',
    features: ['API REST', 'GraphQL', 'Webhooks'],
    difficulty: 'Avancé'
  }
]

export function ConnectStoreDialog({ open, onOpenChange }: ConnectStoreDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platforms[0]['id'] | null>(null)
  const [storeName, setStoreName] = useState('')
  const [domain, setDomain] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const { connectStore } = useStores()
  const { toast } = useToast()

  const handleConnect = async () => {
    if (!selectedPlatform || !storeName || !domain) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      })
      return
    }

    setIsConnecting(true)
    try {
      await connectStore({
        name: storeName,
        platform: selectedPlatform,
        domain: domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        status: 'connected',
        last_sync: null,
        products_count: 0,
        orders_count: 0,
        revenue: 0,
        currency: 'EUR',
        created_at: new Date().toISOString(),
        settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          sync_products: true,
          sync_orders: true,
          sync_customers: true
        }
      })
      
      setStoreName('')
      setDomain('')
      setSelectedPlatform(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to connect store:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const resetForm = () => {
    setStoreName('')
    setDomain('')
    setSelectedPlatform(null)
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
              <h3 className="text-lg font-semibold mb-4">Choisissez votre plateforme</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <Card 
                    key={platform.id}
                    className="cursor-pointer hover:shadow-card transition-smooth hover:border-primary/50"
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{platform.icon}</span>
                          {platform.name}
                        </div>
                        <Badge variant={platform.difficulty === 'Facile' ? 'default' : platform.difficulty === 'Moyen' ? 'secondary' : 'destructive'}>
                          {platform.difficulty}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPlatform(null)}
                >
                  ← Retour
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platforms.find(p => p.id === selectedPlatform)?.icon}</span>
                  <h3 className="text-lg font-semibold">
                    Connecter {platforms.find(p => p.id === selectedPlatform)?.name}
                  </h3>
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Informations requises
                  </CardTitle>
                  <CardDescription>
                    Ces informations nous permettront de nous connecter à votre boutique et de synchroniser vos données.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="store-name">Nom de la boutique</Label>
                    <Input
                      id="store-name"
                      placeholder="Ma boutique en ligne"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="domain">Domaine de la boutique</Label>
                    <Input
                      id="domain"
                      placeholder="monsite.com ou monsite.myshopify.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Fonctionnalités activées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      Synchronisation automatique
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      Import des produits
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      Suivi des commandes
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !storeName || !domain}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Connecter la boutique'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isConnecting}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}