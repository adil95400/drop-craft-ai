import { AdvancedSyncInterface } from '@/components/sync/AdvancedSyncInterface'
import { ShopifySyncManager } from '@/components/sync/ShopifySyncManager'
import { SEO } from '@/components/SEO'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdvancedSync() {
  return (
    <>
      <SEO
        title="Synchronisation Avancée | Shopopti+"
        description="Gestion complète des variantes, webhooks et synchronisation automatique avec Shopify et WooCommerce"
        path="/sync"
        keywords="synchronisation, Shopify, WooCommerce, variantes, webhooks, automatisation"
      />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Synchronisation Avancée</h1>
        
        <Tabs defaultValue="shopify" className="w-full">
          <TabsList>
            <TabsTrigger value="shopify">Shopify</TabsTrigger>
            <TabsTrigger value="other">Autres Plateformes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="shopify" className="mt-6">
            <ShopifySyncManager />
          </TabsContent>
          
          <TabsContent value="other" className="mt-6">
            <AdvancedSyncInterface />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}