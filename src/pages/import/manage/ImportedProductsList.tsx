import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdvancedImportResults } from '@/components/import/AdvancedImportResults'
import { useNavigate } from 'react-router-dom'
import { Package, RefreshCw } from 'lucide-react'
import { useStoreIntegrations } from '@/hooks/useStoreIntegrations'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

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
    <ChannablePageWrapper
      title="Produits Importés"
      description="Liste complète de tous vos produits importés"
      heroImage="import"
      badge={{ label: 'Catalogue', icon: Package }}
      actions={
        <div className="flex gap-2">
          {shopifyIntegration && (
            <Button onClick={handleShopifySync} disabled={isSyncing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Sync Shopify'}
            </Button>
          )}
          <Button onClick={() => navigate('/import/quick')}>Nouvel import</Button>
        </div>
      }
    >

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
    </ChannablePageWrapper>
  )
}
