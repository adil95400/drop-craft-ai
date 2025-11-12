import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, RefreshCw } from 'lucide-react'
import { useStoreIntegrations } from '@/hooks/useStoreIntegrations'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export default function ImportedProductsList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { connectedIntegrations, refetch } = useStoreIntegrations()
  const [isSyncing, setIsSyncing] = useState(false)

  const shopifyIntegration = connectedIntegrations.find(i => i.platform_type === 'shopify')

  const handleShopifySync = async () => {
    if (!shopifyIntegration) {
      toast({
        title: "Aucune boutique Shopify",
        description: "Veuillez d'abord connecter votre boutique Shopify",
        variant: "destructive"
      })
      return
    }

    setIsSyncing(true)
    try {
      const { data, error } = await supabase.functions.invoke('shopify-sync', {
        body: { 
          integrationId: shopifyIntegration.id,
          type: 'products'
        }
      })

      if (error) throw error

      toast({
        title: "Synchronisation réussie",
        description: data.message || `${data.imported} produits synchronisés`
      })
      
      refetch()
    } catch (error: any) {
      toast({
        title: "Erreur de synchronisation",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/import/manage')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Produits Importés</h1>
            <p className="text-muted-foreground">
              Liste complète de tous vos produits importés
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {shopifyIntegration && (
            <Button 
              onClick={handleShopifySync}
              disabled={isSyncing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Sync Shopify'}
            </Button>
          )}
          <Button onClick={() => navigate('/import/quick')}>
            Nouvel import
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Catalogue Importé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancedImportResults />
        </CardContent>
      </Card>
    </div>
  )
}
