import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

interface ShopifyCredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  onSuccess?: () => void
}

export function ShopifyCredentialsDialog({ 
  open, 
  onOpenChange, 
  integrationId,
  onSuccess 
}: ShopifyCredentialsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState({
    shop_domain: '',
    access_token: ''
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Valider les données
      if (!credentials.shop_domain || !credentials.access_token) {
        throw new Error('Tous les champs sont obligatoires')
      }

      // Nettoyer le domaine (retirer https:// et .myshopify.com si présent)
      let cleanDomain = credentials.shop_domain.replace(/^https?:\/\//, '')
      if (cleanDomain.includes('.myshopify.com')) {
        cleanDomain = cleanDomain.replace('.myshopify.com', '')
      }

      // Mettre à jour l'intégration avec les credentials
      const { error } = await supabase
        .from('store_integrations')
        .update({
          credentials: {
            shop_domain: cleanDomain + '.myshopify.com',
            access_token: credentials.access_token
          },
          store_name: cleanDomain,
          store_url: `https://${cleanDomain}.myshopify.com`,
          connection_status: 'connected'
        })
        .eq('id', integrationId)

      if (error) throw error

      toast({
        title: "Credentials configurés",
        description: "Vos credentials Shopify ont été sauvegardés avec succès"
      })

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder les credentials",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurer Shopify</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}