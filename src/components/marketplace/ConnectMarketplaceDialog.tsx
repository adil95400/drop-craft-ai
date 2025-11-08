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
import { Store, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { connectMarketplace, isConnecting } = useMarketplaceConnections()
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation de la plateforme
    if (!platform) {
      newErrors.platform = 'Veuillez sélectionner une marketplace'
    }

    // Validation des champs communs
    if (!credentials.api_key.trim()) {
      newErrors.api_key = 'La clé API est requise'
    }

    if (!credentials.api_secret.trim()) {
      newErrors.api_secret = 'Le secret API est requis'
    }

    // Validation spécifique selon la plateforme
    if (platform === 'shopify' || platform === 'woocommerce') {
      if (!credentials.shop_url.trim()) {
        newErrors.shop_url = 'Le domaine du magasin est requis'
      } else if (!credentials.shop_url.includes('.')) {
        newErrors.shop_url = 'Format de domaine invalide'
      }
    }

    if (platform === 'etsy' || platform === 'manomano') {
      if (!credentials.shop_id.trim()) {
        newErrors.shop_id = "L'ID de la boutique est requis"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client
    if (!validateForm()) {
      toast({
        title: 'Validation échouée',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive',
      })
      return
    }

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
      setErrors({})
      if (onSuccess) onSuccess()
    } catch (error) {
      // Error is already handled by the hook
    }
  }

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
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
            <Select 
              value={platform} 
              onValueChange={(value) => {
                setPlatform(value)
                clearError('platform')
              }}
            >
              <SelectTrigger id="platform" className={errors.platform ? 'border-destructive' : ''}>
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
            {errors.platform && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.platform}</span>
              </div>
            )}
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
                  <Label htmlFor="shop_url">
                    Domaine du magasin <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shop_url"
                    placeholder="mon-magasin.myshopify.com"
                    value={credentials.shop_url}
                    onChange={(e) => {
                      setCredentials({ ...credentials, shop_url: e.target.value })
                      clearError('shop_url')
                    }}
                    className={errors.shop_url ? 'border-destructive' : ''}
                  />
                  {errors.shop_url && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.shop_url}</span>
                    </div>
                  )}
                </div>
              )}

              {(platform === 'etsy' || platform === 'manomano') && (
                <div className="space-y-2">
                  <Label htmlFor="shop_id">
                    ID de la boutique <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shop_id"
                    placeholder="Votre ID de boutique"
                    value={credentials.shop_id}
                    onChange={(e) => {
                      setCredentials({ ...credentials, shop_id: e.target.value })
                      clearError('shop_id')
                    }}
                    className={errors.shop_id ? 'border-destructive' : ''}
                  />
                  {errors.shop_id && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errors.shop_id}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="api_key">
                  Clé API <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Votre clé API"
                  value={credentials.api_key}
                  onChange={(e) => {
                    setCredentials({ ...credentials, api_key: e.target.value })
                    clearError('api_key')
                  }}
                  className={errors.api_key ? 'border-destructive' : ''}
                />
                {errors.api_key && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.api_key}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_secret">
                  Secret API <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="Votre secret API"
                  value={credentials.api_secret}
                  onChange={(e) => {
                    setCredentials({ ...credentials, api_secret: e.target.value })
                    clearError('api_secret')
                  }}
                  className={errors.api_secret ? 'border-destructive' : ''}
                />
                {errors.api_secret && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.api_secret}</span>
                  </div>
                )}
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
