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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarketplaceConnections } from '@/hooks/useMarketplaceConnections'
import { Store, Loader2 } from 'lucide-react'

const MARKETPLACE_OPTIONS = [
  { value: 'amazon', label: 'Amazon', icon: '🛒' },
  { value: 'shopify', label: 'Shopify', icon: '🛍️' },
  { value: 'woocommerce', label: 'WooCommerce', icon: '🌐' },
  { value: 'prestashop', label: 'PrestaShop', icon: '🏪' },
  { value: 'etsy', label: 'Etsy', icon: '🎨' },
  { value: 'cdiscount', label: 'Cdiscount', icon: '🛒' },
  { value: 'rakuten', label: 'Rakuten', icon: '🔴' },
  { value: 'fnac', label: 'Fnac', icon: '📚' },
]

interface ConnectMarketplaceDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ConnectMarketplaceDialog({ trigger, onSuccess }: ConnectMarketplaceDialogProps) {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState('')
  const [credentials, setCredentials] = useState({
    api_key: '',
    api_secret: '',
    shop_url: '',
    shop_id: '',
    access_token: '',
  })

  const { connectMarketplace, isConnecting } = useMarketplaceConnections()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!platform) return

    try {
      await connectMarketplace({
        platform,
        credentials: {
          api_key: credentials.api_key,
          api_secret: credentials.api_secret,
          shop_url: credentials.shop_url,
          shop_id: credentials.shop_id,
          access_token: credentials.access_token,
        },
      })
      
      setOpen(false)
      setPlatform('')
      setCredentials({
        api_key: '',
        api_secret: '',
        shop_url: '',
        shop_id: '',
        access_token: '',
      })
      if (onSuccess) onSuccess()
    } catch (error) {
      // Error is already handled by the hook
    }
  }

  const selectedMarketplace = MARKETPLACE_OPTIONS.find(m => m.value === platform)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Store className="mr-2 h-4 w-4" />
            Connecter une marketplace
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connecter une marketplace</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle marketplace pour gérer vos produits et commandes
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Marketplace</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Sélectionnez une marketplace" />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {platform && (
            <>
              {selectedMarketplace && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Connectez votre compte {selectedMarketplace.label} en fournissant vos identifiants API
                  </p>
                </div>
              )}

              {(platform === 'shopify' || platform === 'woocommerce') && (
                <div className="space-y-2">
                  <Label htmlFor="shop_url">Domaine du magasin</Label>
                  <Input
                    id="shop_url"
                    placeholder="mon-magasin.myshopify.com"
                    value={credentials.shop_url}
                    onChange={(e) =>
                      setCredentials({ ...credentials, shop_url: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              {(platform === 'etsy' || platform === 'manomano') && (
                <div className="space-y-2">
                  <Label htmlFor="shop_id">ID de la boutique</Label>
                  <Input
                    id="shop_id"
                    placeholder="Votre ID de boutique"
                    value={credentials.shop_id}
                    onChange={(e) =>
                      setCredentials({ ...credentials, shop_id: e.target.value })
                    }
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api_key">Clé API</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Votre clé API"
                  value={credentials.api_key}
                  onChange={(e) =>
                    setCredentials({ ...credentials, api_key: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">Secret API</Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="Votre secret API"
                  value={credentials.api_secret}
                  onChange={(e) =>
                    setCredentials({ ...credentials, api_secret: e.target.value })
                  }
                  required
                />
              </div>

              {platform === 'shopify' && (
                <div className="space-y-2">
                  <Label htmlFor="access_token">Token d'accès (optionnel)</Label>
                  <Input
                    id="access_token"
                    type="password"
                    placeholder="Token d'accès"
                    value={credentials.access_token}
                    onChange={(e) =>
                      setCredentials({ ...credentials, access_token: e.target.value })
                    }
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isConnecting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!platform || isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Connecter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
