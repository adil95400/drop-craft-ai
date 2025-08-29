import { AdvancedSyncInterface } from '@/components/sync/AdvancedSyncInterface'
import { SEO } from '@/components/SEO'

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
        <AdvancedSyncInterface />
      </div>
    </>
  )
}